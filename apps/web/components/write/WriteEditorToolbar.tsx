import React from "react";
import { Copy, AlignStartVertical, Image, Paperclip, Video, Twitter } from "lucide-react";
import { Smile } from "lucide-react";
import { DropdownReWriteAI } from "@components/write/DropdownReWriteAI";
import { Tooltip as ReactTooltip } from "react-tooltip";
import SocialAvatar from "@quillsocial/features/shell/SocialAvatar";

type Props = {
  editorContent: string;
  onRewrite: (instruction: any) => Promise<any>;
  onOpenEmoji: () => void;
  onOpenPickDraft: () => void;
  onOpenFormatPost: () => void;
  onOpenAddImage: () => void;
  onOpenAddVideo: () => void;
  onOpenUploadFile: () => void;
  onCopyToWritePage: (c: string) => void;
  currentUser?: { appId?: string; avatarUrl?: string } | null;
  hasAI: boolean;
  onOpenAccounts?: () => void;
};

export default function WriteEditorToolbar({
  editorContent,
  onRewrite,
  onOpenEmoji,
  onOpenPickDraft,
  onOpenFormatPost,
  onOpenAddImage,
  onOpenAddVideo,
  onOpenUploadFile,
  onCopyToWritePage,
  currentUser,
  hasAI,
  onOpenAccounts,
}: Props) {
  return (
    <div className="flex h-[43px] items-center gap-2 border-b border-r bg-white px-2 shadow-sm ">
      <ReactTooltip content="Emoji" id="emoji" place="top" />
      <div data-tooltip-id="rewriteAI">
        <DropdownReWriteAI content={editorContent} rewriteAction={onRewrite} onCopyToWritePage={onCopyToWritePage} hasAI={hasAI} />
      </div>
      <ReactTooltip content="Rewrite with AI" id="rewriteAI" place="top" />
      <button data-tooltip-id="emoji" onClick={onOpenEmoji} className="hover:bg-awst flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm hover:text-white">
        <Smile />
      </button>
      <button data-tooltip-id="pickDraft" onClick={onOpenPickDraft} className="hover:bg-awst flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm hover:text-white">
        <Copy className="h-5 w-5" />
      </button>
      <ReactTooltip content="Pick a Draft" id="pickDraft" place="top" />
      <button data-tooltip-id="formatPost" onClick={onOpenFormatPost} className="hover:bg-awst flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm hover:text-white">
        <AlignStartVertical className="h-5 w-5" />
      </button>
      <ReactTooltip content="Format Post" id="formatPost" place="top" />
      <button data-tooltip-id="addImage" onClick={onOpenAddImage} className="hover:bg-awst flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm hover:text-white">
        <Image className="h-5 w-5" />
      </button>
      <ReactTooltip content="Add Image" id="addImage" place="top" />
      <button data-tooltip-id="addVideo" onClick={onOpenAddVideo} className="hover:bg-awst flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm hover:text-white">
        <Video className="h-5 w-5" />
      </button>
      <ReactTooltip content="Add Video" id="addVideo" place="top" />
      <button data-tooltip-id="convertTwitter" onClick={() => onRewrite("convertTwitter")} className="hover:bg-awst flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm hover:text-white">
        <Twitter className="h-5 w-5" />
      </button>
      <ReactTooltip content="Convert Twitter Post" id="convertTwitter" place="top" />
      <button onClick={onOpenUploadFile} className="hover:bg-awst flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm hover:text-white">
        <Paperclip className="h-5 w-5" />
      </button>
      {currentUser && (
        <div onClick={() => onOpenAccounts && onOpenAccounts()} className="ml-auto flex cursor-pointer items-center justify-center hover:font-bold">
          <SocialAvatar size="sm" appId={currentUser?.appId!} avatarUrl={currentUser?.avatarUrl!} />
        </div>
      )}
    </div>
  );
}
