
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { askNotificationPermission } from './utils/notificationUtils.ts'

// Request notification permission when the app loads
const requestPermission = async () => {
  try {
    await askNotificationPermission();
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
  }
};

// Request permission only after user interaction
document.addEventListener('click', () => {
  requestPermission();
}, { once: true });

createRoot(document.getElementById("root")!).render(<App />);
