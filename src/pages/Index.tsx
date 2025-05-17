"use client";
import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/utils/firebase";

export default function Home() {
  const [token, setToken] = useState("");
  const [time, setTime] = useState("");

  const vapidKey =
    "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8	"; // From Firebase Console

  useEffect(() => {
    // Ask notification permission
    Notification.requestPermission().then(async (permission) => {
      if (permission === "granted") {
        const fcmToken = await getToken(messaging, { vapidKey });
        setToken(fcmToken);
        console.log("FCM Token:", fcmToken);
      }
    });

    // Listen if browser is open
    onMessage(messaging, (payload) => {
      const { title, ...options } = payload.notification;
      new Notification(title, options);
    });
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
    /*
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time, token }),
    });
    const json = await res.json();
    alert(json.message);
    */
  };
  
  const handleSendNotification = async () => {
    if (!token) return alert("Token illa");

    const res = await fetch("/api/sendNotification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
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
