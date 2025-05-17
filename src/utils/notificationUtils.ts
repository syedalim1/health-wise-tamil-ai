import { Language, getLanguageStrings } from "./languageUtils";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  lang?: string;
  sound?: string;
  data?: Record<string, any>;
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications");
    return false;
  }

  try {
    if (Notification.permission === "granted") {
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

// Register service worker for notifications
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) {
      console.log("Service workers not supported");
      return null;
    }

    try {
      console.log("Registering service worker...");
      return await navigator.serviceWorker.register("/sw.js");
    } catch (error) {
      console.error("Service worker registration failed:", error);
      return null;
    }
  };

// Schedule a notification
export const scheduleNotification = async (
  timeInMs: number,
  options: NotificationOptions
) => {
  if (!("Notification" in window)) {
    console.error("Notifications not supported in this browser");
    return;
  }

  // Try to use service worker for persistent notifications
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

  // Store locally for backup/offline scenarios
  storeLocalBackupNotification(Date.now() + timeInMs, options);
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

// Show a notification immediately
export const showNotification = async (options: NotificationOptions) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  try {
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

    // Add click handler
    notification.onclick = () => {
      window.focus();
      notification.close();

      // Dispatch custom event for additional handling
      if (options.data?.medicationId) {
        dispatchMedicationAction("taken", options.data.medicationId);
      }
    };
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

// Calculate the time for scheduling based on time of day
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

// Schedule a medication reminder
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
    title: `${strings.tabletReminder}: ${medicationName}`,
    body: dosage
      ? `${medicationName} (${dosage}) - ${timeDisplay}`
      : `${medicationName} - ${timeDisplay}`,
    icon: "/favicon.ico",
    data: {
      medicationId,
      medicationName,
      dosage,
      timeDisplay,
    },
  });

  return scheduleDate;
};

// Store a local backup of notifications
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

// Check for missed notifications in local storage
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
