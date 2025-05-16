import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle,
  Clock,
  Trash2,
  Bell,
  Database,
  PillIcon,
  Calendar,
  CheckCircle2,
  MoreHorizontal,
  Edit3,
  CalendarClock,
  Info,
  ChartArea,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import {
  scheduleMedicationReminder,
  askNotificationPermission,
} from "@/utils/notificationUtils";
import { onMessageListener } from "@/utils/firebase";
import { toast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface TabletReminderProps {
  language: Language;
}

interface MedicationTime {
  id: string;
  hours: number;
  minutes: number;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  customTime: boolean;

  hours?: number;
  minutes?: number;
  recurring?: boolean;
  description?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[];
  times?: MedicationTime[];
  lastTaken?: string;
  refillReminder?: boolean;
  quantity?: number;
  refillAt?: number;
  medicationType?: string;
  withFood?: boolean;
  withWater?: boolean;
  imageUrl?: string;
}

// Define interface for Firebase message
interface FirebaseMessage {
  notification?: {
    title: string;
    body: string;
  };
  data?: {
    medicationId?: string;
    [key: string]: any;
  };
}

const TabletReminder: React.FC<TabletReminderProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [activeMedication, setActiveMedication] = useState<Medication | null>(
    null
  );
  const [adherenceRate, setAdherenceRate] = useState(82);
  const [viewTab, setViewTab] = useState("all");
  const [isEditingMedication, setIsEditingMedication] = useState(false);
  const [multipleTimeMode, setMultipleTimeMode] = useState(false);
  const [fbNotification, setFbNotification] = useState<FirebaseMessage | null>(
    null
  );

  const [newMedication, setNewMedication] = useState<Medication>({
    id: "",
    name: "",
    dosage: "",
    schedule: "morning",
    customTime: false,
    hours: 8,
    minutes: 0,
    recurring: true,
    description: "",
    color: "#4f46e5",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    daysOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    times: [],
    medicationType: "pill",
  });

  // IndexedDB setup
  const DB_NAME = "MedicationDB";
  const STORE_NAME = "medications";

  const openDatabase = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }, []);

  const saveToDatabase = useCallback(
    async (medication: Medication) => {
      try {
        const db = await openDatabase();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.put(medication);
        return true;
      } catch (error) {
        console.error("Error saving to database:", error);
        return false;
      }
    },
    [openDatabase]
  );

  const loadFromDatabase = useCallback(async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      return new Promise<Medication[]>((resolve, reject) => {
        request.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result);
        };
        request.onerror = (event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error("Error loading from database:", error);
      return [];
    }
  }, [openDatabase]);

  const deleteFromDatabase = useCallback(
    async (id: string) => {
      try {
        const db = await openDatabase();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.delete(id);
        return true;
      } catch (error) {
        console.error("Error deleting from database:", error);
        return false;
      }
    },
    [openDatabase]
  );

  // Initialize database and load medications
  useEffect(() => {
    const initDatabase = async () => {
      try {
        const db = await openDatabase();
        db.close();
        setIsDbReady(true);

        // Load existing medications
        const savedMedications = await loadFromDatabase();
        setMedications(savedMedications);
      } catch (error) {
        console.error("Database initialization failed:", error);
        toast.error("Failed to initialize medication database");
      }
    };

    initDatabase();
  }, [openDatabase, loadFromDatabase]);

  // Check notification permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await askNotificationPermission();
      setNotificationsEnabled(hasPermission);
    };
    checkPermission();
  }, []);

  // Listen for Firebase Cloud Messages
  useEffect(() => {
    const messageListener = onMessageListener();
    messageListener
      .then((payload: any) => {
        console.log("Received FCM message:", payload);
        setFbNotification(payload);

        // Show toast notification
        if (payload?.notification?.title) {
          toast(payload.notification.title, {
            description: payload.notification.body,
            action: {
              label: "Take Now",
              onClick: () => handleMedicationAction(payload),
            },
          });
        }
      })
      .catch((err) => {
        console.log("Error receiving FCM message:", err);
      });

    return () => {
      // No cleanup needed as onMessageListener returns a promise, not a function
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    const handleMedicationAction = (event: Event) => {
      const customEvent = event as CustomEvent<{
        action: string;
        medicationId: string;
      }>;

      if (
        customEvent.detail.action === "taken" &&
        customEvent.detail.medicationId
      ) {
        const medication = medications.find(
          (med) => med.id === customEvent.detail.medicationId
        );
        if (medication) {
          handleMarkAsTaken(medication);
        }
      }
    };

    window.addEventListener("medication-action", handleMedicationAction);

    return () => {
      window.removeEventListener("medication-action", handleMedicationAction);
    };
  }, [medications]);

  const handleMedicationAction = (payload: FirebaseMessage) => {
    if (payload?.data?.medicationId) {
      const medication = medications.find(
        (med) => med.id === payload.data!.medicationId
      );
      if (medication) {
        handleMarkAsTaken(medication);
      }
    }
  };

  const handleRequestPermission = async () => {
    const granted = await askNotificationPermission();
    setNotificationsEnabled(granted);

    if (granted) {
      toast.success("Notification permissions granted!");
    } else {
      toast.error(
        "Please enable notifications in your browser settings to receive Medication Cares."
      );
    }
  };

  const handleAddMedicationTime = () => {
    const newTime: MedicationTime = {
      id: Date.now().toString(),
      hours: 8,
      minutes: 0,
    };

    setNewMedication({
      ...newMedication,
      times: [...(newMedication.times || []), newTime],
    });
  };

  const handleRemoveMedicationTime = (timeId: string) => {
    if (!newMedication.times) return;

    setNewMedication({
      ...newMedication,
      times: newMedication.times.filter((time) => time.id !== timeId),
    });
  };

  const handleTimeChange = (
    timeId: string,
    field: "hours" | "minutes",
    value: number
  ) => {
    if (!newMedication.times) return;

    setNewMedication({
      ...newMedication,
      times: newMedication.times.map((time) =>
        time.id === timeId ? { ...time, [field]: value } : time
      ),
    });
  };

  const handleAddMedication = async () => {
    if (!newMedication.name || !newMedication.dosage) {
      toast.error("Please fill all required fields");
      return;
    }

    const medication = {
      ...newMedication,
      id:
        isEditingMedication && activeMedication
          ? activeMedication.id
          : Date.now().toString(),
    };

    if (!notificationsEnabled) {
      toast.warning(
        "Notifications not enabled. Enable them to receive reminders."
      );
    }

    // Schedule notifications
    if (notificationsEnabled) {
      if (multipleTimeMode && medication.times && medication.times.length > 0) {
        // Schedule multiple notifications
        medication.times.forEach((time) => {
          scheduleMedicationReminder(
            language,
            medication.name,
            medication.dosage,
            "custom",
            time.hours,
            time.minutes,
            medication.id // Pass the medicationId
          );
        });
      } else {
        // Schedule single notification
        scheduleMedicationReminder(
          language,
          medication.name,
          medication.dosage,
          medication.schedule,
          medication.customTime ? medication.hours : undefined,
          medication.customTime ? medication.minutes : undefined,
          medication.id // Pass the medicationId
        );
      }
    }

    // Save to database
    const saved = await saveToDatabase(medication);

    if (saved) {
      if (isEditingMedication && activeMedication) {
        // Update existing medication
        setMedications(
          medications.map((med) =>
            med.id === medication.id ? medication : med
          )
        );
        setIsEditingMedication(false);
        setActiveMedication(null);
      } else {
        // Add new medication
        setMedications([...medications, medication]);
      }

      // Reset form
      setNewMedication({
        id: "",
        name: "",
        dosage: "",
        schedule: "morning",
        customTime: false,
        hours: 8,
        minutes: 0,
        recurring: true,
        description: "",
        color: "#4f46e5",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        daysOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        times: [],
        medicationType: "pill",
        withFood: false,
        withWater: true,
      });
      setIsAddingMedication(false);
      setMultipleTimeMode(false);

      toast.success(
        `${medication.name} ${isEditingMedication ? "updated" : "reminder set"}`
      );
    } else {
      toast.error(
        `Failed to ${
          isEditingMedication ? "update" : "save"
        } medication to database`
      );
    }
  };

  const handleDeleteMedication = async (id: string) => {
    // Remove from database
    const deleted = await deleteFromDatabase(id);

    if (deleted) {
      // Remove from state
      setMedications(medications.filter((med) => med.id !== id));
      toast.success("Medication Care removed");
      if (activeMedication && activeMedication.id === id) {
        setIsViewDetailsOpen(false);
        setActiveMedication(null);
      }
    } else {
      toast.error("Failed to remove medication from database");
    }
  };

  const handleEditMedication = (medication: Medication) => {
    setActiveMedication(medication);
    setNewMedication({ ...medication });
    setIsEditingMedication(true);
    setIsViewDetailsOpen(false);
    setIsAddingMedication(true);
    setMultipleTimeMode(medication.times && medication.times.length > 0);
  };

  const handleViewDetails = (medication: Medication) => {
    setActiveMedication(medication);
    setIsViewDetailsOpen(true);
  };

  const handleMarkAsTaken = async (medication: Medication) => {
    const updated = {
      ...medication,
      lastTaken: new Date().toISOString(),
    };

    const saved = await saveToDatabase(updated);
    if (saved) {
      setMedications(
        medications.map((med) => (med.id === medication.id ? updated : med))
      );
      toast.success(`${medication.name} marked as taken!`);

      // Update active medication if viewing details
      if (activeMedication && activeMedication.id === medication.id) {
        setActiveMedication(updated);
      }
    }
  };

  const handleCustomTimeChange = (isCustom: boolean) => {
    setNewMedication({
      ...newMedication,
      customTime: isCustom,
      hours: isCustom ? 8 : undefined,
      minutes: isCustom ? 0 : undefined,
    });
  };

  const handleToggleMultipleTimeMode = (isMultiple: boolean) => {
    setMultipleTimeMode(isMultiple);
    if (
      isMultiple &&
      (!newMedication.times || newMedication.times.length === 0)
    ) {
      handleAddMedicationTime();
    }
  };

  const handleDayToggle = (day: string) => {
    const currentDays = newMedication.daysOfWeek || [];
    if (currentDays.includes(day)) {
      setNewMedication({
        ...newMedication,
        daysOfWeek: currentDays.filter((d) => d !== day),
      });
    } else {
      setNewMedication({
        ...newMedication,
        daysOfWeek: [...currentDays, day],
      });
    }
  };

  const scheduleOptions = [
    { value: "morning", label: strings.morning },
    { value: "afternoon", label: strings.afternoon },
    { value: "evening", label: strings.evening },
    { value: "night", label: strings.night },
  ];

  const medicationTypes = [
    { value: "pill", label: "Pill/Tablet" },
    { value: "liquid", label: "Liquid" },
    { value: "injection", label: "Injection" },
    { value: "inhaler", label: "Inhaler" },
    { value: "topical", label: "Topical" },
    { value: "drops", label: "Drops" },
    { value: "other", label: "Other" },
  ];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const getMedicationsByStatus = () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    switch (viewTab) {
      case "today":
        return medications.filter((med) => {
          if (!med.startDate || med.startDate <= today) {
            if (!med.endDate || med.endDate >= today) {
              return true;
            }
          }
          return false;
        });
      case "active":
        return medications.filter(
          (med) =>
            !med.lastTaken ||
            new Date(med.lastTaken).getDate() !== now.getDate()
        );
      case "taken":
        return medications.filter(
          (med) =>
            med.lastTaken && new Date(med.lastTaken).getDate() === now.getDate()
        );
      default:
        return medications;
    }
  };

  const formatTimeDisplay = (medication: Medication) => {
    if (medication.times && medication.times.length > 0) {
      return medication.times
        .map((time) => {
          const formattedHours = time.hours % 12 || 12;
          const ampm = time.hours >= 12 ? "PM" : "AM";
          const formattedMinutes =
            time.minutes < 10 ? `0${time.minutes}` : time.minutes;
          return `${formattedHours}:${formattedMinutes} ${ampm}`;
        })
        .join(", ");
    }

    if (
      medication.customTime &&
      medication.hours !== undefined &&
      medication.minutes !== undefined
    ) {
      const formattedHours = medication.hours % 12 || 12;
      const ampm = medication.hours >= 12 ? "PM" : "AM";
      const formattedMinutes =
        medication.minutes < 10 ? `0${medication.minutes}` : medication.minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } else {
      const scheduleLabel = scheduleOptions.find(
        (opt) => opt.value === medication.schedule
      )?.label;
      return scheduleLabel;
    }
  };

  const filteredMedications = getMedicationsByStatus();

  return (
    <div className="space-y-4 p-5">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <PillIcon className="h-6 w-6 mr-2 text-health-primary" />
          {strings.tabletReminder}
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-health-primary text-white">
            {medications.length}
          </span>
        </h2>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setIsAddingMedication(!isAddingMedication);
              setIsEditingMedication(false);
              setNewMedication({
                id: "",
                name: "",
                dosage: "",
                schedule: "morning",
                customTime: false,
                hours: 8,
                minutes: 0,
                recurring: true,
                description: "",
                color: "#4f46e5",
                startDate: new Date().toISOString().split("T")[0],
                endDate: "",
                daysOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                times: [],
                medicationType: "pill",
                withFood: false,
                withWater: true,
              });
            }}
            variant="ghost"
            className="text-health-primary hover:text-health-primary/90 hover:bg-health-light flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-1" />
            {strings.addMedication}
          </Button>
          {isDbReady && (
            <Button
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
              title="Data saved locally"
            >
              <Database className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {!notificationsEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-amber-800">
              Enable notifications to receive Medication Cares via Firebase
              Cloud Messaging
            </p>
          </div>
          <Button
            onClick={handleRequestPermission}
            variant="outline"
            className="border-amber-400 text-amber-700 hover:bg-amber-100"
          >
            Enable Notifications
          </Button>
        </div>
      )}

      {!isDbReady && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Initializing medication database...</p>
        </div>
      )}

      {/* Adherence Dashboard */}
      {medications.length > 0 && (
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <ChartArea className="h-5 w-5 mr-2 text-health-primary" />
              Adherence Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-lg font-bold text-health-primary">
                  {filteredMedications.filter((m) => !m.lastTaken).length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <p className="text-sm font-medium text-gray-600">Taken</p>
                <p className="text-lg font-bold text-green-600">
                  {
                    filteredMedications.filter(
                      (m) =>
                        m.lastTaken &&
                        new Date(m.lastTaken).toDateString() ===
                          new Date().toDateString()
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-50">
                <p className="text-sm font-medium text-gray-600">Missed</p>
                <p className="text-lg font-bold text-red-600">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medication Form */}
      {isAddingMedication && (
        <Card className="border border-health-primary/20 shadow-sm bg-gradient-to-r from-white to-health-light/30">
          <CardHeader className="pb-3 border-b border-health-primary/10">
            <CardTitle className="text-lg flex items-center">
              {isEditingMedication ? (
                <>
                  <Edit3 className="h-5 w-5 mr-2 text-health-primary" />
                  Edit Medication
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 mr-2 text-health-primary" />
                  {strings.addMedication}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                    <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                    {strings.medicationName} *
                  </label>
                  <Input
                    value={newMedication.name}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        name: e.target.value,
                      })
                    }
                    className="input-health"
                    placeholder="e.g. Aspirin, Paracetamol"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                    <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                    {strings.dosage} *
                  </label>
                  <Input
                    value={newMedication.dosage}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        dosage: e.target.value,
                      })
                    }
                    className="input-health"
                    placeholder="e.g. 1 tablet, 5ml"
                  />
                </div>
              </div>

              <div className="grid  gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                    <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                    Medication Type
                  </label>
                  <Select
                    value={newMedication.medicationType || "pill"}
                    onValueChange={(value) =>
                      setNewMedication({
                        ...newMedication,
                        medicationType: value,
                      })
                    }
                  >
                    <SelectTrigger className="input-health">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className=" gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                    <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={newMedication.startDate || ""}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        startDate: e.target.value,
                      })
                    }
                    className="input-health"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                    <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                    End Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={newMedication.endDate || ""}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        endDate: e.target.value,
                      })
                    }
                    className="input-health"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                  <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                        newMedication.daysOfWeek?.includes(day)
                          ? "bg-health-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                      onClick={() => handleDayToggle(day)}
                    >
                      {day.substring(0, 3)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="multiple-times"
                    checked={multipleTimeMode}
                    onCheckedChange={handleToggleMultipleTimeMode}
                  />
                  <Label
                    htmlFor="multiple-times"
                    className="font-medium text-health-primary"
                  >
                    Set multiple times
                  </Label>
                </div>

                {multipleTimeMode ? (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                      <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                      Medication Times
                    </label>

                    {newMedication.times &&
                      newMedication.times.map((time, index) => (
                        <div
                          key={time.id}
                          className="flex items-center space-x-2"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Select
                              value={time.hours.toString()}
                              onValueChange={(value) =>
                                handleTimeChange(
                                  time.id,
                                  "hours",
                                  parseInt(value)
                                )
                              }
                            >
                              <SelectTrigger className="input-health">
                                <SelectValue placeholder="Hours" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i < 10 ? `0${i}` : i}{" "}
                                    {i >= 12 ? "PM" : "AM"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={time.minutes.toString()}
                              onValueChange={(value) =>
                                handleTimeChange(
                                  time.id,
                                  "minutes",
                                  parseInt(value)
                                )
                              }
                            >
                              <SelectTrigger className="input-health">
                                <SelectValue placeholder="Minutes" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 60 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i < 10 ? `0${i}` : i}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMedicationTime(time.id)}
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                            disabled={
                              newMedication.times &&
                              newMedication.times.length <= 1
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMedicationTime}
                      className="mt-2 text-health-primary border-health-primary/50 hover:bg-health-light"
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add another time
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div></div>

                    <div>
                      {newMedication.customTime && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Select
                            value={newMedication.hours?.toString() || "8"}
                            onValueChange={(value) =>
                              setNewMedication({
                                ...newMedication,
                                hours: parseInt(value),
                              })
                            }
                          >
                            <SelectTrigger className="input-health">
                              <SelectValue placeholder="Hours" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i < 10 ? `0${i}` : i} {i >= 12 ? "PM" : "AM"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={newMedication.minutes?.toString() || "0"}
                            onValueChange={(value) =>
                              setNewMedication({
                                ...newMedication,
                                minutes: parseInt(value),
                              })
                            }
                          >
                            <SelectTrigger className="input-health">
                              <SelectValue placeholder="Minutes" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i < 10 ? `0${i}` : i}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 border-t border-health-primary/10 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingMedication(false);
                setIsEditingMedication(false);
              }}
              className="border-gray-300"
            >
              {strings.cancel}
            </Button>
            <Button
              onClick={handleAddMedication}
              className="bg-health-primary hover:bg-health-primary/90"
            >
              {isEditingMedication ? strings.update : strings.addMedication}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Medication List */}
      <div className="space-y-4">
        {medications.length === 0 && !isAddingMedication && (
          <div className="text-center p-6 bg-white rounded-lg border border-dashed border-gray-300">
            <PillIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {strings.noMedications}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {strings.noMedicationsDesc}
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setIsAddingMedication(true)}
                className="bg-health-primary hover:bg-health-primary/90"
                size="lg"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                {strings.addMedication}
              </Button>
            </div>
          </div>
        )}

        {medications.length > 0 && (
          <>
            <Tabs
              defaultValue="all"
              value={viewTab}
              onValueChange={setViewTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-health-primary data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="today"
                  className="data-[state=active]:bg-health-primary data-[state=active]:text-white"
                >
                  Today
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:bg-health-primary data-[state=active]:text-white"
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger
                  value="taken"
                  className="data-[state=active]:bg-health-primary data-[state=active]:text-white"
                >
                  Taken
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="grid gap-4 grid-cols-1">
                  {filteredMedications.map((medication) => (
                    <MedicationCard
                      key={medication.id}
                      medication={medication}
                      formatTimeDisplay={formatTimeDisplay}
                      onDelete={handleDeleteMedication}
                      onEdit={handleEditMedication}
                      onViewDetails={handleViewDetails}
                      onMarkAsTaken={handleMarkAsTaken}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="today" className="mt-0">
                <div className="grid gap-4 grid-cols-1">
                  {filteredMedications.map((medication) => (
                    <MedicationCard
                      key={medication.id}
                      medication={medication}
                      formatTimeDisplay={formatTimeDisplay}
                      onDelete={handleDeleteMedication}
                      onEdit={handleEditMedication}
                      onViewDetails={handleViewDetails}
                      onMarkAsTaken={handleMarkAsTaken}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="active" className="mt-0">
                <div className="grid gap-4 grid-cols-1">
                  {filteredMedications.map((medication) => (
                    <MedicationCard
                      key={medication.id}
                      medication={medication}
                      formatTimeDisplay={formatTimeDisplay}
                      onDelete={handleDeleteMedication}
                      onEdit={handleEditMedication}
                      onViewDetails={handleViewDetails}
                      onMarkAsTaken={handleMarkAsTaken}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="taken" className="mt-0">
                <div className="grid gap-4 grid-cols-1">
                  {filteredMedications.map((medication) => (
                    <MedicationCard
                      key={medication.id}
                      medication={medication}
                      formatTimeDisplay={formatTimeDisplay}
                      onDelete={handleDeleteMedication}
                      onEdit={handleEditMedication}
                      onViewDetails={handleViewDetails}
                      onMarkAsTaken={handleMarkAsTaken}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Medication Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-semibold">
              <div
                className="h-4 w-4 rounded-full mr-2"
                style={{
                  backgroundColor: activeMedication?.color || "#4f46e5",
                }}
              ></div>
              {activeMedication?.name}
            </DialogTitle>
          </DialogHeader>

          {activeMedication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Dosage</p>
                  <p className="text-md font-medium">
                    {activeMedication.dosage}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-md font-medium capitalize">
                    {activeMedication.medicationType || "Pill"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Schedule</p>
                <p className="text-md font-medium flex items-center">
                  <CalendarClock className="h-4 w-4 mr-2 text-health-primary" />
                  {formatTimeDisplay(activeMedication)}
                </p>
              </div>

              {activeMedication.daysOfWeek &&
                activeMedication.daysOfWeek.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Days</p>
                    <div className="flex flex-wrap gap-1">
                      {activeMedication.daysOfWeek.map((day) => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day.substring(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {activeMedication.description && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {activeMedication.description}
                  </p>
                </div>
              )}

              {activeMedication.lastTaken && (
                <div className="p-3 bg-green-50 rounded-lg flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      Last taken
                    </p>
                    <p className="text-sm text-green-600">
                      {new Date(activeMedication.lastTaken).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex space-x-2 justify-between">
                <Button
                  onClick={() => handleMarkAsTaken(activeMedication)}
                  className="bg-health-primary hover:bg-health-primary/90 flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Taken
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDetailsOpen(false);
                    handleEditMedication(activeMedication);
                  }}
                  variant="outline"
                  className="border-health-primary text-health-primary hover:bg-health-light"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// MedicationCard Component
interface MedicationCardProps {
  medication: Medication;
  formatTimeDisplay: (medication: Medication) => string;
  onDelete: (id: string) => void;
  onEdit: (medication: Medication) => void;
  onViewDetails: (medication: Medication) => void;
  onMarkAsTaken: (medication: Medication) => void;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  formatTimeDisplay,
  onDelete,
  onEdit,
  onViewDetails,
  onMarkAsTaken,
}) => {
  const isToday = medication.lastTaken
    ? new Date(medication.lastTaken).toDateString() ===
      new Date().toDateString()
    : false;

  const getMedicationIcon = (type: string = "pill") => {
    switch (type) {
      case "liquid":
        return <span className="text-lg">💧</span>;
      case "injection":
        return <span className="text-lg">💉</span>;
      case "inhaler":
        return <span className="text-lg">💨</span>;
      case "topical":
        return <span className="text-lg">🧴</span>;
      case "drops":
        return <span className="text-lg">👁️</span>;
      default:
        return <span className="text-lg">💊</span>;
    }
  };

  return (
    <Card
      className={`border-l-4 shadow-sm transition duration-200 ${
        isToday ? "bg-green-50 border-green-400" : "bg-white hover:bg-gray-50"
      }`}
      style={{ borderLeftColor: medication.color || "#4f46e5" }}
    >
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center bg-health-light"
              style={{
                backgroundColor: `${medication.color}20` || "#4f46e520",
              }}
            >
              {getMedicationIcon(medication.medicationType)}
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 text-md flex items-center">
                {medication.name}
                {isToday && (
                  <span className="ml-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">{medication.dosage}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="text-right mr-2">
              <p className="text-sm font-medium flex items-center justify-end">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                <span className="text-gray-700">
                  {formatTimeDisplay(medication)}
                </span>
              </p>
              {medication.withFood && (
                <span className="text-xs text-gray-500">With food</span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(medication)}>
                  <Info className="h-4 w-4 mr-2" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMarkAsTaken(medication)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Taken
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(medication)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(medication.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {!isToday && (
            <Button
              size="sm"
              className="bg-health-primary hover:bg-health-primary/90 h-8"
              onClick={() => onMarkAsTaken(medication)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Take
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-8 border-gray-300"
            onClick={() => onViewDetails(medication)}
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TabletReminder;
