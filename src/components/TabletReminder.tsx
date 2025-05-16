import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle,
  Clock,
  Trash2,
  Bell,
  Database,
  PillIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TabletReminderProps {
  language: Language;
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
}

const TabletReminder: React.FC<TabletReminderProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [newMedication, setNewMedication] = useState<{
    name: string;
    dosage: string;
    schedule: string;
    customTime: boolean;
    hours?: number;
    minutes?: number;
    recurring?: boolean;
  }>({
    name: "",
    dosage: "",
    schedule: "morning",
    customTime: false,
    hours: 8,
    minutes: 0,
    recurring: true,
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

  const handleRequestPermission = async () => {
    const granted = await askNotificationPermission();
    setNotificationsEnabled(granted);

    if (granted) {
      toast.success("Notification permissions granted!");
    } else {
      toast.error(
        "Please enable notifications in your browser settings to receive medication reminders."
      );
    }
  };

  const handleAddMedication = async () => {
    if (!newMedication.name || !newMedication.dosage) {
      toast("Please fill all required fields");
      return;
    }

    const medication = {
      id: Date.now().toString(),
      ...newMedication,
    };

    if (!notificationsEnabled) {
      toast.warning(
        "Notifications not enabled. Enable them to receive reminders."
      );
    }

    // Schedule notification
    if (notificationsEnabled) {
      scheduleMedicationReminder(
        language,
        medication.name,
        medication.dosage,
        medication.schedule,
        medication.customTime ? medication.hours : undefined,
        medication.customTime ? medication.minutes : undefined
      );
    }

    // Save to database
    const saved = await saveToDatabase(medication);

    if (saved) {
      setMedications([...medications, medication]);
      setNewMedication({
        name: "",
        dosage: "",
        schedule: "morning",
        customTime: false,
        hours: 8,
        minutes: 0,
        recurring: true,
      });
      setIsAddingMedication(false);

      toast.success(
        `${medication.name} reminder set for ${
          medication.customTime
            ? `${medication.hours}:${medication.minutes < 10 ? "0" : ""}${
                medication.minutes
              }`
            : medication.schedule
        }`
      );
    } else {
      toast.error("Failed to save medication to database");
    }
  };

  const handleDeleteMedication = async (id: string) => {
    // Remove from database
    const deleted = await deleteFromDatabase(id);

    if (deleted) {
      // Remove from state
      setMedications(medications.filter((med) => med.id !== id));
      toast.success("Medication reminder removed");
    } else {
      toast.error("Failed to remove medication from database");
    }
  };

  const scheduleOptions = [
    { value: "morning", label: strings.morning },
    { value: "afternoon", label: strings.afternoon },
    { value: "evening", label: strings.evening },
    { value: "night", label: strings.night },
  ];

  const handleCustomTimeChange = (isCustom: boolean) => {
    setNewMedication({
      ...newMedication,
      customTime: isCustom,
      hours: isCustom ? 8 : undefined,
      minutes: isCustom ? 0 : undefined,
    });
  };

  return (
    <div className="space-y-4">
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
            onClick={() => setIsAddingMedication(!isAddingMedication)}
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
              Enable notifications to receive medication reminders
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

      {isAddingMedication && (
        <Card className="border border-health-primary/20 shadow-sm bg-gradient-to-r from-white to-health-light/30">
          <CardHeader className="pb-3 border-b border-health-primary/10">
            <CardTitle className="text-lg flex items-center">
              <PlusCircle className="h-5 w-5 mr-2 text-health-primary" />
              {strings.addMedication}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                  <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                  {strings.medicationName} *
                </label>
                <Input
                  value={newMedication.name}
                  onChange={(e) =>
                    setNewMedication({ ...newMedication, name: e.target.value })
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

              <div className="flex items-center space-x-2 mb-2 p-2 rounded-md bg-health-light/50">
                <Switch
                  id="custom-time"
                  checked={newMedication.customTime}
                  onCheckedChange={handleCustomTimeChange}
                />
                <Label htmlFor="custom-time">Set custom time</Label>
              </div>

              <div className="flex items-center space-x-2 mb-2 p-2 rounded-md bg-health-light/50">
                <Switch
                  id="recurring"
                  checked={newMedication.recurring ?? true}
                  onCheckedChange={(checked) =>
                    setNewMedication({ ...newMedication, recurring: checked })
                  }
                />
                <Label htmlFor="recurring">Recurring reminder</Label>
              </div>

              {newMedication.customTime ? (
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                      <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                      Hours *
                    </label>
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
                  </div>

                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                      <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                      Minutes *
                    </label>
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
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                    <span className="h-2 w-2 rounded-full bg-health-primary mr-2"></span>
                    {strings.schedule} *
                  </label>
                  <Select
                    value={newMedication.schedule}
                    onValueChange={(value) =>
                      setNewMedication({ ...newMedication, schedule: value })
                    }
                  >
                    <SelectTrigger className="input-health">
                      <SelectValue placeholder={strings.schedule} />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingMedication(false)}
                >
                  {strings.cancel}
                </Button>
                <Button
                  onClick={handleAddMedication}
                  className="bg-health-primary hover:bg-health-primary/90"
                >
                  {strings.save}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {medications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gradient-to-b from-white to-health-light/30">
          <Clock className="mx-auto h-12 w-12 text-health-primary animate-pulse-gentle" />
          <p className="mt-2 text-gray-500">No medication reminders set yet.</p>
          <Button
            onClick={() => setIsAddingMedication(true)}
            variant="link"
            className="mt-2 text-health-primary"
          >
            {strings.addMedication}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map((medication) => {
            let timeDisplay;
            if (
              medication.customTime &&
              medication.hours !== undefined &&
              medication.minutes !== undefined
            ) {
              const formattedHours = medication.hours % 12 || 12;
              const ampm = medication.hours >= 12 ? "PM" : "AM";
              const formattedMinutes =
                medication.minutes < 10
                  ? `0${medication.minutes}`
                  : medication.minutes;
              timeDisplay = `${formattedHours}:${formattedMinutes} ${ampm}`;
            } else {
              const scheduleLabel = scheduleOptions.find(
                (opt) => opt.value === medication.schedule
              )?.label;
              timeDisplay = scheduleLabel;
            }

            return (
              <Card
                key={medication.id}
                className="overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-lg border-health-primary/10"
              >
                <div className="h-2 bg-health-primary"></div>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{medication.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {medication.dosage}
                      </p>
                      <div className="flex items-center mt-2">
                        <Clock className="h-4 w-4 text-health-primary mr-1" />
                        <span className="text-sm health-badge-blue">
                          {timeDisplay}
                        </span>
                        {!medication.recurring && (
                          <span className="ml-2 text-xs text-gray-500">
                            (One-time)
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-health-danger hover:bg-health-danger/10 rounded-full h-8 w-8"
                      onClick={() => handleDeleteMedication(medication.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TabletReminder;
