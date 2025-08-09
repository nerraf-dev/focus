"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Clock } from "lucide-react";
import { useAppContext } from "@/context/app-context";

export function FocusInsights() {
  const { tasks } = useAppContext();
  const [showInsights, setShowInsights] = useState(false);

  const generateLocalInsights = () => {
    const trackedTasks = tasks.filter(task => task.timeSpent > 0);
    
    if (trackedTasks.length === 0) {
      return "No time has been tracked on any tasks. Please use the timer to track your work.";
    }

    const totalTime = trackedTasks.reduce((sum, task) => sum + task.timeSpent, 0);
    const totalMinutes = Math.round(totalTime / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const topTask = trackedTasks.reduce((prev, current) => 
      prev.timeSpent > current.timeSpent ? prev : current
    );
    const topTaskMinutes = Math.round(topTask.timeSpent / 60);

    let summary = `Focus Session Summary:\n\n`;
    summary += `📊 Total productive time: ${totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalMinutes}m`}\n`;
    summary += `📋 Tasks worked on: ${trackedTasks.length}\n`;
    summary += `🎯 Most focused task: "${topTask.description}" (${topTaskMinutes}m)\n\n`;

    if (trackedTasks.length > 1) {
      summary += `Time breakdown:\n`;
      trackedTasks
        .sort((a, b) => b.timeSpent - a.timeSpent)
        .forEach(task => {
          const taskMinutes = Math.round(task.timeSpent / 60);
          const percentage = Math.round((task.timeSpent / totalTime) * 100);
          summary += `• ${task.description}: ${taskMinutes}m (${percentage}%)\n`;
        });
    }

    return summary;
  };

  const handleShowInsights = () => {
    setShowInsights(!showInsights);
  };

  const insights = showInsights ? generateLocalInsights() : null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Focus Insights</CardTitle>
        <CardDescription>
          View your time allocation and productivity summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {insights && (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md bg-muted p-4">
            <p>{insights}</p>
          </div>
        )}
        {!showInsights && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click below to view your focus insights</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleShowInsights} className="w-full">
          <BarChart className="mr-2 h-4 w-4" />
          {showInsights ? 'Hide Insights' : 'Show Insights'}
        </Button>
      </CardFooter>
    </Card>
  );
}
