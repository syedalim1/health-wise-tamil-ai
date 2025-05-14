
import { Language, getLanguageStrings } from "./languageUtils";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  lang?: string;
}

export const askNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const scheduleNotification = (
  timeInMs: number,
  options: NotificationOptions
) => {
  setTimeout(() => {
    showNotification(options);
  }, timeInMs);
};

export const showNotification = async (options: NotificationOptions) => {
  const hasPermission = await askNotificationPermission();
  if (!hasPermission) return;

  try {
    new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/favicon.ico",
      lang: options.lang || "en",
    });
  } catch (error) {
    console.error("Error showing notification:", error);
  }
};

export const getScheduleTime = (timeOfDay: string): Date => {
  const now = new Date();
  const scheduleDate = new Date(now);
  
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
  timeOfDay: string
) => {
  const strings = getLanguageStrings(language);
  const scheduleDate = getScheduleTime(timeOfDay);
  const timeInMs = scheduleDate.getTime() - new Date().getTime();
  
  // Get localized time of day
  const localizedTimeOfDay = strings[timeOfDay.toLowerCase() as keyof typeof strings] || timeOfDay;
  
  scheduleNotification(timeInMs, {
    title: `${strings.tabletReminder}: ${localizedTimeOfDay}`,
    body: `${medicationName} - ${dosage}`,
    lang: language === 'english' ? 'en' : language === 'tamil' ? 'ta' : language === 'hindi' ? 'hi' : 'en'
  });
  
  return scheduleDate;
};
