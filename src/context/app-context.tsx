"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Task } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  tasks: Task[];
  addTask: (description: string) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTaskTime: (id: string, additionalTime: number) => void;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  getTaskById: (id: string) => Task | undefined;
  workDuration: number;
  setWorkDuration: (duration: number) => void;
  breakDuration: number;
  setBreakDuration: (duration: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTasks: Task[] = [
  { id: '1', description: 'Plan project structure', timeSpent: 0, completed: false },
  { id: '2', description: 'Design UI components', timeSpent: 0, completed: false },
  { id: '3', description: 'Develop core features', timeSpent: 0, completed: false },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [workDuration, setWorkDurationState] = useState(25);
  const [breakDuration, setBreakDurationState] = useState(5);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedTasks = localStorage.getItem("focusflow-tasks");
      if (storedTasks) setTasks(JSON.parse(storedTasks));

      const storedWorkDuration = localStorage.getItem("focusflow-work-duration");
      if (storedWorkDuration) setWorkDurationState(JSON.parse(storedWorkDuration));

      const storedBreakDuration = localStorage.getItem("focusflow-break-duration");
      if (storedBreakDuration) setBreakDurationState(JSON.parse(storedBreakDuration));
      
      const storedActiveTask = localStorage.getItem("focusflow-active-task-id");
      if(storedActiveTask && storedActiveTask !== 'null') setActiveTaskId(storedActiveTask)
      else if (tasks.length > 0) setActiveTaskId(tasks[0].id)
      
    } catch (error) {
      console.error("Failed to load from localStorage", error);
      setTasks(initialTasks);
    }
  }, []);

  useEffect(() => {
    if(isMounted) {
      if(tasks.length > 0 && !tasks.find(t => t.id === activeTaskId)) {
        setActiveTaskId(tasks[0].id);
      } else if (tasks.length === 0) {
        setActiveTaskId(null);
      }
    }
  }, [tasks, activeTaskId, isMounted])

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("focusflow-tasks", JSON.stringify(tasks));
      localStorage.setItem("focusflow-active-task-id", activeTaskId || 'null');
    }
  }, [tasks, activeTaskId, isMounted]);

  const setWorkDuration = useCallback((duration: number) => {
    setWorkDurationState(duration);
    if (isMounted) localStorage.setItem("focusflow-work-duration", JSON.stringify(duration));
  }, [isMounted]);

  const setBreakDuration = useCallback((duration: number) => {
    setBreakDurationState(duration);
    if (isMounted) localStorage.setItem("focusflow-break-duration", JSON.stringify(duration));
  }, [isMounted]);

  const addTask = useCallback((description: string) => {
    if (!description.trim()) {
        toast({
            title: "Task description cannot be empty.",
            variant: "destructive"
        });
        return;
    }
    const newTask: Task = {
      id: Date.now().toString(),
      description,
      timeSpent: 0,
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  }, [toast]);

  const toggleTaskCompletion = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const updateTaskTime = useCallback((id: string, additionalTime: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, timeSpent: task.timeSpent + additionalTime } : task
      )
    );
  }, []);
  
  const getTaskById = useCallback((id: string) => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  if (!isMounted) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        tasks,
        addTask,
        toggleTaskCompletion,
        deleteTask,
        updateTaskTime,
        activeTaskId,
        setActiveTaskId,
        getTaskById,
        workDuration,
        setWorkDuration,
        breakDuration,
        setBreakDuration,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
