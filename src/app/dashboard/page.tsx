"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { TimeChart } from "@/components/dashboard/time-chart";
import { FocusInsights } from "@/components/dashboard/focus-insights";
import { TaskListManager } from "@/components/dashboard/task-list-manager";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { tasks } = useAppContext();

  if (tasks.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome to your Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    You don't have any task data yet. Go back to the timer, add some tasks, and track your focus sessions to see your analytics here.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <StatsCards />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Time Allocation</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <TimeChart />
          </CardContent>
        </Card>
        <div className="col-span-1 lg:col-span-3">
          <FocusInsights />
        </div>
      </div>
      <div>
        <TaskListManager />
      </div>
    </div>
  );
}
