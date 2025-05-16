import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Sun,
  Volume2,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsProps {
  language: Language;
}

interface AppSettings {
  notifications: boolean;
  darkMode: boolean;
  volume: number;
  reminderFrequency: string;
  language: Language;
  emergencyAlerts: boolean;
  dataSaving: boolean;
  theme: "system" | "light" | "dark";
}

const Settings: React.FC<SettingsProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Try to load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error("Error parsing settings:", e);
      }
    }

    // Default settings
    return {
      notifications: true,
      darkMode: false,
      volume: 70,
      reminderFrequency: "daily",
      language: language,
      emergencyAlerts: true,
      dataSaving: false,
      theme: "system",
    };
  });

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Save to localStorage
    localStorage.setItem("appSettings", JSON.stringify(newSettings));

    // Show toast notification
    toast.success(`Setting updated: ${key}`);

    // Apply settings if needed
    if (key === "darkMode") {
      // Toggle dark mode class on body or html element
      if (value) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6 text-health-primary" />
        <h1 className="text-2xl font-bold">Application Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure how you want to receive alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Medication Reminders</span>
                </div>
                <p className="text-sm text-gray-500">
                  Receive alerts when it's time to take your medication
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">Emergency Alerts</span>
                <p className="text-sm text-gray-500">
                  Get critical notifications for emergencies
                </p>
              </div>
              <Switch
                checked={settings.emergencyAlerts}
                onCheckedChange={(checked) =>
                  updateSetting("emergencyAlerts", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Reminder Frequency</span>
                <Select
                  value={settings.reminderFrequency}
                  onValueChange={(value) =>
                    updateSetting("reminderFrequency", value)
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Change how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span className="font-medium">Dark Mode</span>
                </div>
                <p className="text-sm text-gray-500">
                  Enable dark theme for the application
                </p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) =>
                  updateSetting("darkMode", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Theme</span>
                <Select
                  value={settings.theme}
                  onValueChange={(value: "system" | "light" | "dark") =>
                    updateSetting("theme", value)
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sound</CardTitle>
            <CardDescription>
              Configure volume and sound settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span className="font-medium">Alert Volume</span>
                </div>
                <span className="text-sm font-medium">{settings.volume}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => updateSetting("volume", value[0])}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data and Privacy</CardTitle>
            <CardDescription>
              Manage your data usage and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium">Data Saving Mode</span>
                <p className="text-sm text-gray-500">
                  Reduce data usage when on mobile networks
                </p>
              </div>
              <Switch
                checked={settings.dataSaving}
                onCheckedChange={(checked) =>
                  updateSetting("dataSaving", checked)
                }
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Clear all app data
                localStorage.removeItem("appSettings");
                toast.success("All application data cleared");
                // Reset to defaults
                updateSetting("notifications", true);
                updateSetting("darkMode", false);
                updateSetting("volume", 70);
                updateSetting("reminderFrequency", "daily");
                updateSetting("emergencyAlerts", true);
                updateSetting("dataSaving", false);
                updateSetting("theme", "system");
              }}
            >
              Clear App Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
