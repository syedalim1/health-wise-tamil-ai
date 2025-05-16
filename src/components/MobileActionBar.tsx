import React, { useState, useEffect } from "react";
import {
  Plus,
  Bell,
  User,
  Home,
  FlaskRound,
  MessageCircle,
  ActivitySquare,
  PanelTop,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

interface MobileActionBarProps {
  openAddMedicationModal: () => void;
}

const MobileActionBar: React.FC<MobileActionBarProps> = ({
  openAddMedicationModal,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("home");

  // Set active tab based on current location
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setActiveTab("home");
    else if (path === "/meditation") setActiveTab("meditation");
    else if (path === "/profile") setActiveTab("profile");
    else if (path === "/chat") setActiveTab("chat");
  }, [location]);

  const handleQuickAction = (action: string) => {
    setActiveTab(action);

    switch (action) {
      case "add":
        openAddMedicationModal();
        break;
      case "home":
        navigate("/");
        break;
      case "meditation":
        navigate("/meditation");
        break;
      case "profile":
        navigate("/profile");
        break;
      case "notifications":
        // Show a toast for now, in a real app would open notifications panel
        const unreadCount = Math.floor(Math.random() * 5);
        toast.info(`You have ${unreadCount} unread notifications`, {
          position: "bottom-center",
          duration: 2000,
        });
        break;

      case "chat":
        navigate("/chat");
        break;

      default:
        break;
    }
  };

  // Animation variants for tab buttons
  const tabVariants = {
    active: {
      y: -5,
      scale: 1.1,
      transition: { type: "spring", stiffness: 300 },
    },
    inactive: {
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300 },
    },
  };

  // Animation for notification indicator
  const pulseVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop",
      },
    },
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
      {/* Add gradient shadow for better visual separation */}
      <div className="h-2 bg-gradient-to-t from-white to-transparent"></div>

      {/* Main action bar */}
      <div className="bg-white border-t border-gray-200 py-2 px-2 shadow-lg">
        <div className="flex justify-around items-center">
          {/* Home Button */}
          <motion.div
            variants={tabVariants}
            animate={activeTab === "home" ? "active" : "inactive"}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`flex flex-col items-center rounded-lg p-1 ${
                activeTab === "home"
                  ? "text-health-primary bg-blue-50"
                  : "text-gray-600 hover:text-health-primary"
              }`}
              onClick={() => handleQuickAction("home")}
            >
              <Home
                className={`h-5 w-5 ${activeTab === "home" ? "stroke-2" : ""}`}
              />
              <span className="text-xs mt-1 font-medium">Home</span>
            </Button>
          </motion.div>

          {/* Meditation Button */}
          <motion.div
            variants={tabVariants}
            animate={activeTab === "meditation" ? "active" : "inactive"}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`flex flex-col items-center rounded-lg p-1 ${
                activeTab === "meditation"
                  ? "text-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-purple-600"
              }`}
              onClick={() => handleQuickAction("meditation")}
            >
              <FlaskRound
                className={`h-5 w-5 ${
                  activeTab === "meditation" ? "stroke-2" : ""
                }`}
              />
              <span className="text-xs mt-1 font-medium">Meditation</span>
            </Button>
          </motion.div>

          {/* Chat Button */}
          <motion.div
            variants={tabVariants}
            animate={activeTab === "chat" ? "active" : "inactive"}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`flex flex-col items-center rounded-lg p-1 ${
                activeTab === "chat"
                  ? "text-cyan-600 bg-cyan-50"
                  : "text-gray-600 hover:text-cyan-600"
              }`}
              onClick={() => handleQuickAction("chat")}
            >
              <MessageCircle
                className={`h-5 w-5 ${activeTab === "chat" ? "stroke-2" : ""}`}
              />
              <span className="text-xs mt-1 font-medium">Chat</span>
            </Button>
          </motion.div>

          {/* profile Button */}
          <motion.div
            variants={tabVariants}
            animate={activeTab === "profile" ? "active" : "inactive"}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`flex flex-col items-center rounded-lg p-1 ${
                activeTab === "profile"
                  ? "text-cyan-600 bg-cyan-50"
                  : "text-gray-600 hover:text-cyan-600"
              }`}
              onClick={() => handleQuickAction("profile")}
            >
              <MessageCircle
                className={`h-5 w-5 ${
                  activeTab === "profile" ? "stroke-2" : ""
                }`}
              />
              <span className="text-xs mt-1 font-medium">Profile</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MobileActionBar;
