import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { useRouter } from "next/router";
import useMeQuery from "@quillsocial/trpc/react/hooks/useMeQuery";
import { TWITTER_APP_ID } from "@quillsocial/lib/constants";
import { useCurrentUserAccount } from "@quillsocial/features/shell/SocialAvatar";
import { trpc } from "@quillsocial/trpc/react";
import { Post } from "@quillsocial/types/Posts";
import { ReWriteAI } from "@quillsocial/types/ReWriteAI";
import { showToast } from "@quillsocial/ui";
import * as postService from "../../services/write/postService";
import * as aiService from "../../services/write/aiService";

const DeviceType = {
  PHONE: "phone",
  TAB: "tab",
  PC: "pc",
};

export function useWritePage() {
  const { data: user } = useMeQuery();
  const router = useRouter();
  const { id } = router.query;
  const [editorContent, setEditorContent] = useState("");
  const [title, setTitle] = useState("");
  const [activeDevice, setActiveDevice] = useState(DeviceType.PC);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalShowDay, setIsModalShowDay] = useState(false);
  const [isModalPostNow, setIsModalPostNow] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [isModalAddImage, setIsModalAddImage] = useState(false);
  const [isModalAddVideo, setIsModalAddVideo] = useState(false);
  const [isModalUploadFile, setIsModalUploadFile] = useState(false);
  const [isModalPickDraft, setIsModalPickDraft] = useState(false);
  const [isModalEmoji, setIsModalEmoji] = useState(false);
  const [credentialId, setCredentialId] = useState<any>(undefined);
  const [pageId, setPageId] = useState<any>(undefined);
  const [appId, setAppId] = useState(TWITTER_APP_ID);
  const [isButtonSaveDraft, setIsButtonSaveDraft] = useState(false);
  const [isModalFormatPost, setIsModalFormatPost] = useState(false);
  const [isModalDeletePost, setIsModalDeletePost] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [showModalAccounts, setShowModalAccounts] = useState(false);
  const [isModalUpgradeOpen, setIsModalUpgradeOpen] = useState(false);
  const [isTwitterCharacterLimitDialogOpen, setIsTwitterCharacterLimitDialogOpen] = useState(false);
  const [showTwitterDialog, setShowTwitterDialog] = useState(false);
  const [twitterCharacterCount, setTwitterCharacterCount] = useState(0);
  const [post, setPost] = useState<Post>({ id: 0, idea: "", content: "", appId: TWITTER_APP_ID });
  const [fileInfo, setFileInfo] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishLoading, setIsPublishLoading] = useState(false);
  const [firstRender, setFirstRender] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<{id?: string; name?: string} | null>(null);

  // trpc queries
  const { isLoading: ischeckForAIAppsLoading, data: isAIPresent } = trpc.viewer.appsRouter.checkForAIApps.useQuery();
  const socialAccountsQuery = trpc.viewer.socials.getSocialNetWorking.useQuery();

  useEffect(() => {
    if (user?.currentSocialProfile?.credentialId !== null && user?.currentSocialProfile?.credentialId !== undefined) {
      setCredentialId(user?.currentSocialProfile?.credentialId);
      setPageId(user?.currentSocialProfile?.pageId);
    }
    setAppId(user?.currentSocialProfile?.appId!);
  }, [user?.currentSocialProfile?.credentialId]);

  const contentStyle = {
    width: activeDevice === DeviceType.PHONE ? "65%" : activeDevice === DeviceType.TAB ? "80%" : "100%",
    transition: "width 0.3s",
  };

  const debouncedApiCall = useMemo(() => {
    return debounce(async (postId: number) => {
      if (credentialId !== null && credentialId !== undefined) {
        try {
          const dataResponse = await postService.getPostById(credentialId, postId);
          if (!dataResponse || !dataResponse.data) {
            console.error("No data response received for post:", postId);
            return;
          }
          const data = dataResponse.data;

          // Validate data structure
          if (!data) {
            console.error("Data is null or undefined");
            return;
          }

          const postFromDb = {
            id: data.id || 0,
            topic: data.idea || "",
            title: data.title || "",
            content: data.content || "",
            avatarUrl: data.credential?.avatarUrl || null,
            name: data.credential?.name || null,
            emailOrUserName: data.credential?.emailOrUserName || null,
            credentialId: data.credential?.id || null,
            createdDate: data.createdDate,
            idea: data.idea || "",
            appId: data.appId || "",
            imagesDataURL: data.imagesDataURL,
          };
          setPost(postFromDb as any);
          setEditorContent(postFromDb.content);
          const images = data.imagesDataURL as string[];
          setImageSrc(images && images.length > 0 ? images[0] : "");
          if (data.xcommunity) {
            setSelectedCommunity({ id: data.xcommunity, name: `Community ${data.xcommunity}` });
          } else {
            setSelectedCommunity(null);
          }
        } catch (error) {
          console.error("Error fetching post data:", error);
        }
      }
    }, 150);
  }, [credentialId]);

  useEffect(() => {
    if (credentialId !== null && typeof id === "string") {
      const idFromQuery = parseInt(id);
      if (!isNaN(idFromQuery) && idFromQuery !== 0) {
        debouncedApiCall(idFromQuery);
      }
    }
  }, [debouncedApiCall, credentialId, id]);

  const rewriteAction = async (instruction: ReWriteAI | string) => {
    if (!ischeckForAIAppsLoading && !isAIPresent) {
      showToast("Please install ChatGPT app from Apps menu to use this feature", "error");
      return "";
    }
    setIsLoading(true);
    const result = await aiService.completePost(instruction, editorContent);
    setIsLoading(false);
    if (!result) return "";
    if (instruction === ReWriteAI.ConvertTwitter) {
      setEditorContent(result.post);
    }
    return result.post;
  };

  const saveDraft = async (image?: string) => {
    const data = {
      id: post.id,
      title: title,
      content: editorContent,
      appId: appId,
      credentialId: credentialId,
      imagesDataURL: image ? [image] : undefined,
      pageId,
      fileInfo,
      xcommunity: selectedCommunity?.id || null,
    };
    const result = await postService.saveDraft(data);
    if (result && result.id) {
      router.push(`/write/${result.id}`);
      return result;
    }
    console.error("Failed to save draft or result is null");
    return null;
  };

  const handleSaveDraft = async (image?: string) => {
    setIsButtonSaveDraft(true);
    const result = await saveDraft(image);
    if (result !== null) {
      showToast("Saved successfully", "success");
      setIsButtonSaveDraft(false);
      return result;
    } else {
      showToast("Saved error", "error");
      setIsButtonSaveDraft(false);
      return false;
    }
  };

  const handleUpdateFromScheduleDialog = async (pluginData?: any) => {
    const result = await saveDraft();
    if (result && result.id) {
      const scheduleResult = await postService.schedulePost(result.id, selectedDateTime);
      setIsModalShowDay(false);
      if (scheduleResult) {
        showToast("Schedule successfully", "success");
      } else {
        showToast("Failed to schedule", "error");
      }
    } else {
      showToast("Failed to save draft before scheduling", "error");
      setIsModalShowDay(false);
    }
  };

  const formatContent = async (format: string) => {
    return rewriteAction(format);
  };

  const handlePostNow = async (pluginData?: any) => {
    try {
      setIsPublishLoading(true);
      setIsModalPostNow(false);

      // Validate Instagram posts require images
      const currentAppId = user?.currentSocialProfile?.appId;
      const isInstagram = currentAppId === "instagram-social" || currentAppId === "instagramsocial";
      if (isInstagram && !imageSrc) {
        showToast("Instagram requires at least one image. Please add an image to your post.", "error");
        setIsPublishLoading(false);
        return;
      }

      const result = await saveDraft();
      if (!result || !result.id) {
        showToast("Failed to save draft before publishing", "error");
        setIsPublishLoading(false);
        return;
      }
      let urlSocial = user?.currentSocialProfile?.appId?.replace(/-/g, "");
      if (urlSocial === "xsocial") urlSocial = "twitterv1social";

      const publishResult = await postService.publishPost(urlSocial || "", result.id);
      if (!publishResult.ok) {
        showToast(`Publishing failed: ${publishResult.error}`, "error");
      } else {
        if (pluginData) {
          await postService.savePluginData(result.id, pluginData);
        }
        showToast("Post has been published successfully!", "success");
        router.push("/my-content/posted");
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      showToast("An unexpected error occurred while publishing", "error");
    } finally {
      setIsPublishLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    setImageSrc("");
    await handleSaveDraft("deleteImage");
  };

  const currentUser = useCurrentUserAccount();
  const isPluginCommentSupported = currentUser?.appId === 'xconsumerkeys-social' || currentUser?.appId === 'twitterv1-social' || currentUser?.appId === 'x-social';
  const handleCheckPublishPost = () => {
    if (isPublishLoading) return;
    const currentSocialAccount = socialAccountsQuery.data?.find((account) => account.isUserCurrentProfile);
    const hasTwitterCredential = currentSocialAccount?.appId?.toLowerCase() === "xconsumerkeys-social";
    if (isPluginCommentSupported || hasTwitterCredential) {
      if (hasTwitterCredential && editorContent) {
        const charCount = stripHtml(editorContent).length;
        setTwitterCharacterCount(charCount);
        setShowTwitterDialog(true);
      } else {
        handlePostNow();
      }
    } else {
      handlePostNow();
    }
  };

  useEffect(() => {
    if (socialAccountsQuery.isFetched) {
      const data = socialAccountsQuery.data;
      if (Array.isArray(data) && data.length === 0) {
        // handled in page component
      }
    }
  }, [socialAccountsQuery.isFetched, socialAccountsQuery.data]);

  const stripHtml = (html: string) => html.replace(/<[^>]*(>|$)/g, "");

  return {
    // state
    editorContent,
    setEditorContent,
    title,
    setTitle,
    activeDevice,
    setActiveDevice,
    isExpanded,
    setIsExpanded,
    isModalShowDay,
    setIsModalShowDay,
    isModalPostNow,
    setIsModalPostNow,
    selectedDateTime,
    setSelectedDateTime,
    isModalAddImage,
    setIsModalAddImage,
    isModalAddVideo,
    setIsModalAddVideo,
    isModalUploadFile,
    setIsModalUploadFile,
    isModalPickDraft,
    setIsModalPickDraft,
    isModalEmoji,
    setIsModalEmoji,
    credentialId,
    pageId,
    appId,
    isButtonSaveDraft,
    isModalFormatPost,
    setIsModalFormatPost,
    isModalDeletePost,
    setIsModalDeletePost,
    imageSrc,
    setImageSrc,
    showModalAccounts,
    setShowModalAccounts,
    isModalUpgradeOpen,
    setIsModalUpgradeOpen,
    isTwitterCharacterLimitDialogOpen,
    setIsTwitterCharacterLimitDialogOpen,
    showTwitterDialog,
    setShowTwitterDialog,
    twitterCharacterCount,
    setTwitterCharacterCount,
    post,
    setPost,
    fileInfo,
    setFileInfo,
    isLoading,
    isPublishLoading,
    firstRender,
    setFirstRender,
    selectedCommunity,
    setSelectedCommunity,
    ischeckForAIAppsLoading,
    isAIPresent,
    socialAccountsQuery,
    currentUser,
    isPluginCommentSupported,
    contentStyle,

    // actions
    toggleContent: () => setIsExpanded((s) => !s),
    handleEditorChange: (e: any) => setEditorContent(e.target.value),
    stripHtml,
    handleDateTimeChangeFromSchedule: (v: string) => setSelectedDateTime(v),
    handleEditAndPostFromDialog: (d: any) => setEditorContent(d.content),
    handleSelectEmojiFromDialog: (emoji: string | null) => {
      if (emoji) setEditorContent((c) => (c ? c + emoji : emoji));
    },
    handleCopyToWritePage: (content: string) => setEditorContent(content),
    rewriteAction,
    handleSaveDraft,
    handleUpdateFromScheduleDialog,
    formatContent,
    handlePostNow,
    handleGetValueFromDialogFormatPost: (v: string) => setEditorContent(v),
    handleRemoveImage,
    savePluginData: postService.savePluginData,
    handleCheckPublishPost,
  };
}

export type UseWritePageReturn = ReturnType<typeof useWritePage>;
