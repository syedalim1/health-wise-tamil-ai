
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, PackageOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Language, getLanguageStrings, formatString } from '@/utils/languageUtils';

interface StockTrackerProps {
  language: Language;
}

interface MedicationStock {
  id: string;
  name: string;
  count: number;
  lowStockThreshold: number;
}

const StockTracker: React.FC<StockTrackerProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [medicationStocks, setMedicationStocks] = useState<MedicationStock[]>([]);
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newMedicationCount, setNewMedicationCount] = useState<number>(0);

  // Load from localStorage on initial render
  useEffect(() => {
    const savedStocks = localStorage.getItem('medicationStocks');
    if (savedStocks) {
      try {
        setMedicationStocks(JSON.parse(savedStocks));
      } catch (e) {
        console.error('Error loading medication stocks from localStorage', e);
      }
    }
  }, []);

  // Save to localStorage when stocks change
  useEffect(() => {
    localStorage.setItem('medicationStocks', JSON.stringify(medicationStocks));
  }, [medicationStocks]);

  const handleAddMedication = () => {
    if (!newMedicationName || newMedicationCount <= 0) return;

    const newMedication: MedicationStock = {
      id: Date.now().toString(),
      name: newMedicationName,
      count: newMedicationCount,
      lowStockThreshold: 3, // Default threshold
    };

    setMedicationStocks([...medicationStocks, newMedication]);
    setNewMedicationName('');
    setNewMedicationCount(0);
  };

  const handleUpdateCount = (id: string, newCount: number) => {
    setMedicationStocks(
      medicationStocks.map(med => 
        med.id === id ? { ...med, count: newCount } : med
      )
    );
  };

  const handleDeleteMedication = (id: string) => {
    setMedicationStocks(medicationStocks.filter(med => med.id !== id));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800">{strings.stockTracker}</h2>

      <Card className="card-health">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Add Medication Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              className="input-health flex-grow"
              placeholder={strings.medicationName}
              value={newMedicationName}
              onChange={(e) => setNewMedicationName(e.target.value)}
            />
            <Input
              className="input-health w-full sm:w-32"
              type="number"
              min="0"
              placeholder={strings.stockLeft}
              value={newMedicationCount || ''}
              onChange={(e) => setNewMedicationCount(parseInt(e.target.value) || 0)}
            />
            <Button 
              onClick={handleAddMedication}
              className="bg-health-primary hover:bg-health-primary/90"
              disabled={!newMedicationName || newMedicationCount <= 0}
            >
              {strings.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {medicationStocks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <PackageOpen className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">No medications added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicationStocks.map(medication => (
            <Card key={medication.id} className="card-health">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{medication.name}</h3>
                    <div className="flex items-center mt-2 gap-2">
                      <div className="flex items-center">
                        <span className="text-sm mr-2">{strings.stockLeft}:</span>
                        <Input
                          className="input-health w-16 h-8 text-sm"
                          type="number"
                          min="0"
                          value={medication.count}
                          onChange={(e) => handleUpdateCount(medication.id, parseInt(e.target.value) || 0)}
                        />
                      </div>
                      
                      {medication.count <= medication.lowStockThreshold && (
                        <span className="health-badge-red flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {strings.refillNeeded}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:text-health-danger"
                    onClick={() => handleDeleteMedication(medication.id)}
                  >
                    &times;
                  </Button>
                </div>
                
                {medication.count <= medication.lowStockThreshold && (
                  <Alert className="mt-3 bg-health-danger/10 border-health-danger/20">
                    <AlertCircle className="h-4 w-4 text-health-danger" />
                    <AlertTitle className="text-health-danger text-sm font-medium">
                      {strings.refillAlert}
                    </AlertTitle>
                    <AlertDescription className="text-xs text-health-danger/90">
                      {formatString(strings.refillAlert, { count: medication.count })}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockTracker;
