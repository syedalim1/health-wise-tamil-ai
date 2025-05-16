import React from "react";
import {
  Bell,
  Clock,
  MessageCircle,
  PillIcon,
  Calendar,
  Circle,
  UserCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import { useNavigate, useLocation } from "react-router-dom";
import { toast as showToast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationsPanel from "./NotificationsPanel";

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
  onTabChange,
}) => {
  const strings = getLanguageStrings(currentLanguage);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  // Determine active tab based on current route path
  const currentPath = location.pathname;
  const currentTab =
    currentPath === "/"
      ? "reminder"
      : currentPath === "/meditation"
      ? "meditation"
      : currentPath === "/stock"
      ? "stock"
      : currentPath === "/chat"
      ? "chat"
      : currentPath === "/profile"
      ? "profile"
      : currentPath === "/settings"
      ? "settings"
      : "";

  // Handle navigation and tab change
  const handleNavigation = (tab: string, path: string) => {
    onTabChange(tab);
    navigate(path);
  };

  return (
    <div className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => handleNavigation("reminder", "/")}
          >
            <PillIcon className="h-6 w-6 text-health-primary" />
            <span className="font-bold text-lg text-health-primary">
              {strings.appTitle}
            </span>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => handleNavigation("reminder", "/")}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                currentTab === "reminder"
                  ? "bg-health-light text-health-primary"
                  : "hover:bg-gray-100"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{strings.tabletReminder}</span>
            </button>

            <button
              onClick={() => handleNavigation("meditation", "/meditation")}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                currentTab === "meditation"
                  ? "bg-health-light text-health-primary"
                  : "hover:bg-gray-100"
              }`}
            >
              <Circle className="h-4 w-4" />
              <span>{strings.meditation}</span>
            </button>


            <button
              onClick={() => handleNavigation("chat", "/chat")}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                currentTab === "chat"
                  ? "bg-health-light text-health-primary"
                  : "hover:bg-gray-100"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{strings.chatAssistant}</span>
            </button>

            {currentUser && (
              <div className="flex items-center space-x-1">
                <NotificationsPanel language={currentLanguage} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <UserCircle className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleNavigation("profile", "/profile")}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigation("settings", "/settings")}
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        localStorage.removeItem("currentUser");
                        showToast.success("Logged out", {
                          description: "You have been logged out successfully",
                        });
                        navigate("/login");
                      }}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />

            {!currentUser && (
              <Button
                variant="outline"
                onClick={() => {
                  navigate("/login");
                }}
              >
                Login
              </Button>
            )}
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default Navbar;
