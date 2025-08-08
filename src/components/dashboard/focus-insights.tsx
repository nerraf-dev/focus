"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/app-context";
import { generateFocusInsights } from "@/ai/flows/focus-insights";
import type { FocusInsightsInput } from "@/ai/flows/focus-insights";

export function FocusInsights() {
  const { tasks } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setSummary(null);

    const taskAllocations: FocusInsightsInput["taskAllocations"] = tasks
      .filter(task => task.timeSpent > 0)
      .reduce((acc, task) => {
        acc[task.description] = Math.round(task.timeSpent / 60);
        return acc;
      }, {} as Record<string, number>);
      
    if (Object.keys(taskAllocations).length === 0) {
        setSummary("No time has been tracked on any tasks. Please use the timer to track your work.");
        setIsLoading(false);
        return;
    }

    try {
      const result = await generateFocusInsights({ taskAllocations });
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to generate insights:", error);
      setSummary("Sorry, we couldn't generate insights at this moment. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Focus Insights</CardTitle>
        <CardDescription>
          Let AI analyze your time allocation and provide a professional summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {summary && (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md bg-muted p-4">
            <p>{summary}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateInsights} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Summary
        </Button>
      </CardFooter>
    </Card>
  );
}
