"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useAppContext } from "@/context/app-context";

export function TimeChart() {
  const { tasks } = useAppContext();

  const chartData = tasks
    .filter(task => task.timeSpent > 0)
    .map((task) => ({
      name: task.description,
      minutes: parseFloat((task.timeSpent / 60).toFixed(2)),
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
