import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  askNotificationPermission,
  setupFirebaseMessaging,
} from "./utils/notificationUtils.ts";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Register our service worker for local notifications
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js", {
      scope: "/",
    })
    .then((registration) => {
      console.log("Service worker registered:", registration);

      // Check if we need to update the service worker
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      // Check for notification data in IndexedDB on startup
      if (registration.active) {
        registration.active.postMessage({
          type: "checkScheduledNotifications",
        });
      }
    })
    .catch((error) => {
      console.error("Service worker registration failed:", error);
    });

  // Register Firebase messaging service worker for push notifications when browser is closed
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    })
    .then((registration) => {
      console.log(
        "Firebase messaging service worker registered:",
        registration
      );
    })
    .catch((error) => {
      console.error(
        "Firebase messaging service worker registration failed:",
        error
      );
    });
} else {
  console.log("Service workers are not supported.");
}

// Request notification permission when the app loads
const requestPermission = async () => {
  try {
    const permissionGranted = await askNotificationPermission();

    // If permission is granted, set up Firebase messaging for push notifications
    if (permissionGranted) {
      try {
        const fcmSetupSuccess = await setupFirebaseMessaging();
        if (fcmSetupSuccess) {
          console.log("Firebase Cloud Messaging setup complete!");
        } else {
          console.warn(
            "Firebase Cloud Messaging setup failed - push notifications may not work when browser is closed"
          );
        }
      } catch (error) {
        console.error("Error setting up Firebase messaging:", error);
      }
    }
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
  }
};

// Request permission on first user interaction
document.addEventListener(
  "click",
  () => {
    requestPermission();
  },
  { once: true }
);

// Listen for messages from service worker
navigator.serviceWorker.addEventListener("message", (event) => {
  console.log("Message from service worker:", event.data);

  // Handle sound playback
  if (event.data.type === "playSound" && event.data.sound) {
    try {
      const audio = new Audio(event.data.sound);
      audio.play().catch((err) => console.error("Error playing sound:", err));
    } catch (error) {
      console.error("Error creating audio:", error);
    }
  }

  // Handle medication actions
  if (event.data.action === "MEDICATION_TAKEN" && event.data.medicationId) {
    window.dispatchEvent(
      new CustomEvent("medication-action", {
        detail: {
          action: "taken",
          medicationId: event.data.medicationId,
        },
      })
    );
  }

  if (event.data.action === "POSTPONE_REMINDER" && event.data.medicationId) {
    window.dispatchEvent(
      new CustomEvent("medication-action", {
        detail: {
          action: "postpone",
          medicationId: event.data.medicationId,
        },
      })
    );
  }
});

createRoot(document.getElementById("root")!).render(<App />);
