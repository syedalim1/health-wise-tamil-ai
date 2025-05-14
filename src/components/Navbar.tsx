
import React from 'react';
import { Bell, Clock, MessageCircle, PillIcon } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { Language, getLanguageStrings } from '@/utils/languageUtils';

interface NavbarProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onLanguageChange,
  activeTab,
  onTabChange
}) => {
  const strings = getLanguageStrings(currentLanguage);

  return (
    <div className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <PillIcon className="h-6 w-6 text-health-primary" />
            <span className="font-bold text-lg text-health-primary">{strings.appTitle}</span>
          </div>
          
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => onTabChange('reminder')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'reminder' 
                  ? 'bg-health-light text-health-primary' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{strings.tabletReminder}</span>
            </button>
            
            <button 
              onClick={() => onTabChange('stock')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'stock' 
                  ? 'bg-health-light text-health-primary' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>{strings.stockTracker}</span>
            </button>
            
            <button 
              onClick={() => onTabChange('chat')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'chat' 
                  ? 'bg-health-light text-health-primary' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{strings.chatAssistant}</span>
            </button>
            
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>
        </div>
        
        {/* Mobile tab navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex justify-around">
            <button 
              onClick={() => onTabChange('reminder')}
              className={`flex flex-col items-center py-2 flex-1 ${
                activeTab === 'reminder' ? 'text-health-primary' : 'text-gray-500'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs mt-1">{strings.tabletReminder}</span>
            </button>
            
            <button 
              onClick={() => onTabChange('stock')}
              className={`flex flex-col items-center py-2 flex-1 ${
                activeTab === 'stock' ? 'text-health-primary' : 'text-gray-500'
              }`}
            >
              <Bell className="h-5 w-5" />
              <span className="text-xs mt-1">{strings.stockTracker}</span>
            </button>
            
            <button 
              onClick={() => onTabChange('chat')}
              className={`flex flex-col items-center py-2 flex-1 ${
                activeTab === 'chat' ? 'text-health-primary' : 'text-gray-500'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs mt-1">{strings.chatAssistant}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
