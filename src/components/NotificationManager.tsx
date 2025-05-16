import { useEffect } from "react";
import {
  showNotification,
  checkMissedNotifications,
} from "../utils/notificationUtils";

/**
 * NotificationManager component that handles checking for missed notifications
 * and ensures notifications work even when the browser is closed.
 *
 * This component should be included at the top level of your application.
 */
const NotificationManager = () => {
  useEffect(() => {
    // Check for missed notifications in local storage
    const checkMissedLocalNotifications = () => {
      try {
        checkMissedNotifications();
      } catch (error) {
        console.error("Error checking missed notifications:", error);
      }
    };

    // Setup checking for IndexedDB notifications
    const checkServiceWorkerNotifications = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();

          if (registrations.length === 0) {
            console.warn(
              "No service workers registered, attempting to register"
            );
            // Re-register service worker if not found
            try {
              const newRegistration = await navigator.serviceWorker.register(
                "/sw.js",
                {
                  scope: "/",
                }
              );
              console.log("Service worker re-registered:", newRegistration);

              if (newRegistration.active) {
                newRegistration.active.postMessage({
                  type: "checkScheduledNotifications",
                });
              } else if (newRegistration.installing) {
                // Wait for installation to complete
                newRegistration.installing.addEventListener(
                  "statechange",
                  (e) => {
                    if ((e.target as ServiceWorker).state === "activated") {
                      newRegistration.active?.postMessage({
                        type: "checkScheduledNotifications",
                      });
                    }
                  }
                );
              }
            } catch (regError) {
              console.error("Error re-registering service worker:", regError);
            }
            return;
          }

          for (const registration of registrations) {
            if (
              registration.scope.includes(window.location.origin) &&
              registration.active
            ) {
              registration.active.postMessage({
                type: "checkScheduledNotifications",
              });
              console.log("Sent check notification request to service worker");

              // Try to update the service worker
              try {
                await registration.update();
              } catch (updateError) {
                console.error("Error updating service worker:", updateError);
              }
            }
          }
        } catch (error) {
          console.error("Error checking service worker notifications:", error);
        }
      }
    };

    // Ping function to keep service worker alive even when browser is closed
    const pingServiceWorker = async () => {
      try {
        // Use a fetch to ping the service worker, keeping it active
        await fetch("/keep-alive?t=" + Date.now());
        console.log("Pinged service worker to keep it alive");
      } catch (error) {
        console.error("Error pinging service worker:", error);
      }
    };

    // Run immediately when component mounts
    checkMissedLocalNotifications();
    checkServiceWorkerNotifications();
    pingServiceWorker();

    // Then set up interval to periodically check
    const intervalId = setInterval(() => {
      checkMissedLocalNotifications();
      checkServiceWorkerNotifications();
      pingServiceWorker();
    }, 60 * 1000); // Check every minute

    // Set up visibility change listener to check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab became visible, checking for notifications");
        checkMissedLocalNotifications();
        checkServiceWorkerNotifications();
        pingServiceWorker();
      }
    };

    // Listen for browser waking up from sleep
    const handleOnline = () => {
      console.log("Browser came online, checking for notifications");
      checkMissedLocalNotifications();
      checkServiceWorkerNotifications();
      pingServiceWorker();
    };

    // Listen for focus events
    const handleFocus = () => {
      console.log("Window focused, checking for notifications");
      checkMissedLocalNotifications();
      checkServiceWorkerNotifications();
      pingServiceWorker();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleFocus);

    // Clean up
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default NotificationManager;
