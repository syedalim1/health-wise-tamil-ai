import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Language } from "@/utils/languageUtils";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import TabletReminder from "./components/TabletReminder";
import MeditationTracker from "./components/MeditationTracker";
import ChatAssistant from "./components/ChatAssistant";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Navbar from "./components/Navbar";
import MobileActionBar from "./components/MobileActionBar";
import NotificationManager from "./components/NotificationManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Home from "./pages/Index";
import NotificationTest from "./pages/NotificationTest";
import { NotificationExample } from "./notificationExample";

const AppContent = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("english");
  const [activeTab, setActiveTab] = useState<string>("");
  const [isAddMedicationModalOpen, setIsAddMedicationModalOpen] =
    useState(false);
  const location = useLocation();

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname;
    const tab =
      path === "/"
        ? "reminder"
        : path === "/meditation"
        ? "meditation"
        : path === "/stock"
        ? "stock"
        : path === "/chat"
        ? "chat"
        : path === "/profile"
        ? "profile"
        : path === "/settings"
        ? "settings"
        : "";

    setActiveTab(tab);
  }, [location.pathname]);

  const handleOpenAddMedicationModal = () => {
    setIsAddMedicationModalOpen(true);
  };

  return (
    <>
      {/* Add NotificationManager to handle background notifications */}
      {/* <NotificationManager /> */}

      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <Toaster position="top-center" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* <NotificationExample /> */}
              <TabletReminder language={currentLanguage} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/meditation"
          element={
            <ProtectedRoute>
              <MeditationTracker language={currentLanguage} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatAssistant language={currentLanguage} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile language={currentLanguage} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings language={currentLanguage} />
            </ProtectedRoute>
          }
        />

        {/* Redirect if not logged in */}
        <Route
          path="*"
          element={
            localStorage.getItem("currentUser") ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>

      {/* Add Medication Modal */}
      <Dialog
        open={isAddMedicationModalOpen}
        onOpenChange={setIsAddMedicationModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
            <DialogDescription>
              Enter the details of your new medication to add to your reminders.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Add form fields here */}
            <p className="text-sm text-gray-500">
              This modal would contain a form to add a new medication. For now,
              it's just a demonstration of the mobile action bar functionality.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile action bar only for authenticated users */}
      {localStorage.getItem("currentUser") && (
        <MobileActionBar
          openAddMedicationModal={handleOpenAddMedicationModal}
        />
      )}

      {/* Add padding to the bottom on mobile to account for the action bar */}
      {localStorage.getItem("currentUser") && (
        <div className="pb-16 md:pb-0"></div>
      )}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
