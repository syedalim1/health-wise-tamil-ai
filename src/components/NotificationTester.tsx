import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  askNotificationPermission,
  setupFirebaseMessaging,
} from "@/utils/notificationUtils";
import { requestFCMToken } from "@/utils/firebase";
import { toast } from "@/components/ui/sonner";

const NotificationTester = () => {
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setStatus("Requesting permission...");

    try {
      const permission = await askNotificationPermission();
      setStatus(`Permission result: ${permission ? "granted" : "denied"}`);

      toast({
        title: "Notification Permission",
        description: permission ? "Permission granted!" : "Permission denied.",
      });
    } catch (error) {
      console.error("Error requesting permission:", error);
      setStatus("Error requesting permission");

      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupFirebase = async () => {
    setIsLoading(true);
    setStatus("Setting up Firebase Messaging...");

    try {
      const success = await setupFirebaseMessaging();
      setStatus(`Firebase setup ${success ? "successful" : "failed"}`);

      toast({
        title: "Firebase Messaging",
        description: success ? "Setup successful!" : "Setup failed.",
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error setting up Firebase:", error);
      setStatus("Error setting up Firebase");

      toast({
        title: "Error",
        description: "Failed to set up Firebase Messaging",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectFCMRequest = async () => {
    setIsLoading(true);
    setStatus("Requesting FCM token directly...");

    try {
      const token = await requestFCMToken();
      setStatus(`Direct FCM request ${token ? "successful" : "failed"}`);

      toast({
        title: "FCM Token",
        description: token
          ? "Token retrieved successfully!"
          : "Failed to get token.",
        variant: token ? "default" : "destructive",
      });

      if (token) {
        console.log("Token:", token.substring(0, 10) + "...");
      }
    } catch (error) {
      console.error("Error requesting FCM token directly:", error);
      setStatus("Error requesting FCM token");

      toast({
        title: "Error",
        description: "Failed to request FCM token directly",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkServiceWorker = () => {
    if (!("serviceWorker" in navigator)) {
      setStatus("Service Workers are not supported in this browser");
      return;
    }

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        if (registrations.length === 0) {
          setStatus("No service workers registered");
        } else {
          setStatus(`${registrations.length} service worker(s) registered`);
          console.log("Registered service workers:", registrations);
        }
      })
      .catch((error) => {
        console.error("Error checking service workers:", error);
        setStatus("Error checking service workers");
      });
  };

  const sendTestNotification = () => {
    if (!("Notification" in window)) {
      setStatus("Notifications not supported");
      return;
    }

    if (Notification.permission !== "granted") {
      setStatus("Notification permission not granted");
      return;
    }

    try {
      new Notification("Test Notification", {
        body: "This is a test notification",
        icon: "/favicon.ico",
      });
      setStatus("Test notification sent");
    } catch (error) {
      console.error("Error sending test notification:", error);
      setStatus("Error sending test notification");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Push Notification Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleRequestPermission}
            disabled={isLoading}
            variant="outline"
          >
            1. Request Permission
          </Button>

          <Button
            onClick={checkServiceWorker}
            disabled={isLoading}
            variant="outline"
          >
            2. Check Service Worker
          </Button>

          <Button
            onClick={handleSetupFirebase}
            disabled={isLoading}
            variant="outline"
          >
            3. Setup Firebase
          </Button>

          <Button
            onClick={handleDirectFCMRequest}
            disabled={isLoading}
            variant="outline"
          >
            4. Direct FCM Request
          </Button>

          <Button
            onClick={sendTestNotification}
            disabled={isLoading}
            variant="default"
            className="col-span-2"
          >
            Send Test Notification
          </Button>
        </div>

        {status && (
          <div className="p-2 bg-gray-100 rounded mt-4">
            <p className="text-sm font-mono">{status}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>Browser: {navigator.userAgent}</p>
          <p>Protocol: {window.location.protocol}</p>
          <p>SecureContext: {window.isSecureContext ? "Yes" : "No"}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTester;
