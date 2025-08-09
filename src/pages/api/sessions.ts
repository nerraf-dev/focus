import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get user ID from request headers
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (req.method === 'GET') {
      // Get all sessions for a task
      const { taskId } = req.query;
      
      if (taskId) {
        // Verify the task belongs to the user
        const task = await prisma.task.findFirst({
          where: { 
            id: parseInt(taskId as string),
            userId: Number(userId)
          }
        });
        
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        const sessions = await prisma.session.findMany({
          where: {
            taskId: parseInt(taskId as string)
          },
          orderBy: {
            startedAt: 'desc'
          }
        });
        return res.status(200).json(sessions);
      } else {
        // Get all sessions for user's tasks
        const sessions = await prisma.session.findMany({
          include: {
            task: {
              include: {
                list: true
              }
            }
          },
          where: {
            task: {
              userId: Number(userId)
            }
          },
          orderBy: {
            startedAt: 'desc'
          }
        });
        return res.status(200).json(sessions);
      }
    }

    if (req.method === 'POST') {
      // Start a new session
      const { taskId } = req.body;
      
      if (!taskId) {
        return res.status(400).json({ error: 'taskId is required' });
      }

      // Check if task exists and belongs to user
      const task = await prisma.task.findFirst({
        where: { 
          id: parseInt(taskId),
          userId: Number(userId)
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Create new session
      const session = await prisma.session.create({
        data: {
          taskId: parseInt(taskId)
        }
      });

      return res.status(201).json(session);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Sessions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
