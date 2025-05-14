
import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, Trash2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Language, getLanguageStrings } from '@/utils/languageUtils';
import { scheduleMedicationReminder, askNotificationPermission } from '@/utils/notificationUtils';
import { toast } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
}

const TabletReminder: React.FC<TabletReminderProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newMedication, setNewMedication] = useState<{
    name: string;
    dosage: string;
    schedule: string;
    customTime: boolean;
    hours?: number;
    minutes?: number;
  }>({
    name: '',
    dosage: '',
    schedule: 'morning',
    customTime: false,
    hours: 8,
    minutes: 0,
  });

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
      toast.error("Please enable notifications in your browser settings to receive medication reminders.");
    }
  };

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage) {
      toast("Please fill all required fields");
      return;
    }

    const medication = {
      id: Date.now().toString(),
      ...newMedication,
    };

    if (!notificationsEnabled) {
      toast.warning("Notifications not enabled. Enable them to receive reminders.");
      setIsAddingMedication(false);
      setMedications([...medications, medication]);
      setNewMedication({
        name: '',
        dosage: '',
        schedule: 'morning',
        customTime: false,
        hours: 8,
        minutes: 0,
      });
      return;
    }

    // Schedule notification
    scheduleMedicationReminder(
      language,
      medication.name,
      medication.dosage,
      medication.schedule,
      medication.customTime ? medication.hours : undefined,
      medication.customTime ? medication.minutes : undefined
    );

    setMedications([...medications, medication]);
    setNewMedication({
      name: '',
      dosage: '',
      schedule: 'morning',
      customTime: false,
      hours: 8,
      minutes: 0,
    });
    setIsAddingMedication(false);

    toast.success(`${medication.name} reminder set for ${medication.customTime ? 
      `${medication.hours}:${medication.minutes < 10 ? '0' : ''}${medication.minutes}` : 
      medication.schedule}`);
  };

  const handleDeleteMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const scheduleOptions = [
    { value: 'morning', label: strings.morning },
    { value: 'afternoon', label: strings.afternoon },
    { value: 'evening', label: strings.evening },
    { value: 'night', label: strings.night },
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
        <h2 className="text-2xl font-semibold text-gray-800">{strings.tabletReminder}</h2>
        <Button 
          onClick={() => setIsAddingMedication(!isAddingMedication)}
          variant="ghost"
          className="text-health-primary hover:text-health-primary/90 hover:bg-health-light"
        >
          <PlusCircle className="h-5 w-5 mr-1" />
          {strings.addMedication}
        </Button>
      </div>
      
      {!notificationsEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-amber-800">Enable notifications to receive medication reminders</p>
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

      {isAddingMedication && (
        <Card className="border border-health-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{strings.addMedication}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {strings.medicationName} *
                </label>
                <Input 
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                  className="input-health"
                  placeholder="e.g. Aspirin, Paracetamol"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {strings.dosage} *
                </label>
                <Input 
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                  className="input-health"
                  placeholder="e.g. 1 tablet, 5ml"
                />
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <Switch 
                  id="custom-time"
                  checked={newMedication.customTime}
                  onCheckedChange={handleCustomTimeChange}
                />
                <Label htmlFor="custom-time">Set custom time</Label>
              </div>
              
              {newMedication.customTime ? (
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Hours *
                    </label>
                    <Select 
                      value={newMedication.hours?.toString() || "8"}
                      onValueChange={(value) => setNewMedication({
                        ...newMedication, 
                        hours: parseInt(value)
                      })}
                    >
                      <SelectTrigger className="input-health">
                        <SelectValue placeholder="Hours" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 24}, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i < 10 ? `0${i}` : i} {i >= 12 ? 'PM' : 'AM'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Minutes *
                    </label>
                    <Select 
                      value={newMedication.minutes?.toString() || "0"}
                      onValueChange={(value) => setNewMedication({
                        ...newMedication, 
                        minutes: parseInt(value)
                      })}
                    >
                      <SelectTrigger className="input-health">
                        <SelectValue placeholder="Minutes" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 60}, (_, i) => (
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
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    {strings.schedule} *
                  </label>
                  <Select 
                    value={newMedication.schedule}
                    onValueChange={(value) => setNewMedication({...newMedication, schedule: value})}
                  >
                    <SelectTrigger className="input-health">
                      <SelectValue placeholder={strings.schedule} />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map(option => (
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
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
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
            if (medication.customTime && medication.hours !== undefined && medication.minutes !== undefined) {
              const formattedHours = medication.hours % 12 || 12;
              const ampm = medication.hours >= 12 ? 'PM' : 'AM';
              const formattedMinutes = medication.minutes < 10 ? `0${medication.minutes}` : medication.minutes;
              timeDisplay = `${formattedHours}:${formattedMinutes} ${ampm}`;
            } else {
              const scheduleLabel = scheduleOptions.find(opt => opt.value === medication.schedule)?.label;
              timeDisplay = scheduleLabel;
            }
            
            return (
              <Card key={medication.id} className="card-health">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{medication.name}</h3>
                      <p className="text-gray-600 text-sm">{medication.dosage}</p>
                      <div className="flex items-center mt-2">
                        <Clock className="h-4 w-4 text-health-primary mr-1" />
                        <span className="text-sm health-badge-blue">{timeDisplay}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-gray-400 hover:text-health-danger"
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
