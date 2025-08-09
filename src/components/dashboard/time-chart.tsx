"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
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

export function TimeChart() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      
      try {
        const response = await authenticatedFetch('/api/sessions');
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        }
      } catch (error) {
        console.error('Failed to fetch sessions for chart:', error);
      }
    };

    fetchSessions();
  }, [user]);

  // Group sessions by task and sum their durations
  const taskTimeMap = sessions.reduce((acc, session) => {
    if (session.duration && session.task) {
      const taskTitle = session.task.title;
      acc[taskTitle] = (acc[taskTitle] || 0) + session.duration;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(taskTimeMap).map(([name, seconds]) => ({
    name,
    minutes: parseFloat((seconds / 60).toFixed(2)),
  }));
    
  if (chartData.length === 0) {
      return <p className="text-center text-muted-foreground py-10">No time tracked yet to display a chart.</p>
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
        <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis 
                type="category" 
                dataKey="name" 
                width={150}
                tick={{fontSize: 12}}
                tickLine={false}
                axisLine={false}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ 
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                }}
            />
            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
        </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
