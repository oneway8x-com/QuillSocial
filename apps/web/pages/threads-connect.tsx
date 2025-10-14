/**
 * Threads Connect Engagement Page
 * Discover posts with hashtags, preview comments, and queue engagement jobs
 * Reuses most of the X Connect logic through base hook
 */

import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import PageWrapper from "@components/PageWrapper";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { Button, Dialog, DialogContent, DialogFooter, showToast } from "@quillsocial/ui";
import { ssrInit } from "@server/lib/ssr";
import Shell from "@quillsocial/features/shell/Shell";
import { Loader2, Settings, RefreshCw, AlertCircle, ArrowUp } from "lucide-react";
import { useConnectEngagement } from "@lib/connect-engagement/useConnectEngagement";

// TODO: Import shared components when refactored
import SettingsSheet from "@components/x-connect/SettingsSheet";
import ScanStatusCard from "@components/x-connect/ScanStatusCard";
import PostCard from "@components/x-connect/PostCard";
import BulkToolbar from "@components/x-connect/BulkToolbar";
import EngageModal from "@components/x-connect/EngageModal";

export default function ThreadsConnectEngagement() {
  const router = useRouter();

  const {
    config,
    page,
    setPage,
    onlyNotFollowed,
    setOnlyNotFollowed,
    statusFilter,
    setStatusFilter,
    selectedPostIds,
    setSelectedPostIds,
    bulkTemplate,
    setBulkTemplate,
    activeTopics,
    handleTopicsChange,
    settingsOpen,
    setSettingsOpen,
    engageModalOpen,
    setEngageModalOpen,
    showScrollTop,
    showCredentialDialog,
    setShowCredentialDialog,
    credentialQuery,
    statsQuery,
    postsQuery,
    scanMutation,
    markPostsMutation,
    posts,
    stats,
    hasCredential,
    selectedPosts,
    handleSelectAll,
    handleSelectNone,
    handleSelectNotFollowed,
    handleSkipPost,
    handleStartScan,
    handleOpenEngage,
    handleEngageSuccess,
    handleGoToApps,
    scrollToTop,
  } = useConnectEngagement({ platform: "threads" });

  // Show loading while checking credential
  if (credentialQuery.isLoading) {
    return (
      <Shell heading={`Connect Engagement (${config.platformName})`} hideHeadingOnMobile>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="text-muted h-8 w-8 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (!hasCredential) {
    return (
      <Shell heading={`Connect Engagement (${config.platformName})`} hideHeadingOnMobile>
        <Dialog open={showCredentialDialog} onOpenChange={setShowCredentialDialog}>
          <DialogContent
            title={`${config.platformName} Account Required`}
            description={`Connect your ${config.platformName} account to unlock powerful engagement automation.`}
            type="creation"
            Icon={AlertCircle}
          >
            <div className="space-y-4">
              <div className="bg-subtle rounded-lg border border-blue-200 p-4 dark:border-blue-800">
                <h3 className="text-emphasis mb-2 font-semibold">✨ What is Connect Engagement?</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Automatically discover posts with hashtags like <span className="text-emphasis font-medium">#letsconnect</span>, <span className="text-emphasis font-medium">#buildinpublic</span>, and more.
                  Generate personalized AI-powered replies and grow your network on autopilot.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-emphasis text-sm font-medium">To get started:</p>
                <ol className="text-muted ml-4 list-decimal space-y-2 text-sm">
                  <li>Go to the <span className="text-emphasis font-medium">Apps page</span></li>
                  <li>Find and connect <span className="text-emphasis font-medium">"{config.platformDisplayName}"</span></li>
                  <li>Authorize your account</li>
                  <li>Return here to start discovering and engaging with posts</li>
                </ol>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-300 dark:border-orange-700 p-3">
                <p className="text-orange-900 dark:text-orange-100 text-xs font-medium">
                  <strong>💡 Tip:</strong> Make sure your {config.platformName} account has proper permissions for posting and engagement.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button color="primary" onClick={handleGoToApps} size="sm">
                Go to Apps
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="flex min-h-screen items-center justify-center">
          <div className="border-subtle max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <AlertCircle className="text-default h-8 w-8" />
            </div>
            <h2 className="text-foreground mb-3 text-2xl font-semibold">No {config.platformName} Account Connected</h2>
            <p className="text-muted mb-6 text-sm">
              Please connect your {config.platformName} account to use Connect Engagement.
            </p>
            <Button color="primary" onClick={handleGoToApps} className="w-full">
              Connect {config.platformName} Account
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell heading={`Connect Engagement (${config.platformName})`} hideHeadingOnMobile>
      {/* Header */}
      <div className="border-subtle mb-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-foreground text-xl font-bold sm:text-2xl">
              Connect Engagement ({config.platformName})
            </h1>
            <p className="text-muted mt-1 text-sm sm:mt-2 sm:text-base">
              Find #letsconnect posts, drop a friendly reply, then connect on {config.platformName}.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              color="secondary"
              StartIcon={Settings}
              onClick={() => setSettingsOpen(true)}
              disabled={scanMutation.isLoading}
              size="sm"
              className="sm:size-base"
            >
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Settings</span>
            </Button>
            <Button
              color="primary"
              StartIcon={scanMutation.isLoading ? Loader2 : RefreshCw}
              onClick={handleStartScan}
              loading={scanMutation.isLoading}
              size="sm"
              className="sm:size-base"
            >
              {scanMutation.isLoading ? "Scanning..." : "Start Scan"}
            </Button>
          </div>
        </div>

        {/* Scan Status */}
        {stats && (
          <ScanStatusCard
            stats={{
              lastScan: stats.lastScan ?? undefined,
              todayPosted: stats.todayPosted,
              dailyMax: stats.dailyMax,
              readsRemaining: stats.readsRemaining ?? (stats.monthlyReadCap - stats.monthlyReadsUsed),
              postsRemaining: stats.postsRemaining ?? (stats.monthlyPostCap - stats.monthlyPostsUsed),
              resetAt: stats.resetAt ?? new Date(),
            }}
            onRescan={handleStartScan}
          />
        )}
      </div>

      {/* Filters */}
      <div className="border-subtle mb-4 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label className="text-foreground text-sm font-medium">Status:</label>
            <div className="flex gap-1">
              <Button
                color={statusFilter === "ACTIVE" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setStatusFilter("ACTIVE");
                  setPage(1);
                }}
              >
                Active {stats?.statusCounts && `(${stats.statusCounts.active})`}
              </Button>
              <Button
                color={statusFilter === "ENGAGED" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setStatusFilter("ENGAGED");
                  setPage(1);
                  setSelectedPostIds([]);
                }}
              >
                Engaged {stats?.statusCounts && `(${stats.statusCounts.engaged})`}
              </Button>
              <Button
                color={statusFilter === "SKIPPED" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setStatusFilter("SKIPPED");
                  setPage(1);
                  setSelectedPostIds([]);
                }}
              >
                Skipped {stats?.statusCounts && `(${stats.statusCounts.skipped})`}
              </Button>
              <Button
                color={statusFilter === "ALL" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setStatusFilter("ALL");
                  setPage(1);
                  setSelectedPostIds([]);
                }}
              >
                All {stats?.statusCounts && `(${stats.statusCounts.total})`}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="onlyNotFollowed"
              checked={onlyNotFollowed}
              onChange={(e) => {
                setOnlyNotFollowed(e.target.checked);
                setPage(1);
              }}
              className="bg-default border-default text-brand-default focus:ring-brand-default h-4 w-4 rounded"
            />
            <label htmlFor="onlyNotFollowed" className="text-foreground text-sm">
              Only show authors I don't follow
            </label>
          </div>
        </div>
      </div>

      {/* Bulk Toolbar - Only show for ACTIVE status */}
      {posts.length > 0 && statusFilter === "ACTIVE" && (
        <BulkToolbar
          selectedCount={selectedPostIds.length}
          totalCount={posts.length}
          onSelectAll={handleSelectAll}
          onSelectNone={handleSelectNone}
          onSelectNotFollowed={handleSelectNotFollowed}
          template={bulkTemplate}
          onTemplateChange={setBulkTemplate}
          topics={activeTopics}
          onTopicsChange={handleTopicsChange}
        />
      )}

      {/* Results Grid */}
      <div className={selectedPostIds.length > 0 ? "mb-24 pb-6" : "mb-6"}>
        {postsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted h-8 w-8 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="border-subtle rounded-2xl border bg-card p-12 text-center">
            <p className="text-muted text-lg">
              No posts found. Click "Start Scan" to discover posts with your hashtags.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    xPostId: post.postId, // Map to xPostId for compatibility with PostCard component
                  } as any}
                  onSkip={handleSkipPost}
                  template={bulkTemplate}
                  topics={activeTopics}
                  onStatusChange={() => {
                    postsQuery.refetch();
                    statsQuery.refetch();
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {postsQuery.data && (postsQuery.data as any).totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  color="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-muted flex items-center px-4">
                  Page {page} of {(postsQuery.data as any).totalPages}
                </span>
                <Button
                  color="secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= (postsQuery.data as any).totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky Footer - Only show for ACTIVE status */}
      {selectedPostIds.length > 0 && statusFilter === "ACTIVE" && (
        <div className="border-subtle bg-card/95 fixed bottom-0 left-0 right-0 z-50 border-t p-4 shadow-2xl backdrop-blur-md">
          <div className="container mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-foreground text-lg font-semibold">
                {selectedPostIds.length} post{selectedPostIds.length !== 1 ? "s" : ""} selected
              </p>
              <Button color="minimal" size="sm" onClick={handleSelectNone}>
                Clear
              </Button>
            </div>
            <Button color="primary" size="lg" onClick={handleOpenEngage} className="w-full sm:w-auto">
              Generate & Engage ({selectedPostIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={stats?.settings}
        onSave={() => {
          statsQuery.refetch();
          showToast("Settings saved", "success");
        }}
      />

      {/* Engage Modal */}
      <EngageModal
        open={engageModalOpen}
        onClose={() => setEngageModalOpen(false)}
        selectedPostIds={selectedPostIds}
        selectedPosts={selectedPosts as any}
        template={bulkTemplate}
        topics={activeTopics}
        dailyMax={stats?.dailyMax || 20}
        todayPosted={stats?.todayPosted || 0}
        onSuccess={handleEngageSuccess}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="bg-primary hover:bg-emphasis fixed bottom-20 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-2xl transition-all hover:scale-110 sm:bottom-6"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </Shell>
  );
}

ThreadsConnectEngagement.PageWrapper = PageWrapper;

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { req, res } = context;
  const ssr = await ssrInit(context);
  const session = await getServerSession({ req, res });

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      trpcState: ssr.dehydrate(),
    },
  };
};
