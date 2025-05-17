import React, { useEffect, useState } from "react";
import {
  requestNotificationPermission,
  registerServiceWorker,
  showNotification,
} from "@/utils/notificationUtils";

const NotificationTest: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);

  useEffect(() => {
    // Check current notification permission on load
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    setError(null);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPermission("granted");
      } else {
        setError("Notification permission not granted");
      }
    } catch (err) {
      console.error("Error requesting notification permission", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const registerSW = async () => {
    setLoading(true);
    setError(null);
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        setServiceWorkerRegistered(true);
      } else {
        setError("Failed to register service worker");
      }
    } catch (err) {
      console.error("Error registering service worker", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await showNotification({
        title: "Test Notification",
        body: "This is a test notification from the application",
        icon: "/favicon.ico",
      });
    } catch (error) {
      console.error("Error sending notification", error);
      alert(
        "Error: " +
          (error instanceof Error
            ? error.message
            : "Failed to send notification")
      );
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Testing Page</h1>

      <div className="mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
          onClick={requestPermission}
          disabled={loading || permission === "granted"}
        >
          {loading ? "Processing..." : "🔔 Request Permission"}
        </button>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded mr-4"
          onClick={registerSW}
          disabled={loading || !permission || permission !== "granted"}
        >
          {loading ? "Processing..." : "⚙️ Register Service Worker"}
        </button>

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={handleSendTestNotification}
          disabled={!permission || permission !== "granted"}
        >
          🔔 Send Test Notification
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Notification Status:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>
            <strong>Permission:</strong>{" "}
            <span
              className={
                permission === "granted" ? "text-green-600" : "text-red-600"
              }
            >
              {permission || "unknown"}
            </span>
          </p>
          <p>
            <strong>Service Worker:</strong>{" "}
            <span
              className={
                serviceWorkerRegistered ? "text-green-600" : "text-red-600"
              }
            >
              {serviceWorkerRegistered ? "Registered" : "Not Registered"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h2 className="font-semibold mb-2">How Notifications Work:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Browser requests notification permission</li>
          <li>Service worker is registered (sw.js)</li>
          <li>Notifications can be scheduled or shown immediately</li>
          <li>
            Service worker handles showing notifications even when tab is closed
          </li>
          <li>Local storage backs up scheduled notifications</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationTest;
