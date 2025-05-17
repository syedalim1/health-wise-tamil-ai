import { getToken, onMessage } from "firebase/messaging";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Request permission and get token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Add the public key generated from the console here.
      const currentToken = await getToken(messaging, {
        vapidKey:
          "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8",
      });

      if (currentToken) {
        console.log("Current token:", currentToken);
        return currentToken;
      } else {
        console.log(
          "No registration token available. Request permission to generate one."
        );
        return null;
      }
    } else {
      console.log("Notification permission denied.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);
      resolve(payload);
    });
  });
};
