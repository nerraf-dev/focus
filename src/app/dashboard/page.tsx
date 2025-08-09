"use client";

import { useState, useEffect } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TimeChart } from "@/components/dashboard/time-chart";
import { FocusInsights } from "@/components/dashboard/focus-insights";
import { TaskListManager } from "@/components/dashboard/task-list-manager";
import { authenticatedFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const tasksResponse = await authenticatedFetch('/api/tasks');
        const sessionsResponse = await authenticatedFetch('/api/sessions');
        
        if (tasksResponse.ok && sessionsResponse.ok) {
          const tasks = await tasksResponse.json();
          const sessions = await sessionsResponse.json();
          setHasData(tasks.length > 0 || sessions.length > 0);
        }
      } catch (error) {
        console.error('Failed to check dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkData();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Loading your dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome to your Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    You don't have any task data yet. Go to the timer, add some tasks, and track your focus sessions to see your analytics here.
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
