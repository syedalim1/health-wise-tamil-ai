import React, { useEffect, useState } from "react";
import { requestFCMToken, sendTokenToServer } from "@/utils/firebase";
import axios from "axios";

const NotificationTest: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a token in localStorage on initial load
    const savedToken = localStorage.getItem("fcmToken");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const fetchToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission not granted");
        setLoading(false);
        return;
      }

      //   const currentToken = await requestFCMToken();
      const currentToken =
        "ewkfl49kdPQrfeh9OiR2s9:APA91bHgJzT_a_7y3Bn_QVsQ__WbRjDNfmXPF8L-bbzVHmiM8JLk7AyVkVyZAmJFl9Nk7Yd0hRWzjY2gvacsRE026p2w8I_k2AUJsAzAb3jEBK_o_M9tB2E";
      if (currentToken) {
        setToken(currentToken);
      } else {
        setError("No registration token available");
      }
    } catch (err) {
      console.error("Error fetching FCM token", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!token) return alert("Token illa");

    try {
      console.log("Sending notification to token:", token);



      const res = await axios.post("/api/sendNotification", {
        token,
      });
      // if (!res.ok) {
      //   throw new Error("Server error while sending notification");
      // }
      console.log("Response from FCM:", res);

      // const data = await res
      //   .json()
      //   .catch(() => ({ message: "Notification sent (no JSON)" }));
      // alert(data.message);
    } catch (error) {
      console.error("Error sending notification", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">FCM Token Testing Page</h1>

      <div className="mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
          onClick={fetchToken}
          disabled={loading}
        >
          {loading ? "Processing..." : "🔑 Get FCM Token"}
        </button>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleSendNotification}
          disabled={!token || loading}
        >
          🔔 Send Test Notification
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {token && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Your FCM Token:</h2>
          <div className="bg-gray-100 p-4 rounded break-all">
            <code>{token}</code>
          </div>
          <p className="text-sm mt-2 text-gray-600">
            This token is stored in localStorage and sent to the server.
          </p>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h2 className="font-semibold mb-2">How FCM Tokens Work:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Browser requests notification permission</li>
          <li>Service worker is registered (firebase-messaging-sw.js)</li>
          <li>Firebase generates a unique FCM token for this device/browser</li>
          <li>Token is sent to your server to associate with the user</li>
          <li>Server uses token to send push notifications via Firebase</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationTest;
