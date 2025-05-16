import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  askNotificationPermission,
  setupFirebaseMessaging,
} from "./utils/notificationUtils.ts";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Register and activate service workers immediately
const registerServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers are not supported.");
    return;
  }

  try {
    // Register main service worker for local notifications
    const swRegistration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none", // Always check for SW updates
    });

    console.log("Service worker registered:", swRegistration);

    // Force update if needed
    if (swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // Update the service worker on every page load
    swRegistration.update().catch((err) => {
      console.warn("Service worker update failed:", err);
    });

    // Check for notification data in IndexedDB on startup
    if (swRegistration.active) {
      swRegistration.active.postMessage({
        type: "checkScheduledNotifications",
      });
    }

    // Register Firebase messaging service worker for push notifications when browser is closed
    const fcmRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      {
        scope: "/firebase-cloud-messaging-push-scope",
        updateViaCache: "none", // Always check for SW updates
      }
    );

    console.log(
      "Firebase messaging service worker registered:",
      fcmRegistration
    );

    // Force update if needed
    if (fcmRegistration.waiting) {
      fcmRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // Update the FCM service worker
    fcmRegistration.update().catch((err) => {
      console.warn("FCM service worker update failed:", err);
    });

    // Check for stored notifications
    if (fcmRegistration.active) {
      fcmRegistration.active.postMessage({
        type: "checkNotifications",
      });
    }

    // Add event listeners to refresh service workers when app is focused/visible
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        swRegistration
          .update()
          .catch((err) =>
            console.warn("SW update on visibility change failed:", err)
          );
        fcmRegistration
          .update()
          .catch((err) =>
            console.warn("FCM update on visibility change failed:", err)
          );
      }
    });

    window.addEventListener("focus", () => {
      swRegistration
        .update()
        .catch((err) => console.warn("SW update on focus failed:", err));
      fcmRegistration
        .update()
        .catch((err) => console.warn("FCM update on focus failed:", err));
    });

    // Set up keeping the service workers alive
    const keepAliveInterval = setInterval(() => {
      try {
        fetch("/keep-alive?t=" + Date.now()).catch(() => {});
      } catch (e) {
        // Ignore errors - this is just a keep-alive
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Clean up on page unload
    window.addEventListener("beforeunload", () => {
      clearInterval(keepAliveInterval);
    });
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
};

// Register service workers immediately
registerServiceWorkers();

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
