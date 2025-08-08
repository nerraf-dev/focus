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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/app-context";
import { useToast } from "@/hooks/use-toast";

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
  const { 
    workDuration, setWorkDuration, 
    breakDuration, setBreakDuration, 
    activeTaskId, updateTaskTime, getTaskById
  } = useAppContext();
  const { toast } = useToast();

  const [mode, setMode] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);

  const activeTask = activeTaskId ? getTaskById(activeTaskId) : null;

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setSecondsLeft(mode === "work" ? workDuration * 60 : breakDuration * 60);
  }, [mode, workDuration, breakDuration]);
  
  useEffect(() => {
    resetTimer();
  }, [workDuration, breakDuration, mode, resetTimer]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (mode === "work") {
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
          if (mode === 'work' && activeTaskId) {
            updateTaskTime(activeTaskId, 1);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, mode, activeTaskId, updateTaskTime, breakDuration, toast, workDuration]);

  const toggleTimer = () => {
    if (mode === 'work' && !activeTaskId) {
        toast({ title: "No active task", description: "Please select a task to start the timer.", variant: "destructive" });
        return;
    }
    setIsActive(!isActive);
  };
  
  const skipToNext = () => {
    setMode(current => current === 'work' ? 'break' : 'work');
    setIsActive(false);
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalSeconds = (mode === "work" ? workDuration : breakDuration) * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">
          {mode === "work" ? "Focus Session" : "Break Time"}
        </CardTitle>
        <TimerSettingsDialog />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-8 pt-6">
        <div className="relative">
          <CircularProgress progress={progress} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-7xl font-bold tracking-tighter">
              {formatTime(secondsLeft)}
            </span>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {mode === 'work' ? (activeTask?.description || "No active task") : 'Relax and recharge'}
            </p>
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

function TimerSettingsDialog() {
  const { workDuration, setWorkDuration, breakDuration, setBreakDuration } = useAppContext();

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
              Work
            </Label>
            <Input
              id="work-duration"
              type="number"
              value={workDuration}
              onChange={(e) => setWorkDuration(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="break-duration" className="text-right">
              Break
            </Label>
            <Input
              id="break-duration"
              type="number"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
