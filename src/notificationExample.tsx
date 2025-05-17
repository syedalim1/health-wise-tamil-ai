import React, { useEffect, useState } from "react";
import { requestNotificationPermission, onMessageListener } from "../firebase";
import { toast } from "react-hot-toast"; // You might need to install this package

interface NotificationMessage {
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
}

export const NotificationsHandler: React.FC = () => {
  const [notification, setNotification] = useState<NotificationMessage | null>(
    null
  );

  useEffect(() => {
    // Request notification permission when component mounts
    const requestPermission = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        console.log("Token received:", token);
        // Here you might want to send this token to your server
        // sendTokenToServer(token);
      }
    };

    requestPermission();

    // Set up foreground message listener
    const unsubscribe = onMessageListener().then((payload: any) => {
      setNotification(payload as NotificationMessage);

      // Show a toast notification for foreground messages
      toast.custom(
        <div className="notification-toast">
          <h4>{payload.notification.title}</h4>
          <p>{payload.notification.body}</p>
        </div>
      );
    });

    return () => {
      unsubscribe.catch((err) => console.log("Error unsubscribing:", err));
    };
  }, []);

  return (
    <>
      {/* You can render something here to show notification status if needed */}
      {notification && (
        <div style={{ display: "none" }}>
          New notification: {notification.notification.title}
        </div>
      )}
    </>
  );
};

// Example component showing how to use the NotificationsHandler
export const NotificationExample: React.FC = () => {
  return (
    <div>
      <h1>Notification Example</h1>
      <NotificationsHandler />
      <p>This page demonstrates Firebase Cloud Messaging notifications.</p>
      <p>Check the console to see your FCM token and notification events.</p>
    </div>
  );
};
