import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');
  const receiverId = searchParams.get('receiverId');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');

  if (!conversationId && !receiverId) {
    return NextResponse.json({ message: 'conversationId or receiverId is required' }, { status: 400 });
  }

  try {
    let whereClause: any = {};

    if (conversationId) {
      // For conversation-based messages
      whereClause = {
        OR: [
          { senderId: (session.user as any).id, receiverId: conversationId },
          { senderId: conversationId, receiverId: (session.user as any).id },
        ],
      };
    } else if (receiverId) {
      // For direct messages
      whereClause = {
        OR: [
          { senderId: (session.user as any).id, receiverId: receiverId },
          { senderId: receiverId, receiverId: (session.user as any).id },
        ],
      };
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, conversationId, receiverId, attachments = [] } = await request.json();

    if (!content && attachments.length === 0) {
      return NextResponse.json({ message: 'Content or attachments required' }, { status: 400 });
    }

    const targetUserId = receiverId || conversationId;
    if (!targetUserId) {
      return NextResponse.json({ message: 'receiverId or conversationId is required' }, { status: 400 });
    }

    // Determine message type based on attachments
    let messageType = 'TEXT';
    if (attachments.length > 0) {
      const hasImages = attachments.some((att: any) => att.mimeType && att.mimeType.startsWith('image/'));
      messageType = hasImages ? 'IMAGE' : 'FILE';
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content || '',
        senderId: (session.user as any).id,
        receiverId: targetUserId,
        messageType,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    
    // Emit to Socket.IO if available
    if (global.__io) {
      // Emit to the receiver's socket room
      global.__io.of('/chat').to(`user-${targetUserId}`).emit('new-message', message);
      console.log(`📨 Emitted message to user-${targetUserId}`);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}