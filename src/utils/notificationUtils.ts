import { Language, getLanguageStrings } from "./languageUtils";
import { requestFCMToken, sendTokenToServer } from "./firebase";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  lang?: string;
  sound?: string;
  data?: Record<string, any>;
}

export const askNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications");
    return false;
  }

  try {
    if (Notification.permission === "granted") {
      // Don't automatically request FCM token to avoid errors
      console.log("Notification permission was already granted");
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      console.log(`Notification permission: ${permission}`);
      return permission === "granted";
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }

  return Notification.permission === "granted";
};

// A separate function that can be called manually
export const setupFirebaseMessaging = async (): Promise<boolean> => {
  try {
    const hasPermission = Notification.permission === "granted";
    if (!hasPermission) {
      console.log("No notification permission granted");
      return false;
    }

    const fcmToken = await requestFCMToken();
    if (fcmToken) {
      await sendTokenToServer(fcmToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error setting up Firebase Messaging:", error);
    return false;
  }
};

export const scheduleNotification = async (
  timeInMs: number,
  options: NotificationOptions
) => {
  if (!("Notification" in window)) {
    console.error("Notifications not supported in this browser");
    return;
  }

  // Always try to set up both service worker and Firebase notifications
  // Service worker for when app is open or in background
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        console.log("Scheduling notification via service worker");
        registration.active.postMessage({
          type: "scheduleNotification",
          timeInMs,
          options,
        });
      } else {
        console.warn("Service worker is registered but not active");
        fallbackScheduleNotification(timeInMs, options);
      }
    } catch (error) {
      console.error("Error scheduling via service worker:", error);
      fallbackScheduleNotification(timeInMs, options);
    }
  } else {
    // Fallback for environments without service worker support
    fallbackScheduleNotification(timeInMs, options);
  }

  // Also schedule using Firebase Cloud Messaging if possible
  // This works when the browser is closed
  try {
    const fcmToken = localStorage.getItem("fcmToken");
    if (fcmToken) {
      const scheduleTime = new Date(Date.now() + timeInMs).toISOString();
      await scheduleFCMNotification(
        new Date(Date.now() + timeInMs),
        options.data?.medicationName || "Medication",
        options.data?.dosage || "",
        scheduleTime,
        options.data?.medicationId
      );
    }
  } catch (error) {
    console.error("Error scheduling FCM notification:", error);
  }
};

// Fallback notification method for browsers without service worker
const fallbackScheduleNotification = (
  timeInMs: number,
  options: NotificationOptions
) => {
  console.log("Using fallback notification scheduler");
  setTimeout(() => {
    showNotification(options);
  }, timeInMs);
};

export const showNotification = async (options: NotificationOptions) => {
  const hasPermission = await askNotificationPermission();
  if (!hasPermission) return;

  try {
    // Note: Browser notifications using the Notification API and setTimeout will only work when the application is open and the script is running.
    // For background notifications (when the app is closed), a service worker and potentially a push notification service are required.
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/favicon.ico",
      lang: options.lang || "en",
      data: options.data,
    });

    // For foreground notifications (when app is open), play sound immediately
    if (options.sound) {
      const audio = new Audio(options.sound);
      await audio.play();
    }
  } catch (error) {
    console.error("Error showing notification:", error);
  }
};

