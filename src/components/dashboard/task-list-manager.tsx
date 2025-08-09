"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { authenticatedFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaskList {
  id: number;
  name: string;
  userId: number;
}

interface DatabaseTask {
  id: number;
  title: string;
  completed: boolean;
  listId: number;
}

function EditTaskListDialog({ list, onUpdate }: { list: TaskList; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(list.name);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      const response = await authenticatedFetch(`/api/task-lists/${list.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        toast({ title: "List updated successfully" });
        onUpdate();
        setOpen(false);
      } else {
        throw new Error('Failed to update list');
      }
    } catch (error) {
      toast({ title: "Failed to update list", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task List</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="List Name"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTaskListAlert({ listId, onUpdate }: { listId: number; onUpdate: () => void }) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const response = await authenticatedFetch(`/api/task-lists/${listId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: "List deleted successfully" });
        onUpdate();
      } else {
        throw new Error('Failed to delete list');
      }
    } catch (error) {
      toast({ title: "Failed to delete list", variant: "destructive" });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your task list and all of
            the tasks within it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function TaskListManager() {
  const { user } = useAuth();
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [listsResponse, tasksResponse] = await Promise.all([
        authenticatedFetch('/api/task-lists'),
        authenticatedFetch('/api/tasks')
      ]);

      if (listsResponse.ok) {
        const listsData = await listsResponse.json();
        setTaskLists(listsData);
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Failed to fetch task lists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getTaskCount = (listId: number) => {
    return tasks.filter((task) => task.listId === listId).length;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Loading task lists...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Task Lists</CardTitle>
        <CardDescription>Edit or delete your existing task lists.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {taskLists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-semibold">{list.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getTaskCount(list.id)} tasks
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EditTaskListDialog list={list} onUpdate={fetchData} />
                <DeleteTaskListAlert listId={list.id} onUpdate={fetchData} />
              </div>
            </div>
          ))}
          {taskLists.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              You haven't created any task lists yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
