'use server';
/**
 * @fileOverview An AI agent that summarizes time spent on tasks to identify areas for improved focus.
 *
 * - generateFocusInsights - A function that generates focus insights based on task time allocation.
 * - FocusInsightsInput - The input type for the generateFocusInsights function.
 * - FocusInsightsOutput - The return type for the generateFocusInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FocusInsightsInputSchema = z.object({
  taskAllocations: z
    .record(z.number())
    .describe(
      'A map of task names to the time spent on them in minutes. Example: { task1: 30, task2: 45 }'
    ),
});
export type FocusInsightsInput = z.infer<typeof FocusInsightsInputSchema>;

const FocusInsightsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A narrative summary of how time was allocated across tasks, identifying areas for improved focus.'
    ),
});
export type FocusInsightsOutput = z.infer<typeof FocusInsightsOutputSchema>;

export async function generateFocusInsights(
  input: FocusInsightsInput
): Promise<FocusInsightsOutput> {
  return focusInsightsFlow(input);
}

const focusInsightsPrompt = ai.definePrompt({
  name: 'focusInsightsPrompt',
  input: {schema: FocusInsightsInputSchema},
  output: {schema: FocusInsightsOutputSchema},
  prompt: `You are an AI assistant helping users understand their time allocation across tasks.

  Given the following task time allocations, provide a summary of how the user spent their time, and suggest areas for improved focus.

  Task Allocations:
  {{#each taskAllocations}} - {{@key}}: {{this}} minutes\n  {{/each}}

  Write a professional-sounding summary that could be shared with management or customers.
  `,
});

const focusInsightsFlow = ai.defineFlow(
  {
    name: 'focusInsightsFlow',
    inputSchema: FocusInsightsInputSchema,
    outputSchema: FocusInsightsOutputSchema,
  },
  async input => {
    const {output} = await focusInsightsPrompt(input);
    return output!;
  }
);
