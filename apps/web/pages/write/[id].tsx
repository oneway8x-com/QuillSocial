import WriteEditorToolbar from "../../components/write/WriteEditorToolbar";
import { useWritePage } from "../../components/write/useWritePage";
import PageWrapper from "@components/PageWrapper";
import { AddImageDialog } from "@components/write/AddImageDialog";
import { DeletePostDialog } from "@components/write/DeletePostDialog";
import { EmojiDialog } from "@components/write/EmojiDialog";
import { FormatPostDialog } from "@components/write/FormatPostDialog";
import { PickDraftDialog } from "@components/write/PickDraftDialog";
import { PostNowDialog } from "@components/write/PostNowDialog";
import { PostPreview } from "@components/write/PostPreview";
import { ScheduleDialog } from "@components/write/ScheduleDialog";
import { TwitterCharacterLimitDialog } from "@components/write/TwitterCharacterLimitDialog";
import { UploadFileDialog } from "@components/write/UploadFileDialog";
import { UploadVideoDialog } from "@components/write/UploadFileVideo";
import XCommunitySearch from "@components/write/XCommunitySearch";
import ModalUpgrade from "@quillsocial/features/payments/ModalUpgrade";
import Shell from "@quillsocial/features/shell/Shell";
import { ModalAccount } from "@quillsocial/features/shell/SocialAccountsDialog";
import SocialAvatar from "@quillsocial/features/shell/SocialAvatar";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import {
  Button,
  HeadSeo,
  LoadingDialog,
  TextArea,
  showToast,
} from "@quillsocial/ui";
import { Tablet, Laptop } from "@quillsocial/ui/components/icon";
import { useRouter } from "next/router";
import { Editor } from "primereact/editor";
import React from "react";

