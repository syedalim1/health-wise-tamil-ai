import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Check, X, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import { toast } from "@/components/ui/sonner";

interface MedicationCalendarProps {
  language: Language;
}

interface MedicationTaken {
  id: string;
  date: Date;
  medicationId: string;
  medicationName: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
}

const MedicationCalendar: React.FC<MedicationCalendarProps> = ({
  language,
}) => {
  const strings = getLanguageStrings(language);
  const [date, setDate] = useState<Date>(new Date());
  const [medications, setMedications] = useState<
    { id: string; name: string }[]
  >([]);
  const [medicationsTaken, setMedicationsTaken] = useState<MedicationTaken[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<string>("");

  // Database functions
  const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("MedicationDB", 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create medications object store if it doesn't exist
        if (!db.objectStoreNames.contains("medications")) {
          db.createObjectStore("medications", { keyPath: "id" });
        }

        // Create medication taken log object store if it doesn't exist
        if (!db.objectStoreNames.contains("medicationTaken")) {
          db.createObjectStore("medicationTaken", { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  };

  const loadMedications = async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction("medications", "readonly");
      const store = transaction.objectStore("medications");
      const request = store.getAll();

      return new Promise<{ id: string; name: string }[]>((resolve, reject) => {
        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result.map(
            (med: any) => ({
              id: med.id,
              name: med.name,
            })
          );
          resolve(result);
        };
        request.onerror = (event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error("Error loading medications:", error);
      return [];
    }
  };

  const loadMedicationTaken = async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction("medicationTaken", "readonly");
      const store = transaction.objectStore("medicationTaken");
      const request = store.getAll();

      return new Promise<MedicationTaken[]>((resolve, reject) => {
        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result.map(
            (item: any) => ({
              ...item,
              date: new Date(item.date),
            })
          );
          resolve(result);
        };
        request.onerror = (event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error("Error loading medication taken records:", error);
      return [];
    }
  };

  const saveMedicationTaken = async (medicationTaken: MedicationTaken) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction("medicationTaken", "readwrite");
      const store = transaction.objectStore("medicationTaken");
      store.put(medicationTaken);
      return true;
    } catch (error) {
      console.error("Error saving medication taken record:", error);
      return false;
    }
  };

  const getMedicationsByDate = (date: Date) => {
    const dateString = date.toDateString();
    return medicationsTaken.filter(
      (med) => med.date.toDateString() === dateString
    );
  };

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const medsData = await loadMedications();
      const takenData = await loadMedicationTaken();

      setMedications(medsData);
      setMedicationsTaken(takenData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddMedicationForDate = async () => {
    if (!selectedMedication) {
      toast.error("Please select a medication");
      return;
    }

    const selectedMed = medications.find(
      (med) => med.id === selectedMedication
    );
    if (!selectedMed) return;

    // Check if this medication is already tracked for this date
    const dateString = date.toDateString();
    const existingEntry = medicationsTaken.find(
      (med) =>
        med.date.toDateString() === dateString &&
        med.medicationId === selectedMedication
    );

    if (existingEntry) {
      toast.error("This medication is already being tracked for this date");
      return;
    }

    const newMedicationTaken: MedicationTaken = {
      id: `${selectedMedication}-${Date.now()}`,
      date: new Date(date),
      medicationId: selectedMedication,
      medicationName: selectedMed.name,
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
    };

    const saved = await saveMedicationTaken(newMedicationTaken);

    if (saved) {
      setMedicationsTaken([...medicationsTaken, newMedicationTaken]);
      setIsDialogOpen(false);
      setSelectedMedication("");
      toast.success("Medication added to tracking");
    } else {
      toast.error("Failed to add medication tracking");
    }
  };

  const handleToggleTime = async (
    med: MedicationTaken,
    timeOfDay: "morning" | "afternoon" | "evening" | "night"
  ) => {
    const updatedMed = {
      ...med,
      [timeOfDay]: !med[timeOfDay],
    };

    const saved = await saveMedicationTaken(updatedMed);

    if (saved) {
      setMedicationsTaken(
        medicationsTaken.map((m) => (m.id === med.id ? updatedMed : m))
      );
      toast.success(
        `${timeOfDay} medication ${
          updatedMed[timeOfDay] ? "taken" : "unmarked"
        }`
      );
    } else {
      toast.error("Failed to update medication tracking");
    }
  };

  const renderMedicationsForDate = () => {
    const medicationsForDate = getMedicationsByDate(date);

    if (medicationsForDate.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No medications tracked for this date</p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="mt-2 bg-health-primary hover:bg-health-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Medication
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {medicationsForDate.map((med) => (
          <Card key={med.id} className="overflow-hidden">
            <CardHeader className="bg-health-primary/10 py-2">
              <CardTitle className="text-lg">{med.medicationName}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <Checkbox
                      id={`${med.id}-morning`}
                      checked={med.morning}
                      onCheckedChange={() => handleToggleTime(med, "morning")}
                      className="border-health-primary data-[state=checked]:bg-health-primary"
                    />
                    <Label htmlFor={`${med.id}-morning`} className="ml-2">
                      {strings.morning}
                    </Label>
                  </div>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-health-light">
                    {med.morning ? (
                      <Check className="h-5 w-5 text-health-primary" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <Checkbox
                      id={`${med.id}-afternoon`}
                      checked={med.afternoon}
                      onCheckedChange={() => handleToggleTime(med, "afternoon")}
                      className="border-health-primary data-[state=checked]:bg-health-primary"
                    />
                    <Label htmlFor={`${med.id}-afternoon`} className="ml-2">
                      {strings.afternoon}
                    </Label>
                  </div>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-health-light">
                    {med.afternoon ? (
                      <Check className="h-5 w-5 text-health-primary" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <Checkbox
                      id={`${med.id}-evening`}
                      checked={med.evening}
                      onCheckedChange={() => handleToggleTime(med, "evening")}
                      className="border-health-primary data-[state=checked]:bg-health-primary"
                    />
                    <Label htmlFor={`${med.id}-evening`} className="ml-2">
                      {strings.evening}
                    </Label>
                  </div>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-health-light">
                    {med.evening ? (
                      <Check className="h-5 w-5 text-health-primary" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <Checkbox
                      id={`${med.id}-night`}
                      checked={med.night}
                      onCheckedChange={() => handleToggleTime(med, "night")}
                      className="border-health-primary data-[state=checked]:bg-health-primary"
                    />
                    <Label htmlFor={`${med.id}-night`} className="ml-2">
                      {strings.night}
                    </Label>
                  </div>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-health-light">
                    {med.night ? (
                      <Check className="h-5 w-5 text-health-primary" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="text-center mt-4">
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-health-primary hover:bg-health-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" /> Add More
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:space-x-4">
            <div className="mb-4 md:mb-0 md:w-1/2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border shadow"
              />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-xl font-medium flex items-center mb-4">
                <CalendarIcon className="mr-2 h-5 w-5 text-health-primary" />
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              {loading ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : (
                renderMedicationsForDate()
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Medication for {date.toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Select Medication
              </label>
              <Select
                value={selectedMedication}
                onValueChange={setSelectedMedication}
              >
                <SelectTrigger className="input-health">
                  <SelectValue placeholder="Select a medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No medications available
                    </SelectItem>
                  ) : (
                    medications.map((med) => (
                      <SelectItem key={med.id} value={med.id}>
                        {med.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {strings.cancel}
              </Button>
              <Button
                onClick={handleAddMedicationForDate}
                className="bg-health-primary hover:bg-health-primary/90"
              >
                {strings.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicationCalendar;
