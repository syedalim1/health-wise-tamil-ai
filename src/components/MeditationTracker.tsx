import React, { useState, useEffect } from "react";
import { Circle, Play, Pause, Save, Clock, PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import { toast } from "@/components/ui/sonner";

interface MeditationTrackerProps {
  language: Language;
}

interface MeditationSession {
  id: string;
  date: Date;
  duration: number; // in seconds
  type: string;
  notes?: string;
}

const MeditationTracker: React.FC<MeditationTrackerProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<{
    type: string;
    notes: string;
  }>({
    type: "mindfulness",
    notes: "",
  });

  const meditationTypes = [
    { value: "mindfulness", label: "Mindfulness Meditation" },
    { value: "breathing", label: "Breathing Meditation" },
    { value: "body-scan", label: "Body Scan Meditation" },
    { value: "loving-kindness", label: "Loving-Kindness Meditation" },
    { value: "yoga", label: "Yoga Meditation" },
  ];

  // Load previous sessions on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("meditationSessions");
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions).map(
          (session: any) => ({
            ...session,
            date: new Date(session.date),
          })
        );
        setSessions(parsedSessions);
      } catch (error) {
        console.error("Error parsing saved sessions:", error);
      }
    }
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
  };

  const saveSession = () => {
    if (seconds < 30) {
      toast.error("Session too short to save (minimum 30 seconds)");
      return;
    }

    setIsDialogOpen(true);
  };

  const handleSaveSession = () => {
    const newSession: MeditationSession = {
      id: Date.now().toString(),
      date: new Date(),
      duration: seconds,
      type: currentSession.type,
      notes: currentSession.notes || undefined,
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);

    // Save to localStorage
    localStorage.setItem("meditationSessions", JSON.stringify(updatedSessions));

    // Reset the timer and form
    resetTimer();
    setCurrentSession({
      type: "mindfulness",
      notes: "",
    });
    setIsDialogOpen(false);

    toast.success("Meditation session saved");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
        <Circle className="h-6 w-6 mr-2 text-health-primary" />
        Meditation Tracker
      </h2>

      <Card className="bg-gradient-to-br from-health-light to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Current Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-5xl font-light mb-6 text-health-primary">
            {formatTime(seconds)}
          </div>
          <Progress
            value={((seconds % 60) / 60) * 100}
            className="w-64 h-2 mb-8"
          />
          <div className="flex space-x-4">
            <Button
              variant="outline"
              className="w-12 h-12 rounded-full p-0 border-health-primary text-health-primary"
              onClick={toggleTimer}
            >
              {isActive ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="outline"
              className="w-12 h-12 rounded-full p-0 border-health-primary text-health-primary"
              onClick={saveSession}
              disabled={seconds === 0}
            >
              <Save className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-4 flex justify-center">
          <p className="text-sm text-gray-500">
            Breathe deeply and stay present
          </p>
        </CardFooter>
      </Card>

      <h3 className="text-xl font-medium mt-8 mb-4">Recent Sessions</h3>

      {sessions.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-white">
          <Clock className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-gray-500">
            No meditation sessions recorded yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions
            .slice()
            .reverse()
            .slice(0, 5)
            .map((session) => (
              <Card key={session.id} className="overflow-hidden">
                <div
                  className={`h-1 ${getMeditationTypeColor(session.type)}`}
                ></div>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">
                      {meditationTypes.find((t) => t.value === session.type)
                        ?.label || session.type}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {session.date.toLocaleDateString()} •{" "}
                      {formatTime(session.duration)}
                    </p>
                    {session.notes && (
                      <p className="text-xs text-gray-500 mt-1">
                        {session.notes.length > 50
                          ? `${session.notes.substring(0, 50)}...`
                          : session.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="font-mono text-health-primary">
                      {formatTime(session.duration)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

          {sessions.length > 5 && (
            <div className="text-center py-2">
              <Button variant="link" className="text-health-primary">
                View all {sessions.length} sessions
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Meditation Session</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="meditation-type">Meditation Type</Label>
              <Select
                value={currentSession.type}
                onValueChange={(value) =>
                  setCurrentSession({ ...currentSession, type: value })
                }
              >
                <SelectTrigger className="input-health">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {meditationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="How did you feel? What did you notice?"
                value={currentSession.notes}
                onChange={(e) =>
                  setCurrentSession({
                    ...currentSession,
                    notes: e.target.value,
                  })
                }
                className="input-health"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Session duration:{" "}
                <span className="font-medium">{formatTime(seconds)}</span>
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSession}
                className="bg-health-primary hover:bg-health-primary/90"
              >
                Save Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to get color based on meditation type
function getMeditationTypeColor(type: string): string {
  switch (type) {
    case "mindfulness":
      return "bg-health-primary";
    case "breathing":
      return "bg-blue-400";
    case "body-scan":
      return "bg-purple-400";
    case "loving-kindness":
      return "bg-pink-400";
    case "yoga":
      return "bg-orange-400";
    default:
      return "bg-gray-400";
  }
}

export default MeditationTracker;
