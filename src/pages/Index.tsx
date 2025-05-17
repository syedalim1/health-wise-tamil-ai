"use client";
import { useEffect, useState } from "react";
import {
  requestNotificationPermission,
  registerServiceWorker,
  showNotification,
} from "@/utils/notificationUtils";

export default function Home() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    // Check notification permission on load
    const checkPermission = async () => {
      const permission = await requestNotificationPermission();
      setPermissionGranted(permission);

      if (permission) {
        // Register service worker if permission is granted
        await registerServiceWorker();
      }
    };

    checkPermission();
  }, []);

  const handleSchedule = async () => {
    if (!permissionGranted) {
      alert("Please enable notification permissions first");
      return;
    }

    // Show an immediate notification
    await showNotification({
      title: "Notification Title",
      body: "Button click panna notification varuthu",
    });

    // You could also schedule future notifications here if needed
    // const scheduleTime = new Date(time).getTime();
    // const timeFromNow = scheduleTime - Date.now();
    // if (timeFromNow > 0) {
    //   scheduleNotification(timeFromNow, {
    //     title: "Scheduled Notification",
    //     body: `This notification was scheduled for ${new Date(scheduleTime).toLocaleString()}`,
    //   });
    // }
  };

  const handleSendNotification = async () => {
    if (!permissionGranted) {
      alert("Please enable notification permissions first");
      return;
    }

    await showNotification({
      title: "Test Notification",
      body: "This is a test notification from the application",
    });

    alert("Notification sent!");
  };

  return (
    <div>
      <h1>Schedule Notification</h1>
      <input
        type="datetime-local"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <button onClick={handleSchedule}>Schedule</button>

      <button onClick={handleSendNotification}>Send Notification</button>
    </div>
  );
}
