/**
 * Base hook for Connect Engagement feature
 * Reusable for both X and Threads platforms
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { trpc } from "@quillsocial/trpc/react";
import { showToast } from "@quillsocial/ui";
import {
  Platform,
  DiscoveredStatus,
  DiscoveredPost,
  ConnectStats,
  PLATFORM_CONFIGS,
  DEFAULT_TOPICS,
} from "./types";

interface UseConnectEngagementProps {
  platform: Platform;
}

interface UseConnectEngagementReturn {
  // Platform config
  config: typeof PLATFORM_CONFIGS[Platform];

  // State
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  onlyNotFollowed: boolean;
  setOnlyNotFollowed: (value: boolean) => void;
  statusFilter: DiscoveredStatus;
  setStatusFilter: (status: DiscoveredStatus) => void;
  selectedPostIds: string[];
  setSelectedPostIds: React.Dispatch<React.SetStateAction<string[]>>;
  bulkTemplate: string;
  setBulkTemplate: (template: string) => void;
  activeTopics: string[];
  setActiveTopics: (topics: string[]) => void;
  handleTopicsChange: (topics: string[]) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  engageModalOpen: boolean;
  setEngageModalOpen: (open: boolean) => void;
  showScrollTop: boolean;
  showCredentialDialog: boolean;
  setShowCredentialDialog: (show: boolean) => void;

  // Queries
  credentialQuery: ReturnType<typeof trpc.viewer.xConnect.hasXCredential.useQuery | typeof trpc.viewer.threadsConnect.hasThreadsCredential.useQuery>;
  statsQuery: ReturnType<typeof trpc.viewer.xConnect.stats.useQuery | typeof trpc.viewer.threadsConnect.stats.useQuery>;
  postsQuery: ReturnType<typeof trpc.viewer.xConnect.listDiscovered.useQuery | typeof trpc.viewer.threadsConnect.listDiscovered.useQuery>;

  // Mutations
  scanMutation: ReturnType<typeof trpc.viewer.xConnect.startScan.useMutation | typeof trpc.viewer.threadsConnect.startScan.useMutation>;
  markPostsMutation: ReturnType<typeof trpc.viewer.xConnect.markPosts.useMutation | typeof trpc.viewer.threadsConnect.markPosts.useMutation>;

  // Computed
  posts: DiscoveredPost[];
  stats: ConnectStats | undefined;
  hasCredential: boolean;
  selectedPosts: DiscoveredPost[];

  // Handlers
  handleSelectAll: () => void;
  handleSelectNone: () => void;
  handleSelectNotFollowed: () => void;
  handleTogglePost: (postId: string) => void;
  handleSkipPost: (postId: string) => void;
  handleStartScan: () => void;
  handleOpenEngage: () => void;
  handleEngageSuccess: () => void;
  handleGoToApps: () => void;
  scrollToTop: () => void;
}

export function useConnectEngagement({
  platform,
}: UseConnectEngagementProps): UseConnectEngagementReturn {
  const router = useRouter();
  const config = PLATFORM_CONFIGS[platform];

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [engageModalOpen, setEngageModalOpen] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [page, setPage] = useState(1);
  const [onlyNotFollowed, setOnlyNotFollowed] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DiscoveredStatus>("ACTIVE");
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [showCredentialDialog, setShowCredentialDialog] = useState(false);

  const TOPICS_STORAGE_KEY = `${platform}-connect-topics`;

  // Scroll to top handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Platform-specific tRPC queries
  const xCredentialQuery = trpc.viewer.xConnect.hasXCredential.useQuery(undefined, {
    enabled: platform === "x",
  });
  const threadsCredentialQuery = trpc.viewer.threadsConnect.hasThreadsCredential.useQuery(undefined, {
    enabled: platform === "threads",
  });
  const credentialQuery = platform === "x" ? xCredentialQuery : threadsCredentialQuery;

  const xStatsQuery = trpc.viewer.xConnect.stats.useQuery(undefined, {
    enabled: platform === "x",
  });
  const threadsStatsQuery = trpc.viewer.threadsConnect.stats.useQuery(undefined, {
    enabled: platform === "threads",
  });
  const statsQuery = platform === "x" ? xStatsQuery : threadsStatsQuery;

  const xPostsQuery = trpc.viewer.xConnect.listDiscovered.useQuery(
    {
      page,
      pageSize: 20,
      onlyNotFollowed,
      status: statusFilter,
    },
    { enabled: platform === "x" }
  );
  const threadsPostsQuery = trpc.viewer.threadsConnect.listDiscovered.useQuery(
    {
      page,
      pageSize: 20,
      onlyNotFollowed,
      status: statusFilter,
    },
    { enabled: platform === "threads" }
  );
  const postsQuery = platform === "x" ? xPostsQuery : threadsPostsQuery;

  // Check credential and show dialog if not connected
  useEffect(() => {
    if (credentialQuery.data && !credentialQuery.data.hasCredential) {
      setShowCredentialDialog(true);
    }
  }, [credentialQuery.data]);

  // Initialize topics from localStorage or settings
  useEffect(() => {
    const storedTopics = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (storedTopics) {
      try {
        const parsed = JSON.parse(storedTopics);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveTopics(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse stored topics", e);
      }
    }

    if (statsQuery.data?.settings.topics && statsQuery.data.settings.topics.length > 0) {
      setActiveTopics(statsQuery.data.settings.topics);
    } else {
      setActiveTopics(DEFAULT_TOPICS);
    }
  }, [statsQuery.data?.settings.topics, TOPICS_STORAGE_KEY]);

  // Save topics to localStorage whenever they change
  const handleTopicsChange = (newTopics: string[]) => {
    setActiveTopics(newTopics);
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(newTopics));
  };

  // Platform-specific mutations
  const xScanMutation = trpc.viewer.xConnect.startScan.useMutation({
    onSuccess: (data) => {
      showToast(
        `Scan complete! Found ${data.found} posts, inserted ${data.inserted}, skipped ${data.skipped}`,
        "success"
      );
      postsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });
  const threadsScanMutation = trpc.viewer.threadsConnect.startScan.useMutation({
    onSuccess: (data) => {
      showToast(
        `Scan complete! Found ${data.found} posts, inserted ${data.inserted}, skipped ${data.skipped}`,
        "success"
      );
      postsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });
  const scanMutation = platform === "x" ? xScanMutation : threadsScanMutation;

  const xMarkPostsMutation = trpc.viewer.xConnect.markPosts.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });
  const threadsMarkPostsMutation = trpc.viewer.threadsConnect.markPosts.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });
  const markPostsMutation = platform === "x" ? xMarkPostsMutation : threadsMarkPostsMutation;

  // Computed values
  const posts = (postsQuery.data?.posts || []).map(post => ({
    ...post,
    postId: platform === "x" ? (post as any).xPostId : (post as any).threadsPostId,
  })) as DiscoveredPost[];

  const stats = statsQuery.data;
  const hasCredential = credentialQuery.data?.hasCredential ?? false;

  const selectedPosts = useMemo(() => {
    return posts.filter((post) => selectedPostIds.includes(post.postId));
  }, [posts, selectedPostIds]);

  // Selection handlers
  const handleSelectAll = () => {
    setSelectedPostIds(posts.map((p) => p.postId));
  };

  const handleSelectNone = () => {
    setSelectedPostIds([]);
  };

  const handleSelectNotFollowed = () => {
    setSelectedPostIds(posts.filter((p) => !p.authorIsFollowed).map((p) => p.postId));
  };

  const handleTogglePost = (postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleSkipPost = (postId: string) => {
    const mutationInput = platform === "x"
      ? { xPostIds: [postId], status: "SKIPPED" as const }
      : { threadsPostIds: [postId], status: "SKIPPED" as const };

    markPostsMutation.mutate(mutationInput as any, {
      onSuccess: () => {
        showToast("Post skipped", "success");
        setSelectedPostIds((prev) => prev.filter((id) => id !== postId));
      },
    });
  };

  const handleStartScan = () => {
    scanMutation.mutate({ force: true });
  };

  const handleOpenEngage = () => {
    if (selectedPostIds.length === 0) {
      showToast("Please select at least one post", "error");
      return;
    }
    setEngageModalOpen(true);
  };

  const handleEngageSuccess = () => {
    const mutationInput = platform === "x"
      ? { xPostIds: selectedPostIds, status: "QUEUED" as const }
      : { threadsPostIds: selectedPostIds, status: "QUEUED" as const };

    markPostsMutation.mutate(mutationInput as any, {
      onSuccess: () => {
        setSelectedPostIds([]);
        setEngageModalOpen(false);
        showToast("Engagement jobs queued successfully!", "success");
      },
    });
  };

  const handleGoToApps = () => {
    router.push("/settings/my-account/app-integrations");
  };

  return {
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
    setActiveTopics,
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
    handleTogglePost,
    handleSkipPost,
    handleStartScan,
    handleOpenEngage,
    handleEngageSuccess,
    handleGoToApps,
    scrollToTop,
  };
}
