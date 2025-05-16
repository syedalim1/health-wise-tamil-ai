import React, { useState, useEffect } from "react";
import { UserCircle, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileProps {
  language: Language;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  emergencyContact?: string;
  healthConditions?: string[];
  currentMedications?: string[];
}

const Profile: React.FC<ProfileProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserData>>({});

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure we have basic user data, add demo data if needed
        setUserData({
          id: parsedUser.id || "user1",
          name: parsedUser.name || "Demo User",
          email: parsedUser.email || "user@example.com",
          phone: parsedUser.phone || "",
          age: parsedUser.age || 0,
          emergencyContact: parsedUser.emergencyContact || "",
          healthConditions: parsedUser.healthConditions || [],
          currentMedications: parsedUser.currentMedications || [],
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
        toast.error("Could not load user profile");
      }
    }
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setIsEditing(false);
      setEditData({});
    } else {
      // Start editing with current data
      setIsEditing(true);
      setEditData({ ...userData });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value,
    });
  };

  const handleSave = () => {
    if (!userData) return;

    // Merge existing data with edited data
    const updatedUserData = {
      ...userData,
      ...editData,
    };

    // Update state
    setUserData(updatedUserData);

    // Save to localStorage
    localStorage.setItem("currentUser", JSON.stringify(updatedUserData));

    // Exit edit mode
    setIsEditing(false);
    setEditData({});

    toast.success("Profile updated successfully");
  };

  if (!userData) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                  View and manage your profile information
                </CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={handleEditToggle}>
                {isEditing ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col items-center md:flex-row md:items-start gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <UserCircle className="h-24 w-24 text-gray-400" />
                  {!isEditing && (
                    <span className="text-lg font-medium mt-2">
                      {userData.name}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={editData.name || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={editData.email || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={editData.phone || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          value={editData.age || 0}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="emergencyContact">
                          Emergency Contact
                        </Label>
                        <Input
                          id="emergencyContact"
                          name="emergencyContact"
                          value={editData.emergencyContact || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium text-gray-500">
                          Email:
                        </span>
                        <span className="col-span-2">{userData.email}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium text-gray-500">
                          Phone:
                        </span>
                        <span className="col-span-2">
                          {userData.phone || "Not set"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium text-gray-500">
                          Age:
                        </span>
                        <span className="col-span-2">
                          {userData.age || "Not set"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium text-gray-500">
                          Emergency Contact:
                        </span>
                        <span className="col-span-2">
                          {userData.emergencyContact || "Not set"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Health Information</h3>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium text-sm text-gray-500">
                      Health Conditions:
                    </h4>
                    {userData.healthConditions &&
                    userData.healthConditions.length > 0 ? (
                      <ul className="list-disc list-inside mt-1">
                        {userData.healthConditions.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">
                        No health conditions recorded
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-500">
                    Current Medications:
                  </h4>
                  {userData.currentMedications &&
                  userData.currentMedications.length > 0 ? (
                    <ul className="list-disc list-inside mt-1">
                      {userData.currentMedications.map((medication, index) => (
                        <li key={index}>{medication}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      No medications recorded
                    </p>
                  )}
                </div>
              </div>
            </CardContent>

            {isEditing && (
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleEditToggle}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Manage your app preferences and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive Medication Cares
                    </p>
                  </div>
                  <div className="flex h-5 items-center">
                    <input
                      id="notifications"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      defaultChecked={true}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Updates</h3>
                    <p className="text-sm text-gray-500">
                      Receive weekly health reports
                    </p>
                  </div>
                  <div className="flex h-5 items-center">
                    <input
                      id="email-updates"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      defaultChecked={false}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-sm text-gray-500">Use dark theme</p>
                  </div>
                  <div className="flex h-5 items-center">
                    <input
                      id="dark-mode"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      defaultChecked={false}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
