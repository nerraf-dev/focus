"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle, Circle, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// Types for our data
interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface TaskList {
  id: number;
  name: string;
}

function AddTaskForm({ activeListId, onTaskAdded }: { activeListId: number | null; onTaskAdded: (task: Task) => void }) {
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListId || !description.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: description, listId: activeListId }),
      });
      const task = await response.json();
      onTaskAdded(task);
      setDescription("");
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a new task..."
        disabled={!activeListId}
      />
      <Button type="submit" size="icon" disabled={!activeListId}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}

function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted">
      <button onClick={() => onToggle(task.id)}>
        {task.completed ? (
          <CheckCircle className="h-5 w-5 text-accent" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1">
        <p className={cn("font-medium", task.completed && "text-muted-foreground line-through")}>
          {task.title}
        </p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(task.id)}>
        <Trash2 className="h-4 w-4 text-destructive/70" />
      </Button>
    </div>
  );
}

function AddTaskListDialog({ children, onListAdded }: { children: React.ReactNode; onListAdded: (list: TaskList) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    const handleSubmit = async () => {
        if (!name.trim()) return;
        
        try {
            const response = await fetch('/api/task-lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const list = await response.json();
            onListAdded(list);
            setName("");
            setOpen(false);
        } catch (error) {
            console.error('Error creating list:', error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Task List</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="List Name (e.g. 'Project X')"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Create List</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);

  // Load task lists on mount
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch('/api/task-lists');
        const lists = await response.json();
        setTaskLists(lists);
        if (lists.length > 0 && !activeListId) {
          setActiveListId(lists[0].id);
        }
      } catch (error) {
        console.error('Error fetching lists:', error);
      }
    };
    fetchLists();
  }, [activeListId]);

  // Load tasks when active list changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!activeListId) return;
      try {
        const response = await fetch(`/api/tasks?listId=${activeListId}`);
        const tasks = await response.json();
        setTasks(tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();
  }, [activeListId]);

  const handleTaskAdded = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleListAdded = (list: TaskList) => {
    setTaskLists(prev => [...prev, list]);
    setActiveListId(list.id);
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      
      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  const tasksInCurrentList = tasks;
  const completedTasks = tasksInCurrentList.filter(t => t.completed);
  const incompleteTasks = tasksInCurrentList.filter(t => !t.completed);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex gap-2">
            <Select onValueChange={(value) => setActiveListId(Number(value))} value={activeListId?.toString() || ""}>
                <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                    {taskLists.map(list => (
                        <SelectItem key={list.id} value={list.id.toString()}>{list.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <AddTaskListDialog onListAdded={handleListAdded}>
                <Button variant="outline" size="icon">
                    <ListPlus />
                </Button>
            </AddTaskListDialog>
        </div>

        <AddTaskForm activeListId={activeListId} onTaskAdded={handleTaskAdded} />
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 pr-4">
            {incompleteTasks.length > 0 ? (
                incompleteTasks.map((task) => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                    />
                ))
            ) : (
                <p className="text-center text-muted-foreground py-4">
                    {activeListId ? "No active tasks in this list. Add one!" : "Select or create a list to start."}
                </p>
            )}
            {completedTasks.length > 0 && (
                <>
                    <h3 className="text-sm font-medium text-muted-foreground mt-4 px-3">Completed</h3>
                    {completedTasks.map((task) => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={handleToggleTask}
                            onDelete={handleDeleteTask}
                        />
                    ))}
                </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
