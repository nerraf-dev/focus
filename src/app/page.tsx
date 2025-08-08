"use client";

import { TimerDisplay } from "@/components/timer/timer-display";
import { TaskManager } from "@/components/tasks/task-manager";

export default function Home() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <TimerDisplay />
      </div>
      <div className="lg:col-span-1">
        <TaskManager />
      </div>
    </div>
  );
}
