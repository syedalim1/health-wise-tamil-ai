
import { GOOGLE_MAPS_API_KEY } from './configUtils';

// Function to get nearby pharmacies
export const getNearbyPharmacies = async (latitude: number, longitude: number, radius: number = 1500): Promise<any[]> => {
  try {
    // This would typically be done through a backend API to protect your API key
    // For demo purposes, we're showing how it would work
    console.log(`Would search for pharmacies near ${latitude},${longitude} using API key ${GOOGLE_MAPS_API_KEY}`);
    
    // In a real implementation with a backend:
    // const response = await fetch(`/api/nearby-pharmacies?lat=${latitude}&lng=${longitude}&radius=${radius}`);
    // return await response.json();
    
    // Mock response for demonstration
    return [
      { name: "City Pharmacy", distance: "0.5 km", address: "123 Main St" },
      { name: "Health Drugstore", distance: "1.2 km", address: "456 Oak Ave" },
      { name: "MediCare Pharmacy", distance: "1.8 km", address: "789 Pine Rd" }
    ];
  } catch (error) {
    console.error("Error fetching nearby pharmacies:", error);
    return [];
  }
};

// Function to get directions to a pharmacy
export const getDirectionsToPharmacy = (pharmacyAddress: string) => {
  const encodedAddress = encodeURIComponent(pharmacyAddress);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
  window.open(url, '_blank');
};
