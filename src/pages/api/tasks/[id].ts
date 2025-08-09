import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const taskId = parseInt(id as string)

  // Get user ID from request headers
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (req.method === 'PUT') {
    // Update task (toggle completion) - verify ownership
    const { completed } = req.body
    try {
      // First verify the task belongs to the user
      const existingTask = await prisma.task.findFirst({
        where: { 
          id: taskId,
          userId: Number(userId)
        }
      });

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: { completed }
      })
      res.json(task)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task' })
    }
  } else if (req.method === 'DELETE') {
    // Delete task - verify ownership
    try {
      // First verify the task belongs to the user
      const existingTask = await prisma.task.findFirst({
        where: { 
          id: taskId,
          userId: Number(userId)
        }
      });

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      await prisma.task.delete({
        where: { id: taskId }
      })
      res.json({ message: 'Task deleted' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete task' })
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
