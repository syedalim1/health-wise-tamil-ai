import React, { useState, useEffect } from "react";
import { Bell, Check, Clock, Info, AlertTriangle, X } from "lucide-react";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NotificationsPanelProps {
  language: Language;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "reminder" | "alert";
  isRead: boolean;
  timestamp: string;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  language,
}) => {
  const strings = getLanguageStrings(language);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load notifications from localStorage or initialize with demo data
    const storedNotifications = localStorage.getItem("notifications");
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch (error) {
        console.error("Error parsing notifications:", error);
        setDemoNotifications();
      }
    } else {
      setDemoNotifications();
    }
  }, []);

  useEffect(() => {
    // Save notifications to localStorage whenever they change
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const setDemoNotifications = () => {
    const demoNotifications: Notification[] = [
      {
        id: "1",
        title: "Medication Care",
        message: "It's time to take your blood pressure medication",
        type: "reminder",
        isRead: false,
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: "2",
        title: "Doctor's Appointment",
        message: "You have a check-up appointment tomorrow at 10:00 AM",
        type: "info",
        isRead: false,
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: "3",
        title: "Medication Stock Low",
        message:
          "Your cholesterol medication is running low. Please refill soon.",
        type: "alert",
        isRead: true,
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ];
    setNotifications(demoNotifications);
  };

  const toggleNotificationPanel = () => {
    setIsOpen(!isOpen);
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, isRead: true }))
    );
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    } else {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "reminder":
        return <Clock className="h-5 w-5 text-green-500" />;
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={toggleNotificationPanel}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] min-w-[18px] h-[18px] bg-red-500"
            variant="destructive"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-[350px] max-h-[500px] overflow-hidden z-50 shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                {unreadCount === 0
                  ? "You're all caught up!"
                  : `You have ${unreadCount} unread notification${
                      unreadCount !== 1 ? "s" : ""
                    }`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleNotificationPanel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0 max-h-[350px] overflow-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <Bell className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500">No notifications</p>
                <p className="text-sm text-gray-400">
                  You'll be notified about Medication Cares and updates here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 flex gap-3 ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-gray-900">
                          {notification.title}
                        </p>
                        <div className="flex gap-1 ml-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-blue-500 hover:text-blue-600"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {notifications.length > 0 && (
            <CardFooter className="flex justify-between py-2 px-4">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllNotifications}
              >
                Clear all
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default NotificationsPanel;
