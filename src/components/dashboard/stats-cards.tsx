"use client";

import { Clock, CheckCircle2, TrendingUp, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/app-context";

export function StatsCards() {
  const { tasks } = useAppContext();

  const totalTimeSpent = tasks.reduce((acc, task) => acc + task.timeSpent, 0);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const mostTimeSpentOnTask = tasks.reduce((max, task) => task.timeSpent > max.timeSpent ? task : max, tasks[0] || {description: 'N/A', timeSpent: 0});

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
      value: mostTimeSpentOnTask.description,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
     {
      title: "Time on Top Task",
      value: formatTime(mostTimeSpentOnTask.timeSpent),
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