const WritePage: React.FC & { PageWrapper?: any } = () => {
  const { t } = useLocale();
  const router = useRouter();
  const wp = useWritePage();

  const {
    editorContent,
    setEditorContent,
    title,
    setTitle,
    activeDevice,
    setActiveDevice,
    isExpanded,
    toggleContent,
    isModalShowDay,
    setIsModalShowDay,
    isModalPostNow,
    setIsModalPostNow,
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
    showTwitterDialog,
    setShowTwitterDialog,
    twitterCharacterCount,
    post,
    fileInfo,
    setFileInfo,
    isLoading,
    isPublishLoading,
    selectedCommunity,
    setSelectedCommunity,
    contentStyle,
    ischeckForAIAppsLoading,
    isAIPresent,
    currentUser,

    // actions
    handleEditorChange,
    stripHtml,
    handleSaveDraft,
    handleUpdateFromScheduleDialog,
    handlePostNow,
    handleRemoveImage,
    handleEditAndPostFromDialog,
    handleSelectEmojiFromDialog,
    handleCopyToWritePage,
    rewriteAction,
    handleCheckPublishPost,
    formatContent,
  } = wp as any;

  const handleDeviceChange = (device: string) => setActiveDevice(device);

  // Check if there's content (text or image) to enable publish/schedule buttons
  const strippedContent = editorContent ? stripHtml(editorContent).trim() : "";
  const hasTextContent = strippedContent.length > 0;
  const hasImageContent = !!imageSrc;
  const hasContent = hasTextContent || hasImageContent;

  // Debug logging
  console.log("=== Content Validation Debug ===");
  console.log("editorContent:", editorContent);
  console.log("strippedContent:", strippedContent);
  console.log("strippedContent.length:", strippedContent.length);
  console.log("imageSrc:", imageSrc);
  console.log("hasTextContent:", hasTextContent);
  console.log("hasImageContent:", hasImageContent);
  console.log("hasContent:", hasContent);
  console.log("================================");

  return (
    <>
      {isLoading && <LoadingDialog open={isLoading} />}

      <HeadSeo title={t("Posts")} description={""} />

      <Shell
        withoutSeo
        heading={t("Write Post")}
        subtitle="Here are your Posts"
      >
        <div className="mt-5 grid grid-cols-12 sm:mt-0">
          <div className="col-span-12 h-auto bg-white lg:col-span-7">
            <div className="w-full shadow-sm">
              <WriteEditorToolbar
                editorContent={editorContent}
                onRewrite={rewriteAction}
                onOpenEmoji={() => setIsModalEmoji(true)}
                onOpenPickDraft={() => setIsModalPickDraft(true)}
                onOpenFormatPost={() => setIsModalFormatPost(true)}
                onOpenAddImage={() => setIsModalAddImage(true)}
                onOpenAddVideo={() => setIsModalAddVideo(true)}
                onOpenUploadFile={() => setIsModalUploadFile(true)}
                onCopyToWritePage={(c: string) => setEditorContent(c)}
                currentUser={currentUser}
                hasAI={!ischeckForAIAppsLoading && isAIPresent}
              />

              {appId === "medium-social" ? (
                <div className="-mt-1">
                  <div>
                    <label
                      htmlFor="title"
                      className="ml-3 mt-2 block text-sm font-medium leading-6 text-gray-900"
                    >
                      Title
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="ml-3 block w-11/12 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="Title"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="content"
                      className="ml-3 mt-3 block text-sm font-medium leading-6 text-gray-900"
                    >
                      Content
                    </label>
                    <div className="mt-2">
                      <Editor
                        className="border-none"
                        value={editorContent}
                        onTextChange={(e: any) =>
                          handleEditorChange(e.htmlValue ?? "")
                        }
                        placeholder="Your content to rewrite and improve by AI ..."
                        style={{ height: "450px", border: "0" }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Render XCommunitySearch only for X/Twitter variants */}
                  {(() => {
                    const X_APP_WHITELIST = new Set<string>([
                      "xconsumerkeys-social",
                      "xconsumerkeys_social",
                      "twitterv1social",
                      "xsocial",
                      "twitterv1-social",
                      "twitterv1_social",
                    ]);

                    const showXCommunity =
                      !!appId && X_APP_WHITELIST.has(appId as string);

                    return showXCommunity ? (
                      <XCommunitySearch
                        appId={appId}
                        credentialId={credentialId as any}
                        selectedCommunity={selectedCommunity}
                        onSelect={(community: any) => {
                          setSelectedCommunity(community);
                          if (community)
                            showToast(
                              `Selected community: ${community.name}`,
                              "success"
                            );
                          else
                            showToast("Community selection cleared", "success");
                        }}
                      />
                    ) : null;
                  })()}

                  <TextArea
                    className="editor m-2"
                    placeholder="Your content to rewrite and improve by AI ..."
                    value={editorContent}
                    style={{
                      height: "450px",
                      backgroundColor: "white",
                      maxWidth: "95%",
                    }}
                    onChange={handleEditorChange}
                  />
                </div>
              )}

              <div className="flex border-t p-4 text-[12px] shadow-sm sm:text-[13px]">
                <span className="">Last saved</span>
                <span className="ml-auto">
                  {editorContent ? stripHtml(editorContent).length : 0}{" "}
                  characters
                </span>
              </div>

              <div className="flex border-b p-4 shadow-sm">
                <Button
                  onClick={() => handleSaveDraft()}
                  disabled={isButtonSaveDraft}
                  className="text-dark rounded-2xl border bg-white text-[12px] hover:text-white sm:text-sm"
                >
                  <p className="hidden sm:block">Save as Draft</p>
                  <p className="block sm:hidden">Save</p>
                </Button>

                <Button
                  disabled={post.id === 0}
                  onClick={() => setIsModalDeletePost(true)}
                  className="text-dark ml-2 rounded-2xl border bg-red-100 text-[12px] text-red-500 hover:border-red-400 hover:bg-red-200 sm:text-sm"
                >
                  Delete
                </Button>

                <Button
                  onClick={() => setIsModalShowDay(true)}
                  disabled={!hasContent}
                  className="text-dark ml-1 mr-1 rounded-2xl border bg-white text-[12px] hover:text-white sm:ml-auto sm:mr-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule
                </Button>

                <Button
                  onClick={() => handleCheckPublishPost()}
                  disabled={isPublishLoading || !hasContent}
                  className="rounded-2xl text-[12px] hover:text-white sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishLoading ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </div>
          </div>

          <div className="col-span-12 mt-[50px] h-[620px] bg-slate-100 lg:col-span-5 lg:mt-0">
            <div className="h-full overflow-y-auto pb-5">
              <div className="flex h-[44px] items-center border-b-2 bg-white px-2 ">
                <div className="font-bold">Post Preview</div>
                <div className="ml-auto hidden sm:block">
                  <span className="flex">
                    <p>Devices:</p>
                    <button
                      className={`hover:text-awst ml-1 flex h-7 w-7 items-center justify-center rounded-full border ${
                        activeDevice === "phone"
                          ? "bg-blue-500 text-white hover:text-white"
                          : "text-awst bg-white"
                      }`}
                      onClick={() => handleDeviceChange("phone")}
                    >
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.709 0H17.29a1.326 1.326 0 0 1 1.324 1.323v21.354a1.326 1.326 0 0 1-1.323 1.324H6.708a1.327 1.327 0 0 1-1.324-1.324V1.323A1.326 1.326 0 0 1 6.71 0Zm4.112 21.883h2.359a.544.544 0 0 1 0 1.086H10.82a.545.545 0 0 1-.543-.543c0-.299.245-.543.543-.543Zm-4.234-1.032h10.826V3.15H6.587V20.85ZM16.89 1.308a.267.267 0 0 0 0 .533h.03a.267.267 0 0 0 0-.533h-.03Zm-9.812 0a.267.267 0 0 0 0 .533h.03a.267.267 0 0 0 0-.533h-.03Zm3.41 0h3.023v.533h-3.024v-.533Z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                    <button
                      className={`hover:text-awst mx-2 flex h-7 w-7 items-center justify-center rounded-full border ${
                        activeDevice === "tab"
                          ? "bg-blue-500 text-white hover:text-white"
                          : "text-awst bg-white"
                      }`}
                      onClick={() => handleDeviceChange("tab")}
                    >
                      <Tablet className="h-4 w-4" />
                    </button>
                    <button
                      className={`hover:text-awst flex h-7 w-7 items-center justify-center rounded-full border ${
                        activeDevice === "pc"
                          ? "bg-blue-500 text-white hover:text-white"
                          : "text-awst bg-white"
                      }`}
                      onClick={() => handleDeviceChange("pc")}
                    >
                      <Laptop className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center px-4">
                <PostPreview
                  name={currentUser?.name || ""}
                  content={wp.editorContent}
                  likes={post?.likes || 0}
                  comments={post?.comments || 0}
                  reposts={post?.reposts || 0}
                  isExpanded={isExpanded}
                  toggleContent={toggleContent}
                  contentStyle={contentStyle}
                  editorContent={editorContent}
                  imageSrc={imageSrc}
                  fileInfo={fileInfo}
                  onDelete={handleRemoveImage}
                />

                <ScheduleDialog
                  open={isModalShowDay}
                  onClose={() => {
                    setIsModalShowDay(false);
                  }}
                  onDateTimeChange={(v: string) => {
                    /* handled in hook */
                  }}
                  onUpdate={handleUpdateFromScheduleDialog}
                  appId={appId}
                />

                <PostNowDialog
                  open={isModalPostNow}
                  onClose={() => setIsModalPostNow(false)}
                  onUpdate={handlePostNow}
                  appId={appId}
                />

                <AddImageDialog
                  open={isModalAddImage}
                  onClose={() => setIsModalAddImage(false)}
                  handleImageChange={async (
                    img: string,
                    cloudFileId?: number
                  ) => {
                    setIsModalAddImage(false);
                    setImageSrc(img);
                    if (cloudFileId) {
                      setFileInfo({ id: cloudFileId });
                    }
                    await handleSaveDraft(img);
                  }}
                />

                <UploadFileDialog
                  open={isModalUploadFile}
                  onClose={() => setIsModalUploadFile(false)}
                />

                <UploadVideoDialog
                  open={isModalAddVideo}
                  onClose={async (f: any) => {
                    setFileInfo(f);
                    setIsModalAddVideo(false);
                    await handleSaveDraft();
                  }}
                />

                <PickDraftDialog
                  open={isModalPickDraft}
                  onClose={() => setIsModalPickDraft(false)}
                  onEditAndPost={handleEditAndPostFromDialog}
                />

                <EmojiDialog
                  open={isModalEmoji}
                  onClose={() => setIsModalEmoji(false)}
                  onSelectEmoji={handleSelectEmojiFromDialog}
                />

                <FormatPostDialog
                  open={isModalFormatPost}
                  onOpen={() => setIsModalFormatPost(true)}
                  onClose={() => setIsModalFormatPost(false)}
                  onGetValue={(v: string) => setEditorContent(v)}
                  formatContent={formatContent}
                  onCopy={handleCopyToWritePage}
                  onRetry={formatContent}
                />

                <DeletePostDialog
                  open={isModalDeletePost}
                  onClose={() => setIsModalDeletePost(false)}
                  id={post.id}
                  onDeleteComplete={(success: boolean) => {
                    if (success) {
                      showToast("Post has been deleted", "success");
                      setIsModalDeletePost(false);
                      router.push(`/write/0`).then(() => router.reload());
                    } else {
                      showToast("Failed to delete post", "error");
                    }
                  }}
                />

                <ModalAccount
                  showModal={showModalAccounts}
                  onClose={() => setShowModalAccounts(false)}
                />
                <ModalUpgrade
                  isOpen={isModalUpgradeOpen}
                  onClose={() => setIsModalUpgradeOpen(false)}
                />

                <TwitterCharacterLimitDialog
                  open={showTwitterDialog}
                  onClose={() => setShowTwitterDialog(false)}
                  content={editorContent}
                  characterCount={twitterCharacterCount}
                  onProceed={() => {
                    setShowTwitterDialog(false);
                    handlePostNow();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
};

WritePage.PageWrapper = PageWrapper;
export default WritePage;
