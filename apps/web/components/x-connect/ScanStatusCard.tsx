/**
 * Scan Status Card - Shows last scan results and budget meters
 */

import { Card, Badge, Button } from "@quillsocial/ui";
import { Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface ScanStatusCardProps {
  stats: {
    lastScan?: Date;
    todayPosted: number;
    dailyMax: number;
    readsRemaining: number;
    postsRemaining: number;
    resetAt: Date;
  };
  onRescan: () => void;
}

export default function ScanStatusCard({ stats, onRescan }: ScanStatusCardProps) {
  const readsPercent = ((100 - stats.readsRemaining) / 100) * 100;
  const postsPercent = ((500 - stats.postsRemaining) / 500) * 100;
  const dailyPercent = (stats.todayPosted / stats.dailyMax) * 100;

  return (
    <div className="border-subtle grid gap-4 rounded-xl border bg-muted/50 p-4 md:grid-cols-3">
      {/* Last Scan */}
      <div>
        <div className="text-muted mb-2 flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          Last Scan
        </div>
        <p className="text-foreground text-sm font-medium">
          {stats.lastScan ? format(new Date(stats.lastScan), "MMM d, h:mm a") : "Never"}
        </p>
      </div>

      {/* Budget Meters */}
      <div className="col-span-2 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted">Reads this month</span>
            <span className="text-foreground font-medium">
              {100 - stats.readsRemaining} / 100
            </span>
          </div>
          <div className="bg-subtle h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${readsPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted">Posts today</span>
            <span className="text-foreground font-medium">
              {stats.todayPosted} / {stats.dailyMax}
            </span>
          </div>
          <div className="bg-subtle h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted">Monthly posts remaining</span>
            <span className="text-foreground font-medium">{stats.postsRemaining} / 500</span>
          </div>
          <div className="bg-subtle h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${postsPercent}%` }}
            />
          </div>
        </div>

        <p className="text-muted text-xs">
          Resets on {format(new Date(stats.resetAt), "MMMM d, yyyy")}
        </p>
      </div>
    </div>
  );
}
