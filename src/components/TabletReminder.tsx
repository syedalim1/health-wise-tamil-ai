
import React, { useState } from 'react';
import { PlusCircle, Clock, Trash2 } from 'lucide-react';
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
import { scheduleMedicationReminder } from '@/utils/notificationUtils';
import { toast } from 'sonner';

interface TabletReminderProps {
  language: Language;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
}

const TabletReminder: React.FC<TabletReminderProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState<{
    name: string;
    dosage: string;
    schedule: string;
  }>({
    name: '',
    dosage: '',
    schedule: 'morning',
  });

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage) {
      toast("Please fill all required fields");
      return;
    }

    const medication = {
      id: Date.now().toString(),
      ...newMedication,
    };

    // Schedule notification
    scheduleMedicationReminder(
      language,
      medication.name,
      medication.dosage,
      medication.schedule
    );

    setMedications([...medications, medication]);
    setNewMedication({
      name: '',
      dosage: '',
      schedule: 'morning',
    });
    setIsAddingMedication(false);

    toast.success(`${medication.name} reminder set for ${medication.schedule}`);
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
            const scheduleLabel = scheduleOptions.find(opt => opt.value === medication.schedule)?.label;
            
            return (
              <Card key={medication.id} className="card-health">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{medication.name}</h3>
                      <p className="text-gray-600 text-sm">{medication.dosage}</p>
                      <div className="flex items-center mt-2">
                        <Clock className="h-4 w-4 text-health-primary mr-1" />
                        <span className="text-sm health-badge-blue">{scheduleLabel}</span>
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
