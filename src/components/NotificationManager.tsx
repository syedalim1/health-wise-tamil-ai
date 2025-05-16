import { useEffect } from "react";
import { showNotification } from "../utils/notificationUtils";

/**
 * NotificationManager component that handles checking for missed notifications
 * and ensures notifications work even when the browser is closed.
 *
 * This component should be included at the top level of your application.
 */
const NotificationManager = () => {
  useEffect(() => {
    // Check for missed notifications in local storage
    const checkMissedNotifications = () => {
      try {
        const scheduledNotifications = JSON.parse(
          localStorage.getItem("scheduledNotifications") || "[]"
        );

        const now = new Date();
        const missedNotifications = scheduledNotifications.filter(
          (notification: any) => new Date(notification.scheduleTime) <= now
        );

        // Show missed notifications
        missedNotifications.forEach((notification: any) => {
          showNotification({
            title: notification.title,
            body: notification.body,
            data: { medicationId: notification.medicationId },
          });
        });

        // Remove missed notifications from storage
        const remainingNotifications = scheduledNotifications.filter(
          (notification: any) => new Date(notification.scheduleTime) > now
        );

        localStorage.setItem(
          "scheduledNotifications",
          JSON.stringify(remainingNotifications)
        );

        console.log(
          `Processed ${missedNotifications.length} missed notifications`
        );
      } catch (error) {
        console.error("Error checking for missed notifications:", error);
      }
    };

    // Setup periodic checking for IndexedDB notifications
    const checkServiceWorkerNotifications = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            registration.active.postMessage({
              type: "checkScheduledNotifications",
            });
          }
        } catch (error) {
          console.error("Error checking service worker notifications:", error);
        }
      }
    };

    // Run immediately when component mounts
    checkMissedNotifications();
    checkServiceWorkerNotifications();

    // Then set up interval to periodically check
    const intervalId = setInterval(() => {
      checkMissedNotifications();
      checkServiceWorkerNotifications();
    }, 60 * 1000); // Check every minute

    // Set up visibility change listener to check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkMissedNotifications();
        checkServiceWorkerNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default NotificationManager;
