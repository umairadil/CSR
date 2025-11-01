import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all users that the current user has chatted with
    const conversations = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group conversations by the other participant
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
      const otherUser = message.senderId === user.id ? message.receiver : message.sender;
      
      if (otherUserId && otherUser) {
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            user: otherUser,
            lastMessage: message,
            unreadCount: 0
          });
        }
        
        // Count unread messages from the other user
        if (message.senderId === otherUserId && !message.isRead) {
          conversationMap.get(otherUserId).unreadCount++;
        }
      }
    });

    const conversationList = Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    // Transform to match Conversation interface
    const formattedConversations = conversationList.map(conv => ({
      id: conv.user.id,
      participants: [conv.user, user],
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount,
      isActive: false,
      createdAt: conv.lastMessage.createdAt,
      updatedAt: conv.lastMessage.updatedAt
    }));

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
