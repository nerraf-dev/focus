import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const sessionId = parseInt(id as string);

  if (isNaN(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    if (req.method === 'PUT') {
      // Update/end a session
      const { endedAt, duration } = req.body;
      
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
      // Delete a session
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