// Handle sound playback when triggered from service worker
window.addEventListener("message", (event) => {
  if (event.data.type === "playSound" && event.data.sound) {
    try {
      const audio = new Audio(event.data.sound);
      audio.play();
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }

  // Handle medication taken action from service worker
  if (event.data.action === "MEDICATION_TAKEN" && event.data.medicationId) {
    dispatchMedicationAction("taken", event.data.medicationId);
  }

  // Handle postpone action from service worker
  if (event.data.action === "POSTPONE_REMINDER" && event.data.medicationId) {
    dispatchMedicationAction("postpone", event.data.medicationId);
  }
});

// Helper to dispatch custom events for medication actions
const dispatchMedicationAction = (
  action: "taken" | "postpone",
  medicationId: string
) => {
  window.dispatchEvent(
    new CustomEvent("medication-action", {
      detail: {
        action,
        medicationId,
      },
    })
  );
};

export const getScheduleTime = (
  timeOfDay: string,
  hours?: number,
  minutes?: number
): Date => {
  const now = new Date();
  const scheduleDate = new Date(now);

  // If specific hours and minutes are provided, use them
  if (hours !== undefined && minutes !== undefined) {
    scheduleDate.setHours(hours, minutes, 0, 0);
  } else {
    // Otherwise use the preset times
    switch (timeOfDay.toLowerCase()) {
      case "morning":
        scheduleDate.setHours(8, 0, 0, 0);
        break;
      case "afternoon":
        scheduleDate.setHours(13, 0, 0, 0);
        break;
      case "evening":
        scheduleDate.setHours(18, 0, 0, 0);
        break;
      case "night":
        scheduleDate.setHours(21, 0, 0, 0);
        break;
      default:
        return now;
    }
  }

  // If the time has already passed today, schedule for tomorrow
  if (scheduleDate.getTime() < now.getTime()) {
    scheduleDate.setDate(scheduleDate.getDate() + 1);
  }

  return scheduleDate;
};

export const scheduleMedicationReminder = (
  language: Language,
  medicationName: string,
  dosage: string,
  timeOfDay: string,
  hours?: number,
  minutes?: number,
  medicationId?: string
) => {
  const strings = getLanguageStrings(language);
  const scheduleDate = getScheduleTime(timeOfDay, hours, minutes);
  const timeInMs = scheduleDate.getTime() - new Date().getTime();

  // Get localized time of day
  const localizedTimeOfDay =
    strings[timeOfDay.toLowerCase() as keyof typeof strings] || timeOfDay;

  // Format the custom time if provided
  let timeDisplay = localizedTimeOfDay;
  if (hours !== undefined && minutes !== undefined) {
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    timeDisplay = `${formattedHours}:${formattedMinutes} ${ampm}`;
  }

  // Schedule local notification
  scheduleNotification(timeInMs, {
    title: `${strings.tabletReminder}: ${timeDisplay}`,
    body: `${medicationName} - ${dosage}`,
    lang:
      language === "english"
        ? "en"
        : language === "tamil"
        ? "ta"
        : language === "hindi"
        ? "hi"
        : "en",
    data: { medicationId },
  });

  // Don't automatically try to schedule cloud notifications
  // as they're now manually set up with setupFirebaseMessaging

  return scheduleDate;
};

// Function to schedule a cloud notification using Firebase Cloud Messaging
export const scheduleFCMNotification = async (
  scheduleDate: Date,
  medicationName: string,
  dosage: string,
  timeDisplay: string,
  medicationId?: string
) => {
  try {
    const fcmToken = localStorage.getItem("fcmToken");
    if (!fcmToken) {
      console.warn("No FCM token available, attempting to acquire one");
      const hasSetup = await setupFirebaseMessaging();
      if (!hasSetup || !localStorage.getItem("fcmToken")) {
        console.error("Could not obtain FCM token for notifications");
        return;
      }
    }

    // Create payload for the FCM notification
    const payload = {
      notification: {
        title: `${medicationName} Reminder`,
        body: dosage
          ? `Time to take ${medicationName} (${dosage})`
          : `Time to take ${medicationName}`,
      },
      data: {
        medicationId: medicationId || "",
        medicationName,
        dosage,
        scheduledTime: scheduleDate.toISOString(),
        timeDisplay,
      },
      // Add additional parameters to ensure notification is reliable
      android: {
        priority: "high",
        notification: {
          sticky: true,
          default_vibrate_timings: true,
          default_sound: true,
          notification_priority: "PRIORITY_HIGH",
          visibility: "PUBLIC",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            content_available: 1,
          },
        },
      },
      webpush: {
        headers: {
          TTL: "86400", // 24 hours in seconds
          Urgency: "high",
        },
        notification: {
          requireInteraction: true,
          vibrate: [200, 100, 200],
          actions: [
            {
              action: "confirm",
              title: "✓ Taken",
            },
            {
              action: "postpone",
              title: "⏰ Remind Later",
            },
          ],
        },
        fcm_options: {
          link: window.location.origin,
        },
      },
      token: fcmToken,
    };

    // Send to the server
    const response = await fetch(
      "https://us-central1-asmi-project-notification.cloudfunctions.net/schedulePushNotification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: fcmToken,
          scheduleTime: scheduleDate.getTime(),
          payload,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Store a local backup of the scheduled notification in case FCM fails
    storeLocalBackupNotification(scheduleDate.getTime(), {
      title: `${medicationName} Reminder`,
      body: dosage
        ? `Time to take ${medicationName} (${dosage})`
        : `Time to take ${medicationName}`,
      data: {
        medicationId,
        medicationName,
        dosage,
        timeDisplay,
      },
    });

    console.log("FCM notification scheduled successfully for", scheduleDate);
    return await response.json();
  } catch (error) {
    console.error("Error scheduling FCM notification:", error);
    return null;
  }
};

// Store a local backup of the FCM notification in case cloud messaging fails
const storeLocalBackupNotification = (
  scheduledTime: number,
  options: NotificationOptions
) => {
  try {
    // Get existing backups
    const existingBackupsStr =
      localStorage.getItem("notificationBackups") || "[]";
    const existingBackups = JSON.parse(existingBackupsStr);

    // Add the new backup
    existingBackups.push({
      scheduledTime,
      options,
      id: `backup-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    });

    // Clean up old backups (keep only those from the last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const updatedBackups = existingBackups.filter(
      (backup: any) => backup.scheduledTime > sevenDaysAgo
    );

    // Save back to localStorage
    localStorage.setItem("notificationBackups", JSON.stringify(updatedBackups));

    console.log(
      "Stored local backup for notification at",
      new Date(scheduledTime)
    );
  } catch (error) {
    console.error("Error storing local notification backup:", error);
  }
};

// Function to check for missed notifications in local storage
export const checkMissedNotifications = () => {
  try {
    const backupsStr = localStorage.getItem("notificationBackups") || "[]";
    const backups = JSON.parse(backupsStr);
    const now = Date.now();
    let missed = 0;

    // Filter to get missed notifications (scheduled in the past but not shown)
    const missedNotifications = backups.filter((backup: any) => {
      return backup.scheduledTime <= now && !backup.shown;
    });

    // Show missed notifications
    missedNotifications.forEach((backup: any) => {
      showNotification(backup.options);
      backup.shown = true;
      missed++;
    });

    // Update storage with processed notifications
    localStorage.setItem("notificationBackups", JSON.stringify(backups));

    if (missed > 0) {
      console.log(`Showed ${missed} missed notifications from local storage`);
    }
  } catch (error) {
    console.error("Error checking for missed notifications:", error);
  }
};
