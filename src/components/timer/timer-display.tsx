"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RefreshCw, SkipForward, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Task, Session } from "@/lib/types";

// Define compatible task type that matches database schema
interface DatabaseTask {
  id: number;
  title: string;
  completed: boolean;
  description?: string;
}

const CircularProgress = ({
  progress,
  size = 280,
  strokeWidth = 12,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 transform">
      <circle
        className="text-muted"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-primary transition-all duration-300 ease-linear"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
};

export function TimerDisplay() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Settings state (stored in localStorage)
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  // Timer state
  const [mode, setMode] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  
  // Task and session state
  const [activeTask, setActiveTask] = useState<DatabaseTask | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [refreshTasks, setRefreshTasks] = useState(0); // Trigger for refreshing tasks

  // Load settings from localStorage
  useEffect(() => {
    const storedWorkDuration = localStorage.getItem("focusflow-work-duration");
    if (storedWorkDuration) setWorkDuration(JSON.parse(storedWorkDuration));

    const storedBreakDuration = localStorage.getItem("focusflow-break-duration");
    if (storedBreakDuration) setBreakDuration(JSON.parse(storedBreakDuration));

    const storedActiveTaskId = localStorage.getItem("focusflow-active-task-id");
    if (storedActiveTaskId) {
      // We'll set this after tasks are loaded
    }
  }, []);

  // Load tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return; // Don't fetch if not authenticated
      
      try {
        const response = await authenticatedFetch('/api/tasks');
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
          
          // Try to restore previously selected task
          const storedActiveTaskId = localStorage.getItem("focusflow-active-task-id");
          if (storedActiveTaskId) {
            const storedTask = data.find((task: DatabaseTask) => task.id === parseInt(storedActiveTaskId));
            if (storedTask && !storedTask.completed) {
              setActiveTask(storedTask);
              return;
            }
          }
          
          // Set first incomplete task as active if none selected
          if (!activeTask) {
            const firstIncomplete = data.find((task: DatabaseTask) => !task.completed);
            if (firstIncomplete) {
              setActiveTask(firstIncomplete);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        toast({ title: "Failed to load tasks", variant: "destructive" });
      }
    };

    fetchTasks();
    
    // Set up periodic refresh every 10 seconds to sync with task manager
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, [toast, refreshTasks, user]); // Include user in dependencies

  // Save active task to localStorage when it changes
  useEffect(() => {
    if (activeTask) {
      localStorage.setItem("focusflow-active-task-id", activeTask.id.toString());
    } else {
      localStorage.removeItem("focusflow-active-task-id");
    }
  }, [activeTask]);

  // Reset timer when mode or duration changes
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setSecondsLeft(mode === "work" ? workDuration * 60 : breakDuration * 60);
    if (currentSession && mode === "work") {
      endSession();
    }
  }, [mode, workDuration, breakDuration, currentSession]);
  
  useEffect(() => {
    resetTimer();
  }, [workDuration, breakDuration, mode, resetTimer]);

  // Start a new session
  const startSession = async (taskId: number) => {
    try {
      const response = await authenticatedFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ taskId })
      });

      if (response.ok) {
        const session = await response.json();
        setCurrentSession(session);
      } else {
        toast({ title: "Failed to start session", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      toast({ title: "Failed to start session", variant: "destructive" });
    }
  };

  // End current session
  const endSession = async () => {
    if (!currentSession) return;

    try {
      const totalSeconds = (mode === "work" ? workDuration : breakDuration) * 60;
      const sessionDuration = totalSeconds - secondsLeft;
      
      await authenticatedFetch(`/api/sessions/${currentSession.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          endedAt: new Date().toISOString(),
          duration: sessionDuration
        })
      });

      setCurrentSession(null);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Main timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (mode === "work") {
              endSession(); // End work session
              setMode("break");
              setSecondsLeft(breakDuration * 60);
              toast({ title: "Time for a break!", description: "Great work session. Relax for a bit." });
            } else {
              setMode("work");
              setSecondsLeft(workDuration * 60);
              toast({ title: "Back to work!", description: "Break's over. Let's get focused." });
            }
            setIsActive(false); // Auto-pause when switching
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, mode, breakDuration, workDuration, toast, currentSession, secondsLeft]);

  const toggleTimer = async () => {
    if (mode === 'work' && !activeTask) {
      toast({ title: "No active task", description: "Please select a task to start the timer.", variant: "destructive" });
      return;
    }

    if (!isActive && mode === 'work' && activeTask && !currentSession) {
      // Starting work timer - create session
      await startSession(activeTask.id);
    } else if (isActive && mode === 'work' && currentSession) {
      // Pausing work timer - end session
      await endSession();
    }

    setIsActive(!isActive);
  };
  
  const skipToNext = async () => {
    if (currentSession && mode === 'work') {
      await endSession();
    }
    setMode(current => current === 'work' ? 'break' : 'work');
    setIsActive(false);
  };

  const handleWorkDurationChange = (duration: number) => {
    setWorkDuration(duration);
    localStorage.setItem("focusflow-work-duration", JSON.stringify(duration));
  };

  const handleBreakDurationChange = (duration: number) => {
    setBreakDuration(duration);
    localStorage.setItem("focusflow-break-duration", JSON.stringify(duration));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalSeconds = (mode === "work" ? workDuration : breakDuration) * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">
            {mode === "work" ? "Focus Session" : "Break Time"}
          </CardTitle>
          <div className="flex gap-2">
            <TimerSettingsDialog 
              workDuration={workDuration}
              breakDuration={breakDuration}
              onWorkDurationChange={handleWorkDurationChange}
              onBreakDurationChange={handleBreakDurationChange}
            />
          </div>
        </div>
        
        {/* Task Selection */}
        {mode === "work" && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 bg-primary rounded-full"></div>
              <span>Active Task:</span>
            </div>
            <TaskSelectorDialog 
              tasks={tasks}
              activeTask={activeTask}
              onTaskSelect={setActiveTask}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-8 pt-6">
        <div className="relative">
          <CircularProgress progress={progress} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-7xl font-bold tracking-tighter">
              {formatTime(secondsLeft)}
            </span>
            {mode === 'break' && (
              <p className="text-sm text-muted-foreground">
                Relax and recharge
              </p>
            )}
            {currentSession && mode === 'work' && (
              <p className="text-xs text-muted-foreground mt-1">
                Session in progress
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-sm items-center justify-center gap-4">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full" onClick={resetTimer}>
            <RefreshCw className="h-6 w-6" />
          </Button>
          <Button size="icon" className="h-20 w-20 rounded-full" onClick={toggleTimer}>
            {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full" onClick={skipToNext}>
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskSelectorDialog({
  tasks,
  activeTask,
  onTaskSelect,
}: {
  tasks: DatabaseTask[];
  activeTask: DatabaseTask | null;
  onTaskSelect: (task: DatabaseTask | null) => void;
}) {
  const incompleteTasks = tasks.filter(task => !task.completed);

  if (incompleteTasks.length === 0) {
    return (
      <span className="text-sm text-muted-foreground italic">
        No tasks available - create some tasks first
      </span>
    );
  }

  return (
    <Select
      value={activeTask?.id.toString() || ""}
      onValueChange={(value) => {
        const task = tasks.find(t => t.id === parseInt(value));
        onTaskSelect(task || null);
      }}
    >
      <SelectTrigger className="w-auto min-w-[200px] h-8 text-sm border-none bg-transparent hover:bg-muted/50 focus:ring-1">
        <SelectValue placeholder="Choose a task to focus on">
          {activeTask ? (
            <span className="font-medium">{activeTask.title}</span>
          ) : (
            <span className="text-muted-foreground">Choose a task to focus on</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {incompleteTasks.map((task) => (
          <SelectItem key={task.id} value={task.id.toString()}>
            <span className="truncate max-w-[300px]">{task.title}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TimerSettingsDialog({
  workDuration,
  breakDuration,
  onWorkDurationChange,
  onBreakDurationChange,
}: {
  workDuration: number;
  breakDuration: number;
  onWorkDurationChange: (duration: number) => void;
  onBreakDurationChange: (duration: number) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="work-duration" className="text-right">
              Work (min)
            </Label>
            <Input
              id="work-duration"
              type="number"
              value={workDuration}
              onChange={(e) => onWorkDurationChange(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="break-duration" className="text-right">
              Break (min)
            </Label>
            <Input
              id="break-duration"
              type="number"
              value={breakDuration}
              onChange={(e) => onBreakDurationChange(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
