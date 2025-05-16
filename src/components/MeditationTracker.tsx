import React, { useState, useEffect } from "react";
import {
  Circle,
  Play,
  Pause,
  Save,
  Clock,
  PlusCircle,
  ChevronRight,
  BarChart,
  Activity,
  Calendar,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  const [currentTab, setCurrentTab] = useState<"sessions" | "stats">(
    "sessions"
  );
  const [breatheIn, setBreatheIn] = useState(true);
  const [breathePhase, setBreathePhase] = useState<
    "in" | "hold" | "out" | "rest"
  >("in");
  const [breatheCount, setBreatheCount] = useState(0);

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

  // Enhanced breathing animation with 4-phase cycle
  useEffect(() => {
    if (!isActive) return;

    const breatheCycle = () => {
      // 4-7-8 breathing technique
      // 4 seconds inhale, 7 seconds hold, 8 seconds exhale, 1 second rest
      switch (breathePhase) {
        case "in":
          setBreatheIn(true);
          setTimeout(() => setBreathePhase("hold"), 4000);
          break;
        case "hold":
          setTimeout(() => setBreathePhase("out"), 7000);
          break;
        case "out":
          setBreatheIn(false);
          setTimeout(() => setBreathePhase("rest"), 8000);
          break;
        case "rest":
          setTimeout(() => {
            setBreathePhase("in");
            setBreatheCount((prev) => prev + 1);
          }, 1000);
          break;
      }
    };

    breatheCycle();

    return () => {
      // No need to clearTimeout as the phases are handled by the state changes
    };
  }, [isActive, breathePhase]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Formats time in a human-readable format (e.g., "2 min 30 sec")
  const formatTimeReadable = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    let result = "";
    if (minutes > 0) {
      result += `${minutes} ${strings.minutes} `;
    }
    if (seconds > 0 || minutes === 0) {
      result += `${seconds} ${strings.seconds}`;
    }
    return result;
  };

  const toggleTimer = () => {
    if (!isActive) {
      // Starting a new session
      setBreathePhase("in");
      setBreatheCount(0);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
    setBreathePhase("in");
    setBreatheCount(0);
  };

  const saveSession = () => {
    if (seconds < 30) {
      toast.error(strings.sessionTooShort);
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

    toast.success(strings.meditationSavedSuccess);
  };

  // Calculate statistics
  const calculateStats = () => {
    if (sessions.length === 0)
      return {
        totalTime: 0,
        totalSessions: 0,
        avgDuration: 0,
        longestSession: 0,
        streak: 0,
        thisWeekCount: 0,
        thisWeekTime: 0,
      };

    const totalTime = sessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );
    const avgDuration = Math.round(totalTime / sessions.length);
    const longestSession = Math.max(
      ...sessions.map((session) => session.duration)
    );

    // Calculate streak (consecutive days)
    const dates = sessions.map((s) => new Date(s.date).toDateString());
    const uniqueDates = [...new Set(dates)].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = new Date(uniqueDates[i]);
      const prev = new Date(uniqueDates[i + 1]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) streak++;
      else break;
    }

    // Calculate this week's sessions
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessions.filter(
      (s) => new Date(s.date) >= startOfWeek
    );

    const thisWeekTime = thisWeekSessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );

    return {
      totalTime,
      totalSessions: sessions.length,
      avgDuration,
      longestSession,
      streak,
      thisWeekCount: thisWeekSessions.length,
      thisWeekTime,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6 p-4 md:p-5">
      <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
        <Circle className="h-6 w-6 mr-2 text-health-primary" />
        {strings.meditation}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-6">
          <Card className="bg-gradient-to-br from-health-light to-white overflow-hidden relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {strings.currentSession}
                {breatheCount > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-health-light text-health-primary"
                  >
                    {breatheCount} cycles
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              {/* Animated breathing circle */}
              <div className="relative">
                <div
                  className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-4000 ease-in-out ${
                    breathePhase === "in"
                      ? "scale-100 animate-pulse-slow"
                      : breathePhase === "hold"
                      ? "scale-125 bg-health-primary/5"
                      : breathePhase === "out"
                      ? "scale-100 animate-pulse-reverse"
                      : "scale-95"
                  }`}
                >
                  <div className="absolute inset-0 rounded-full bg-health-primary/10 animate-ping-slow"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-health-primary/20 border-dashed animate-spin-slow"></div>
                  <div className="text-4xl font-light text-health-primary">
                    {formatTime(seconds)}
                  </div>
                </div>

                {isActive && (
                  <div className="absolute -bottom-8 left-0 right-0 text-center text-health-primary/80 font-medium text-sm animate-pulse">
                    {breathePhase === "in" && strings.breatheIn}
                    {breathePhase === "hold" && "Hold..."}
                    {breathePhase === "out" && strings.breatheOut}
                    {breathePhase === "rest" && "..."}
                  </div>
                )}
              </div>

              <div className="mt-16 flex space-x-4">
                <Button
                  variant="outline"
                  className={`w-12 h-12 rounded-full p-0 border-2 ${
                    isActive
                      ? "border-amber-500 text-amber-500"
                      : "border-health-primary text-health-primary"
                  }`}
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
                  className="w-12 h-12 rounded-full p-0 border-2 border-health-primary text-health-primary"
                  onClick={saveSession}
                  disabled={seconds < 30}
                >
                  <Save className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
            <CardFooter className="pt-0 pb-4 flex justify-center">
              <p className="text-sm text-gray-500">{strings.breatheDeep}</p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Activity className="h-5 w-5 mr-2 text-health-primary" />
                {strings.statsTab}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    {strings.totalSessions}
                  </p>
                  <p className="text-2xl font-bold text-health-primary">
                    {stats.totalSessions}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    {strings.currentStreak}
                  </p>
                  <p className="text-2xl font-bold text-health-primary">
                    {stats.streak}{" "}
                    <span className="text-sm font-normal">{strings.days}</span>
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">{strings.totalTime}</p>
                  <p className="text-2xl font-bold text-health-primary">
                    {Math.floor(stats.totalTime / 60)}
                    <span className="text-sm font-normal">m</span>
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    {strings.longestSession}
                  </p>
                  <p className="text-2xl font-bold text-health-primary">
                    {Math.floor(stats.longestSession / 60)}
                    <span className="text-sm font-normal">m</span>
                  </p>
                </div>
              </div>

              {/* Weekly progress */}
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">This week</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {stats.thisWeekCount} sessions
                  </span>
                  <span className="text-sm">
                    {formatTimeReadable(stats.thisWeekTime)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (stats.thisWeekCount / 7) * 100)}
                  className="h-2 mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="overflow-hidden">
            <CardHeader className="pb-0">
              <Tabs
                defaultValue="sessions"
                value={currentTab}
                onValueChange={(v) => setCurrentTab(v as "sessions" | "stats")}
              >
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-health-primary" />
                    {strings.recentSessions}
                  </CardTitle>
                  <TabsList className="grid w-[200px] grid-cols-2">
                    <TabsTrigger value="sessions">
                      {strings.sessionsTab}
                    </TabsTrigger>
                    <TabsTrigger value="stats">{strings.statsTab}</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="sessions" className="space-y-4 p-1 mt-4">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-white">
                      <Clock className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-2 text-gray-500">
                        {strings.noMeditationSessions}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {sessions
                        .slice()
                        .reverse()
                        .map((session) => (
                          <Card
                            key={session.id}
                            className="overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div
                              className={`h-1 ${getMeditationTypeColor(
                                session.type
                              )}`}
                            ></div>
                            <CardContent className="p-4 flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">
                                  {meditationTypes.find(
                                    (t) => t.value === session.type
                                  )?.label || session.type}
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
                          <Button
                            variant="link"
                            className="text-health-primary"
                          >
                            {strings.viewAllSessions.replace(
                              "{count}",
                              sessions.length.toString()
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stats" className="p-1 mt-4">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-white">
                      <BarChart className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-2 text-gray-500">
                        No data available yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-sm mb-3 flex items-center">
                          <Activity className="h-4 w-4 mr-1 text-health-primary" />
                          Practice by Type
                        </h3>

                        {meditationTypes.map((type) => {
                          const sessionsByType = sessions.filter(
                            (s) => s.type === type.value
                          );
                          const totalTimeByType = sessionsByType.reduce(
                            (sum, s) => sum + s.duration,
                            0
                          );
                          const percentByType = sessions.length
                            ? Math.round(
                                (sessionsByType.length / sessions.length) * 100
                              )
                            : 0;

                          return (
                            <div key={type.value} className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>{type.label}</span>
                                <span>
                                  {sessionsByType.length} sessions (
                                  {percentByType}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getProgressColorForType(
                                    type.value
                                  )}`}
                                  style={{ width: `${percentByType}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-sm mb-3">
                          Practice Times
                        </h3>
                        <div className="text-xs text-gray-600">
                          <div className="flex justify-between mb-1">
                            <span>{strings.averageDuration}:</span>
                            <span className="font-medium">
                              {formatTimeReadable(stats.avgDuration)}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>{strings.longestSession}:</span>
                            <span className="font-medium">
                              {formatTimeReadable(stats.longestSession)}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>{strings.totalTime}:</span>
                            <span className="font-medium">
                              {formatTimeReadable(stats.totalTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Calendar heatmap visualization (simplified) */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-sm mb-3">
                          Meditation Calendar
                        </h3>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 28 }).map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (27 - i));
                            const dateStr = date.toDateString();
                            const sessionsOnDay = sessions.filter(
                              (s) => new Date(s.date).toDateString() === dateStr
                            );
                            const intensity =
                              sessionsOnDay.length > 0
                                ? sessionsOnDay.length > 2
                                  ? "bg-health-primary"
                                  : sessionsOnDay.length > 1
                                  ? "bg-health-primary/70"
                                  : "bg-health-primary/40"
                                : "bg-gray-200";

                            return (
                              <div
                                key={i}
                                className={`h-6 w-6 rounded-sm ${intensity} transition-colors`}
                                title={`${date.toLocaleDateString()}: ${
                                  sessionsOnDay.length
                                } sessions`}
                              />
                            );
                          })}
                        </div>
                        <div className="mt-2 flex justify-end items-center gap-2 text-xs text-gray-500">
                          <span>Less</span>
                          <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
                          <div className="w-3 h-3 rounded-sm bg-health-primary/40"></div>
                          <div className="w-3 h-3 rounded-sm bg-health-primary/70"></div>
                          <div className="w-3 h-3 rounded-sm bg-health-primary"></div>
                          <span>More</span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{strings.saveMeditationSession}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="meditation-type">{strings.meditationType}</Label>
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
              <Label htmlFor="notes">{strings.meditationNotes}</Label>
              <Input
                id="notes"
                placeholder={strings.meditationNotesPlaceholder}
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
                {strings.sessionDuration}:{" "}
                <span className="font-medium">{formatTime(seconds)}</span>
                <span className="text-xs ml-1">
                  ({formatTimeReadable(seconds)})
                </span>
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {strings.cancel}
              </Button>
              <Button
                onClick={handleSaveSession}
                className="bg-health-primary hover:bg-health-primary/90"
              >
                {strings.save}
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

// Helper function to get progress bar color based on meditation type
function getProgressColorForType(type: string): string {
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
