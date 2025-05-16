import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { askNotificationPermission } from "./utils/notificationUtils.ts";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Register service worker for notifications
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("Service worker registered:", registration);
    })
    .catch((error) => {
      console.error("Service worker registration failed:", error);
    });
} else {
  console.log("Service workers are not supported.");
}

// Request notification permission when the app loads
const requestPermission = async () => {
  try {
    await askNotificationPermission();
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
  }
};

// Request permission only after user interaction
document.addEventListener(
  "click",
  () => {
    requestPermission();
  },
  { once: true }
);

navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "playSound") {
    const audio = new Audio(event.data.sound);
    audio.play();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
