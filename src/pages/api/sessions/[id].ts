import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const sessionId = parseInt(id as string);

  if (isNaN(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  // Get user ID from request headers
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    if (req.method === 'PUT') {
      // Update/end a session - verify ownership through task
      const { endedAt, duration } = req.body;
      
      // First verify the session belongs to a task owned by the user
      const existingSession = await prisma.session.findFirst({
        where: {
          id: sessionId,
          task: {
            userId: Number(userId)
          }
        }
      });

      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          endedAt: endedAt ? new Date(endedAt) : new Date(),
          duration: duration || null
        }
      });

      return res.status(200).json(updatedSession);
    }

    if (req.method === 'DELETE') {
      // Delete a session - verify ownership through task
      const existingSession = await prisma.session.findFirst({
        where: {
          id: sessionId,
          task: {
            userId: Number(userId)
          }
        }
      });

      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      await prisma.session.delete({
        where: { id: sessionId }
      });

      return res.status(200).json({ message: 'Session deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Session API error:', error);
    
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
