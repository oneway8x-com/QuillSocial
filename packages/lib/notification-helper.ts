import prisma from "@quillsocial/prisma";
import { NotificationType } from "@quillsocial/prisma/client";

interface CreateNotificationParams {
  userId: number;
  type?: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Creates a notification for a user
 */
export async function createNotification({
  userId,
  type = NotificationType.ERROR,
  title,
  message,
  metadata,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata || {},
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Creates a notification for Twitter/X API rate limit errors (429)
 * Prevents duplicate notifications by checking for recent similar notifications
 */
export async function createTwitterRateLimitNotification(
  userId: number,
  error: any
) {
  const errorCode = error?.code || error?.statusCode || 429;
  const errorMessage = error?.message || "Request failed";

  // Check for duplicate notifications in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId,
      type: NotificationType.ERROR,
      title: "X/Twitter API Rate Limit Exceeded",
      createdAt: {
        gte: fiveMinutesAgo,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // If duplicate exists, update its metadata with occurrence count instead of creating new
  if (existingNotification) {
    const currentCount = (existingNotification.metadata as any)?.occurrenceCount || 1;
    const newCount = currentCount + 1;

    await prisma.notification.update({
      where: { id: existingNotification.id },
      data: {
        message: `Your X/Twitter API request was rate limited (Error ${errorCode}). This has occurred ${newCount} times in the last 5 minutes. Please wait before trying again.`,
        metadata: {
          ...(existingNotification.metadata as any),
          occurrenceCount: newCount,
          lastOccurrence: new Date().toISOString(),
        },
        // Mark as unread to ensure user sees the update
        isRead: false,
      },
    });

    console.log(`Updated existing rate limit notification (count: ${newCount})`);
    return existingNotification;
  }

  // Create new notification if no recent duplicate exists
  return createNotification({
    userId,
    type: NotificationType.ERROR,
    title: "X/Twitter API Rate Limit Exceeded",
    message: `Your X/Twitter API request was rate limited (Error ${errorCode}). Please try again later. This is a temporary limitation from X/Twitter.`,
    metadata: {
      errorCode,
      errorMessage,
      timestamp: new Date().toISOString(),
      source: "twitter-api",
      occurrenceCount: 1,
    },
  });
}

/**
 * Creates a notification for general Twitter/X API errors
 */
export async function createTwitterErrorNotification(
  userId: number,
  error: any,
  context?: string
) {
  const errorCode = error?.code || error?.statusCode;
  const errorMessage = error?.message || "Unknown error occurred";

  return createNotification({
    userId,
    type: NotificationType.ERROR,
    title: "X/Twitter API Error",
    message: `An error occurred while accessing X/Twitter API${
      context ? ` (${context})` : ""
    }: ${errorMessage}`,
    metadata: {
      errorCode,
      errorMessage,
      context,
      timestamp: new Date().toISOString(),
      source: "twitter-api",
      stack: error?.stack,
    },
  });
}

/**
 * Creates a notification for any social media API error
 */
export async function createSocialMediaErrorNotification(
  userId: number,
  platform: string,
  error: any,
  context?: string
) {
  const errorCode = error?.code || error?.statusCode;
  const errorMessage = error?.message || "Unknown error occurred";

  return createNotification({
    userId,
    type: NotificationType.ERROR,
    title: `${platform} API Error`,
    message: `An error occurred while accessing ${platform}${
      context ? ` (${context})` : ""
    }: ${errorMessage}`,
    metadata: {
      platform,
      errorCode,
      errorMessage,
      context,
      timestamp: new Date().toISOString(),
      source: `${platform.toLowerCase()}-api`,
      stack: error?.stack,
    },
  });
}

/**
 * Clean up old duplicate notifications for a user
 * Useful for removing duplicate rate limit notifications
 */
export async function cleanupDuplicateNotifications(
  userId: number,
  title?: string,
  olderThanMinutes: number = 60
) {
  try {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    const whereClause: any = {
      userId,
      createdAt: {
        lt: cutoffTime,
      },
    };

    if (title) {
      whereClause.title = title;
    }

    const result = await prisma.notification.deleteMany({
      where: whereClause,
    });

    console.log(`Cleaned up ${result.count} old notifications for user ${userId}`);
    return result.count;
  } catch (error) {
    console.error("Failed to cleanup duplicate notifications:", error);
    return 0;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return result.count;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return 0;
  }
}
