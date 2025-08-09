// API route for CRUD operations on task lists
// GET: Returns all task lists for the authenticated user
// POST: Creates a new task list for the authenticated user

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
      // Get all task lists for the authenticated user
      const lists = await prisma.taskList.findMany({
        where: { userId: Number(userId) },
        include: { tasks: true },
      });
      res.status(200).json(lists);
    } else if (req.method === 'POST') {
      // Create a new task list for the authenticated user
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      
      const newList = await prisma.taskList.create({
        data: { name, userId: Number(userId) },
      });
      res.status(201).json(newList);
    } else {
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
