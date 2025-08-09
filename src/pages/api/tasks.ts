import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get user ID from request headers
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (req.method === 'GET') {
        // Get all tasks for a given list for the authenticated user
        const { listId } = req.query;
        let where: any = { userId: Number(userId) };
        if (listId) where.listId = Number(listId);
        const tasks = await prisma.task.findMany({ where });
        res.status(200).json(tasks);
    } else if (req.method === 'POST') {
      // Create a new task in a given list for the authenticated user
      const { title, description, listId } = req.body;
      if (!title || !listId) return res.status(400).json({ error: 'Title and listId are required' });
      
      const newTask = await prisma.task.create({
        data: { title, description, userId: Number(userId), listId: Number(listId) },
      });
      res.status(201).json(newTask);
    } else {
      // Method not allowed
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
