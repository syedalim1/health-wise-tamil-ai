// Configuration variables for the application
// These are public keys that are safe to be in the client-side code

export const GOOGLE_MAPS_API_KEY = 'AIzaSyAlSuhtPkKaIg7NIS6BGMHHSW-eNNujLvQ';

// Other configuration settings can be added here
export const APP_CONFIG = {
  notificationDefaults: {
    morningTime: { hours: 8, minutes: 0 },
    afternoonTime: { hours: 13, minutes: 0 },
    eveningTime: { hours: 18, minutes: 0 },
    nightTime: { hours: 21, minutes: 0 },
  },
  maxMedicationHistory: 30, // days to keep medication history
};
