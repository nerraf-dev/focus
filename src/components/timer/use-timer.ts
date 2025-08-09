import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Task, Session } from "@/lib/types";

interface DatabaseTask {
  id: number;
  title: string;
  completed: boolean;
  description?: string;
}

export function useTimer({
  workDuration,
  breakDuration,
  activeTask,
  currentSession,
  setCurrentSession,
  toast,
}: {
  workDuration: number;
  breakDuration: number;
  activeTask: DatabaseTask | null;
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;
  toast: any;
}) {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(() => mode === "work" ? workDuration * 60 : breakDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const reminderTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when mode or duration changes, but only if not active
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setSecondsLeft(mode === "work" ? workDuration * 60 : breakDuration * 60);
    if (currentSession && mode === "work") {
      endSession();
    }
  }, [mode, workDuration, breakDuration, currentSession]);

  useEffect(() => {
    if (!isActive) {
      setSecondsLeft(mode === "work" ? workDuration * 60 : breakDuration * 60);
    }
    // Don't reset if timer is running
  }, [workDuration, breakDuration, mode]);

  // End current session
  const endSession = async () => {
    if (!currentSession) return;
    try {
      const totalSeconds = (mode === "work" ? workDuration : breakDuration) * 60;
      const sessionDuration = totalSeconds - secondsLeft;
      await authenticatedFetch(`/api/sessions/${currentSession.id}`, {
        method: "PUT",
        body: JSON.stringify({
          endedAt: new Date().toISOString(),
          duration: sessionDuration,
        }),
      });
      setCurrentSession(null);
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  // Helper: show browser notification if permission granted and tab not focused
  const showBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && document.visibilityState !== "visible") {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body });
          }
        });
      }
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
              endSession();
              setMode("break");
              setSecondsLeft(breakDuration * 60);
              toast({ title: "Time for a break!", description: "Great work session. Relax for a bit." });
              showBrowserNotification("Time for a break!", "Great work session. Relax for a bit.");
              // Set reminder for break end
              if (reminderTimeout.current) clearTimeout(reminderTimeout.current);
              reminderTimeout.current = setTimeout(() => {
                toast({ title: "Reminder", description: "Break is over. Restart your timer!" });
                showBrowserNotification("Break is over!", "Restart your timer.");
              }, breakDuration * 60 * 1000 + 10000); // 10s after break ends
            } else {
              setMode("work");
              setSecondsLeft(workDuration * 60);
              toast({ title: "Back to work!", description: "Break's over. Let's get focused." });
              showBrowserNotification("Back to work!", "Break's over. Let's get focused.");
            }
            setIsActive(false);
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

  // Cleanup reminder timeout on unmount
  useEffect(() => {
    return () => {
      if (reminderTimeout.current) clearTimeout(reminderTimeout.current);
    };
  }, []);

  return {
    mode,
    setMode,
    secondsLeft,
    setSecondsLeft,
    isActive,
    setIsActive,
    resetTimer,
    endSession,
  };
}
