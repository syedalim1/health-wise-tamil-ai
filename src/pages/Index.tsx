"use client";
import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/utils/firebase";
import axios from "axios";

export default function Home() {
  const [token, setToken] = useState("");
  const [time, setTime] = useState("");

  const vapidKey =
    "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8	";

  console.log("VAPID Key:", vapidKey);

  useEffect(() => {
    // Ask notification permission
    const initializeAndGetToken = async () => {
      // Ask notification permission
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Ensure messaging is initialized before getting token
        const { messaging } = await import("@/utils/firebase"); // Re-import to get the potentially updated messaging instance
        if (messaging) {
          const fcmToken = await getToken(messaging, { vapidKey });
          setToken(fcmToken);
          console.log("FCM Token:", fcmToken);

          // Listen if browser is open - move inside here
          onMessage(messaging, (payload) => {
            console.log("Message received. ", payload);
            // Check if Notification API is supported and permission is granted
            if (Notification.permission === "granted") {
              const { title, ...options } = payload.notification || {}; // Add fallback for payload.notification
              if (title) {
                // Only create notification if title exists
                new Notification(title, options);
              } else {
                console.warn("Notification payload missing title:", payload);
              }
            } else {
              console.warn(
                "Notification permission not granted or Notification API not supported."
              );
            }
          });
        } else {
          console.error("Firebase messaging could not be initialized.");
        }
      }
    };

    initializeAndGetToken();
  }, []);

  const handleSchedule = async () => {
    if (!token) {
      alert("Token illa, permission enable pannunga");
      return;
    }

    // Immediate notification example
    new Notification("Notification Title", {
      body: "Button click panna notification varuthu",
    });

    // Also call your API to schedule for later if needed
    // /*
    // const res = await fetch("/api/schedule", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ time, token }),
    // });
    // const json = await res.json();
    // alert(json.message);
    // */
  };

  const handleSendNotification = async () => {
    if (!token) return alert("Token illa");

    // const res = await fetch("/api/sendNotification", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ token }),
    // });

    const res = await axios.post("/api/sendNotification", {
      token,
    });

    const data = res.data;
    alert(data.message);
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
