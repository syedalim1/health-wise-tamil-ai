import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import TabletReminder from "@/components/TabletReminder";
import StockTracker from "@/components/StockTracker";
import ChatAssistant from "@/components/ChatAssistant";
import MedicationCalendar from "@/components/MedicationCalendar";
import { Language } from "@/utils/languageUtils";
import { askNotificationPermission } from "@/utils/notificationUtils";
import { toast } from "@/components/ui/use-toast";
import AnimatedBackground from "@/components/AnimatedBackground";
import MeditationTracker from "@/components/MeditationTracker";

const Index = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("english");
  const [activeTab, setActiveTab] = useState<string>("reminder");
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);

  useEffect(() => {
    // Request notification permissions when the app loads
    const requestPermission = async () => {
      try {
        const hasPermission = await askNotificationPermission();
        setNotificationsEnabled(hasPermission);

        if (hasPermission) {
          toast({
            title: "Notifications enabled",
            description: "You will receive Medication Cares.",
            variant: "default",
          });
        } else {
          toast({
            title: "Notifications disabled",
            description:
              "Please enable notifications to receive Medication Cares.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        toast({
          title: "Error",
          description: "Could not request notification permissions.",
          variant: "destructive",
        });
      }
    };

    requestPermission();

    // Load saved language preference
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage as Language);
    }
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem("preferredLanguage", currentLanguage);
  }, [currentLanguage]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AnimatedBackground opacity={0.03} />

      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="container mx-auto px-4 py-6 flex-grow relative z-10">
        {activeTab === "reminder" && (
          <TabletReminder language={currentLanguage} />
        )}

        {activeTab === "calendar" && (
          <MedicationCalendar language={currentLanguage} />
        )}

        {activeTab === "meditation" && (
          <MeditationTracker language={currentLanguage} />
        )}

        {activeTab === "stock" && <StockTracker language={currentLanguage} />}

        {activeTab === "chat" && <ChatAssistant language={currentLanguage} />}
      </div>
    </div>
  );
};

export default Index;
