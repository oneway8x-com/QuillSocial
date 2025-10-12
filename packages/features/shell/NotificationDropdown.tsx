import { trpc } from "@quillsocial/trpc/react";
import { Badge, Button, Dialog, DialogContent, DialogTrigger, DialogClose, showToast } from "@quillsocial/ui";
import { Bell, Check, CheckCheck, X, AlertCircle, AlertTriangle, CheckCircle, Info, Trash2 } from "@quillsocial/ui/components/icon";
import dayjs from "@quillsocial/dayjs";
import { useEffect, useState } from "react";
import classNames from "@quillsocial/lib/classNames";

export function NotificationDropdown() {
  const utils = trpc.useContext();
  const [isOpen, setIsOpen] = useState(false);

  // Get unread count
  const { data: unreadData } = trpc.viewer.notifications.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get notifications list
  const { data: notificationsData, refetch } = trpc.viewer.notifications.list.useQuery({
    limit: 10,
    offset: 0,
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.viewer.notifications.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      utils.viewer.notifications.getUnreadCount.invalidate();
      utils.viewer.notifications.list.invalidate();
    },
  });

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate({ notificationIds: [notificationId] });
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate({ all: true });
  };

  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.notifications || [];

  // Check if there are multiple rate limit notifications
  const rateLimitNotifications = notifications.filter(n =>
    n.title.includes("Rate Limit") || n.title.includes("API Error")
  );
  const hasMultipleRateLimits = rateLimitNotifications.length > 1;

  // Helper to extract occurrence count from metadata
  const getOccurrenceCount = (notification: any): number => {
    return (notification?.metadata as any)?.occurrenceCount || 0;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ERROR":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "INFO":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationStyles = (type: string, isRead: boolean) => {
    const baseStyles = "border-l-4 transition-colors duration-200";

    if (isRead) {
      return `${baseStyles} border-gray-200 bg-white hover:bg-gray-50`;
    }

    switch (type) {
      case "ERROR":
        return `${baseStyles} border-red-400 bg-red-50/50 hover:bg-red-50`;
      case "WARNING":
        return `${baseStyles} border-yellow-400 bg-yellow-50/50 hover:bg-yellow-50`;
      case "SUCCESS":
        return `${baseStyles} border-green-400 bg-green-50/50 hover:bg-green-50`;
      case "INFO":
      default:
        return `${baseStyles} border-blue-400 bg-blue-50/50 hover:bg-blue-50`;
    }
  };

  // Auto-refresh on component mount and auto-dismiss old read notifications
  useEffect(() => {
    if (isOpen) {
      refetch();

      // Auto-mark old read notifications (older than 1 hour) for cleanup
      const oldReadNotifications = notifications.filter(n => {
        if (!n.isRead) return false;
        const hourAgo = Date.now() - 60 * 60 * 1000;
        return new Date(n.createdAt).getTime() < hourAgo;
      });

      // Silently clean up old read notifications to keep the list fresh
      if (oldReadNotifications.length > 0) {
        console.log(`Auto-cleaning ${oldReadNotifications.length} old read notifications`);
        // Note: This would need a backend endpoint to delete old notifications
        // For now, just log it
      }
    }
  }, [isOpen, refetch, notifications]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="hover:bg-muted relative inline-flex rounded-full p-2.5 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 flex h-4 items-center justify-center rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white shadow-md whitespace-nowrap leading-none transform translate-x-1/4 -translate-y-1/4">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent size="lg" enableOverflow className="max-h-[85vh] p-0">
        {/* Close Button - Top Right */}
        <DialogClose
          dialogCloseProps={{
            className: "absolute right-4 top-4 z-20 rounded-full p-2 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          }}
        >
          <X className="h-5 w-5 text-gray-600" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 border-b px-6 py-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="red" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="button"
                color="secondary"
                size="sm"
                onClick={handleMarkAllAsRead}
                StartIcon={CheckCheck}
                className="text-xs h-8 hover:bg-white"
              >
                Mark all read
              </Button>
            )}
          </div>
          {/* Show info banner if multiple rate limit notifications */}
          {hasMultipleRateLimits && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>Multiple API errors detected. Consider checking your X/Twitter app rate limits.</span>
              </p>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-900 mb-2">No notifications</p>
            <p className="text-sm text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={classNames(
                  "relative group",
                  getNotificationStyles(notification.type, notification.isRead)
                )}
              >
                <div className="px-6 py-5">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <p className="text-base font-semibold text-gray-900 leading-snug">
                            {notification.title}
                          </p>
                          {/* Show occurrence count badge if > 1 */}
                          {getOccurrenceCount(notification) > 1 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              ×{getOccurrenceCount(notification)}
                            </span>
                          )}
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1.5 hover:bg-gray-200 rounded-full"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3 break-words">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{dayjs(notification.createdAt).fromNow()}</span>
                        {!notification.isRead && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium text-blue-600">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Unread
                            </span>
                          </>
                        )}
                        {getOccurrenceCount(notification) > 1 && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-medium">
                              {getOccurrenceCount(notification)} occurrences
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {index < notifications.length - 1 && (
                  <div className="border-b border-gray-100" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && notificationsData?.hasMore && (
          <div className="sticky bottom-0 border-t bg-gray-50 px-6 py-4 text-center">
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
              View all notifications →
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
