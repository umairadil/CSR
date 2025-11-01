import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId, userId } = await request.json();

  if (!conversationId || !userId) {
    return NextResponse.json({ message: 'conversationId and userId are required' }, { status: 400 });
  }

  try {
    // Mark all messages from conversationId (sender) to userId (receiver) as read
    await prisma.chatMessage.updateMany({
      where: {
        senderId: conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}



