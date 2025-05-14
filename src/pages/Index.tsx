
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TabletReminder from '@/components/TabletReminder';
import StockTracker from '@/components/StockTracker';
import ChatAssistant from '@/components/ChatAssistant';
import { Language } from '@/utils/languageUtils';
import { askNotificationPermission } from '@/utils/notificationUtils';
import { toast } from 'sonner';

const Index = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('english');
  const [activeTab, setActiveTab] = useState<string>('reminder');

  useEffect(() => {
    // Request notification permissions when the app loads
    const requestPermission = async () => {
      const hasPermission = await askNotificationPermission();
      if (hasPermission) {
        toast.success("Notifications enabled. You will receive medication reminders.");
      } else {
        toast.error("Please enable notifications to receive medication reminders.");
      }
    };
    
    requestPermission();
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage as Language);
    }
  }, []);
  
  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLanguage);
  }, [currentLanguage]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar 
        currentLanguage={currentLanguage} 
        onLanguageChange={setCurrentLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="container mx-auto px-4 py-6 flex-grow">
        {activeTab === 'reminder' && (
          <TabletReminder language={currentLanguage} />
        )}
        
        {activeTab === 'stock' && (
          <StockTracker language={currentLanguage} />
        )}
        
        {activeTab === 'chat' && (
          <ChatAssistant language={currentLanguage} />
        )}
      </div>
    </div>
  );
};

export default Index;
