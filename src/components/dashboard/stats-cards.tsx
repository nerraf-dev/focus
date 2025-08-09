"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, TrendingUp, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authenticatedFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

interface DatabaseTask {
  id: number;
  title: string;
  completed: boolean;
  description?: string;
}

interface Session {
  id: number;
  taskId: number;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  task: DatabaseTask;
}

export function StatsCards() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch tasks
        const tasksResponse = await authenticatedFetch('/api/tasks');
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
        }

        // Fetch sessions
        const sessionsResponse = await authenticatedFetch('/api/sessions');
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setSessions(sessionsData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, [user]);

  // Calculate stats from sessions instead of tasks
  const totalTimeSpent = sessions.reduce((acc, session) => acc + (session.duration || 0), 0);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;

  // Find task with most session time
  const taskTimeMap = sessions.reduce((acc, session) => {
    const taskId = session.taskId;
    acc[taskId] = (acc[taskId] || 0) + (session.duration || 0);
    return acc;
  }, {} as Record<number, number>);

  const mostTimeTaskId = Object.keys(taskTimeMap).reduce((maxId, taskId) => 
    taskTimeMap[Number(taskId)] > (taskTimeMap[Number(maxId)] || 0) ? taskId : maxId, 
    Object.keys(taskTimeMap)[0]
  );

  const mostTimeTask = tasks.find(t => t.id === Number(mostTimeTaskId));
  const mostTimeSpent = taskTimeMap[Number(mostTimeTaskId)] || 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const stats = [
    {
      title: "Total Focus Time",
      value: formatTime(totalTimeSpent),
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Tasks Completed",
      value: `${completedTasks} / ${totalTasks}`,
      icon: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Top Task",
      value: mostTimeTask?.title || 'No sessions yet',
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Time on Top Task", 
      value: formatTime(mostTimeSpent),
      icon: <Hourglass className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
