
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getNearbyPharmacies, getDirectionsToPharmacy } from '@/utils/mapUtils';
import { Language, getLanguageStrings } from '@/utils/languageUtils';

interface PharmacyFinderProps {
  language: Language;
}

interface Pharmacy {
  name: string;
  distance: string;
  address: string;
}

const PharmacyFinder: React.FC<PharmacyFinderProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const findNearbyPharmacies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            
            const nearby = await getNearbyPharmacies(latitude, longitude);
            setPharmacies(nearby);
            setLoading(false);
          },
          (err) => {
            console.error("Geolocation error:", err);
            setError(strings.locationError || "Could not access your location");
            setLoading(false);
          }
        );
      } else {
        setError(strings.geoNotSupported || "Geolocation is not supported by your browser");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error finding pharmacies:", error);
      setError(strings.pharmacyError || "Error finding nearby pharmacies");
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-health-primary">
            {strings.findPharmacy || "Find Nearby Pharmacies"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={findNearbyPharmacies} 
            disabled={loading}
            className="mb-4 bg-health-primary hover:bg-health-primary/90"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {loading ? 
              (strings.searching || "Searching...") : 
              (strings.findPharmacies || "Find Nearby Pharmacies")
            }
          </Button>

          {error && (
            <div className="text-health-danger mb-4 p-2 bg-health-danger/10 rounded-md">
              {error}
            </div>
          )}

          {pharmacies.length > 0 && (
            <div className="space-y-3">
              {pharmacies.map((pharmacy, index) => (
                <div key={index} className="p-3 border rounded-lg bg-white hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{pharmacy.name}</h3>
                      <p className="text-sm text-gray-600">{pharmacy.address}</p>
                      <p className="text-xs text-gray-500">{pharmacy.distance}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-health-primary border-health-primary hover:bg-health-light"
                      onClick={() => getDirectionsToPharmacy(pharmacy.address)}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      {strings.directions || "Directions"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyFinder;
