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
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: "scheduleNotification",
      timeInMs,
      options,
    });
  } else {
    // Fallback for environments without service worker support
    setTimeout(() => {
      showNotification(options);
    }, timeInMs);
  }
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
    // Get FCM token from local storage
    const fcmToken = localStorage.getItem("fcmToken");

    if (!fcmToken) {
      console.log("No FCM token available for cloud notifications");
      return;
    }

    // Send request to backend API to schedule the notification
    const response = await fetch("/api/schedule-medication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: fcmToken,
        scheduleTime: scheduleDate.toISOString(),
        medicationName,
        dosage,
        timeDisplay,
        medicationId,
      }),
    });

    if (response.ok) {
      console.log("Cloud notification scheduled successfully");
    } else {
      console.error("Failed to schedule cloud notification");
    }
  } catch (error) {
    console.error("Error scheduling cloud notification:", error);
  }
};
