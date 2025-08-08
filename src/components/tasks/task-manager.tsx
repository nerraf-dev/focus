"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "@/context/app-context";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

function AddTaskForm() {
  const [description, setDescription] = useState("");
  const { addTask } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask(description);
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a new task..."
      />
      <Button type="submit" size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}

function TaskItem({ task }: { task: Task }) {
  const { deleteTask, toggleTaskCompletion, activeTaskId, setActiveTaskId } = useAppContext();
  const isActive = task.id === activeTaskId;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer",
        isActive ? "bg-primary/10" : "hover:bg-muted"
      )}
      onClick={() => setActiveTaskId(task.id)}
    >
      <button onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(task.id); }}>
        {task.completed ? (
          <CheckCircle className="h-5 w-5 text-accent" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1">
        <p className={cn("font-medium", task.completed && "text-muted-foreground line-through")}>
          {task.description}
        </p>
        <p className="text-xs text-muted-foreground">{formatTime(task.timeSpent)}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
        <Trash2 className="h-4 w-4 text-destructive/70" />
      </Button>
    </div>
  );
}

export function TaskManager() {
  const { tasks } = useAppContext();
  const completedTasks = tasks.filter(t => t.completed);
  const incompleteTasks = tasks.filter(t => !t.completed);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <AddTaskForm />
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 pr-4">
            {incompleteTasks.length > 0 ? (
                incompleteTasks.map((task) => <TaskItem key={task.id} task={task} />)
            ) : (
                <p className="text-center text-muted-foreground py-4">No active tasks. Add one!</p>
            )}
            {completedTasks.length > 0 && (
                <>
                    <h3 className="text-sm font-medium text-muted-foreground mt-4 px-3">Completed</h3>
                    {completedTasks.map((task) => <TaskItem key={task.id} task={task} />)}
                </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
