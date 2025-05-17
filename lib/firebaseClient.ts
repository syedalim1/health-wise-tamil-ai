// Firebase init for frontend
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging };
