import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const listId = parseInt(id as string)

  if (isNaN(listId)) {
    return res.status(400).json({ error: 'Invalid list ID' });
  }

  // Get user ID from request headers
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (req.method === 'PUT') {
    // Update task list - verify ownership
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    try {
      // First verify the list belongs to the user
      const existingList = await prisma.taskList.findFirst({
        where: { 
          id: listId,
          userId: Number(userId)
        }
      });

      if (!existingList) {
        return res.status(404).json({ error: 'Task list not found' });
      }

      const list = await prisma.taskList.update({
        where: { id: listId },
        data: { name: name.trim() }
      })
      res.json(list)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task list' })
    }
  } else if (req.method === 'DELETE') {
    // Delete task list - verify ownership
    try {
      // First verify the list belongs to the user
      const existingList = await prisma.taskList.findFirst({
        where: { 
          id: listId,
          userId: Number(userId)
        }
      });

      if (!existingList) {
        return res.status(404).json({ error: 'Task list not found' });
      }

      // Delete all tasks in this list first
      await prisma.task.deleteMany({
        where: { listId: listId }
      });

      // Then delete the list
      await prisma.taskList.delete({
        where: { id: listId }
      })
      
      res.json({ message: 'Task list deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete task list' })
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
