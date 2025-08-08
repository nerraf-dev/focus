"use client";

import React, { useState } from 'react';
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
import { useAppContext } from '@/context/app-context';
import { Pencil, Trash2 } from 'lucide-react';
import type { TaskList } from '@/lib/types';

function EditTaskListDialog({ list }: { list: TaskList }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(list.name);
  const { editTaskList } = useAppContext();

  const handleSubmit = () => {
    editTaskList(list.id, name);
    setOpen(false);
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

function DeleteTaskListAlert({ listId }: { listId: string }) {
  const { deleteTaskList } = useAppContext();

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
          <AlertDialogAction onClick={() => deleteTaskList(listId)}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function TaskListManager() {
  const { taskLists, tasks } = useAppContext();

  const getTaskCount = (listId: string) => {
    return tasks.filter((task) => task.listId === listId).length;
  };

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
                <EditTaskListDialog list={list} />
                <DeleteTaskListAlert listId={list.id} />
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
