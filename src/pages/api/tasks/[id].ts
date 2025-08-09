import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const taskId = parseInt(id as string)

  if (req.method === 'PUT') {
    // Update task (toggle completion)
    const { completed } = req.body
    try {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: { completed }
      })
      res.json(task)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task' })
    }
  } else if (req.method === 'DELETE') {
    // Delete task
    try {
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
