"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Task, TaskList } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  tasks: Task[];
  taskLists: TaskList[];
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;
  addTaskList: (name: string) => void;
  editTaskList: (id: string, newName: string) => void;
  deleteTaskList: (id: string) => void;
  addTask: (description: string, listId: string) => void;
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

const initialTaskLists: TaskList[] = [
  { id: '1', name: 'General' },
  { id: '2', name: 'Work' },
  { id: '3', name: 'Personal' },
];

const initialTasks: Task[] = [
  { id: '1', description: 'Plan project structure', timeSpent: 0, completed: false, listId: '1' },
  { id: '2', description: 'Design UI components', timeSpent: 0, completed: false, listId: '2' },
  { id: '3', description: 'Develop core features', timeSpent: 0, completed: false, listId: '2' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [workDuration, setWorkDurationState] = useState(25);
  const [breakDuration, setBreakDurationState] = useState(5);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedTasks = localStorage.getItem("focusflow-tasks");
      const loadedTasks = storedTasks ? JSON.parse(storedTasks) : initialTasks;
      setTasks(loadedTasks);

      const storedTaskLists = localStorage.getItem("focusflow-task-lists");
      const loadedTaskLists = storedTaskLists ? JSON.parse(storedTaskLists) : initialTaskLists;
      setTaskLists(loadedTaskLists);
      
      const storedActiveListId = localStorage.getItem("focusflow-active-list-id");
      if (storedActiveListId && storedActiveListId !== 'null' && loadedTaskLists.some(l => l.id === storedActiveListId)) {
        setActiveListId(storedActiveListId);
      } else if (loadedTaskLists.length > 0) {
        setActiveListId(loadedTaskLists[0].id);
      }

      const storedWorkDuration = localStorage.getItem("focusflow-work-duration");
      if (storedWorkDuration) setWorkDurationState(JSON.parse(storedWorkDuration));

      const storedBreakDuration = localStorage.getItem("focusflow-break-duration");
      if (storedBreakDuration) setBreakDurationState(JSON.parse(storedBreakDuration));
      
      const storedActiveTask = localStorage.getItem("focusflow-active-task-id");
      if(storedActiveTask && storedActiveTask !== 'null') setActiveTaskId(storedActiveTask)
      
    } catch (error) {
      console.error("Failed to load from localStorage", error);
      setTasks(initialTasks);
      setTaskLists(initialTaskLists);
    }
  }, []);

  useEffect(() => {
    if(isMounted) {
      const currentListTasks = tasks.filter(t => t.listId === activeListId);
      if (activeTaskId && !tasks.some(t => t.id === activeTaskId)) {
         setActiveTaskId(null);
      }

      if (activeListId && currentListTasks.length > 0 && !currentListTasks.some(t => t.id === activeTaskId)) {
        const firstIncomplete = currentListTasks.find(t => !t.completed);
        setActiveTaskId(firstIncomplete ? firstIncomplete.id : currentListTasks[0].id);
      } else if (currentListTasks.length === 0) {
        setActiveTaskId(null);
      }
    }
  }, [tasks, activeTaskId, activeListId, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("focusflow-tasks", JSON.stringify(tasks));
      localStorage.setItem("focusflow-task-lists", JSON.stringify(taskLists));
      localStorage.setItem("focusflow-active-list-id", activeListId || 'null');
      localStorage.setItem("focusflow-active-task-id", activeTaskId || 'null');
    }
  }, [tasks, taskLists, activeListId, activeTaskId, isMounted]);

  const setWorkDuration = useCallback((duration: number) => {
    setWorkDurationState(duration);
    if (isMounted) localStorage.setItem("focusflow-work-duration", JSON.stringify(duration));
  }, [isMounted]);

  const setBreakDuration = useCallback((duration: number) => {
    setBreakDurationState(duration);
    if (isMounted) localStorage.setItem("focusflow-break-duration", JSON.stringify(duration));
  }, [isMounted]);

  const addTaskList = useCallback((name: string) => {
    if (!name.trim()) {
      toast({ title: "List name cannot be empty.", variant: "destructive" });
      return;
    }
    const newTaskList: TaskList = {
      id: Date.now().toString(),
      name,
    };
    setTaskLists((prev) => [...prev, newTaskList]);
    setActiveListId(newTaskList.id);
  }, [toast]);

  const editTaskList = useCallback((id: string, newName: string) => {
    if (!newName.trim()) {
        toast({ title: "List name cannot be empty.", variant: "destructive" });
        return;
    }
    setTaskLists(prev => prev.map(list => list.id === id ? { ...list, name: newName } : list));
    toast({ title: "List updated successfully." });
  }, [toast]);

  const deleteTaskList = useCallback((id: string) => {
    setTaskLists(prev => {
        const newLists = prev.filter(list => list.id !== id);
        if (activeListId === id) {
            setActiveListId(newLists.length > 0 ? newLists[0].id : null);
        }
        return newLists;
    });
    setTasks(prev => prev.filter(task => task.listId !== id));
    toast({ title: "List deleted successfully." });
  }, [activeListId, toast]);

  const addTask = useCallback((description: string, listId: string) => {
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
      listId,
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
        taskLists,
        activeListId,
        setActiveListId,
        addTaskList,
        editTaskList,
        deleteTaskList,
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
