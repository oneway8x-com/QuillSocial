import PluginComment from "./PluginComment";
import ModalUpgrade from "@quillsocial/features/payments/ModalUpgrade";
import { TWITTER_APP_ID } from "@quillsocial/lib/constants";
import { Dialog, DialogContent, DialogFooter, Switch } from "@quillsocial/ui";
import { Button, showToast } from "@quillsocial/ui";
import { useState } from "react";

export type PluginState = {
  time: string;
  timeType: string;
  comment: string;
};

interface PostNowDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (pluginData?: PluginState) => void;
  appId?: string;
}

export const PostNowDialog: React.FC<PostNowDialogProps> = ({
  open,
  onClose,
  onUpdate,
  appId,
}) => {
  const [isDisabledButton, setIsDisabledButton] = useState(false);
  const [isModalUpgradeOpen, setIsModalUpgradeOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isEmojiModal, setIsEmojiModal] = useState(false);
  const [plugin, setPlugin] = useState({
    time: "",
    timeType: "",
    comment: "",
  });

  // Check if plugin comments are supported for this app
  const isPluginCommentSupported = appId === TWITTER_APP_ID;

  const handleDialogClose = () => {
    if (onClose) {
      onClose();
    }
  };
  const handleUpdate = () => {
    if (isChecked) {
      if (plugin.comment === "") {
        showToast("Please add your comment", "error");
        return;
      }
      if (plugin.time === "") {
        showToast("Please select time post after", "error");
        return;
      }
    }

    setIsDisabledButton(true);
    setTimeout(() => {
      setIsDisabledButton(false);
    }, 9000);

    if (onUpdate) {
      onUpdate(isChecked ? plugin : undefined);
    }
  };

  const handleSchelduleAfterChange = ({
    time,
    timeType,
    comment,
  }: {
    time: string;
    timeType: string;
    comment: string;
  }) => {
    setPlugin({
      time: time,
      timeType: timeType,
      comment: comment,
    });
  };
  return (
    <>
      <Dialog open={open}>
        <DialogContent className="w-[520px]">
          <div className="font-bold">Publish Post</div>
          <div className="flex w-full justify-end">
            <div
              onClick={handleDialogClose}
              className="mr-[-23px] mt-[-45px] flex h-[40px] w-[40px] items-center justify-center rounded-full border-none bg-white text-center text-red-700 hover:cursor-pointer hover:border-none hover:bg-red-100 focus:border-none"
            >
              X
            </div>
          </div>
          <div className="mt-3 text-center">
                      <div className="flex flex-col items-start justify-start">
            <span className="font-medium">Post Settings</span>
            <span className="text-sm">
              These settings will affect this post only.
            </span>
          </div>
          {isPluginCommentSupported && (
            <div className="mt-2 flex">
              <Switch
                checked={isChecked}
                onClick={() => {
                  setIsChecked(!isChecked);
                }}
              />
              <div className="flex flex-col items-start justify-start pl-4 pt-3 text-sm">
                <p className="font-semibold">{"Auto plug(comment)"}</p>
                <p className="text-left">
                  {" "}
                  Automatically add the first comment to your post.
                </p>
              </div>
            </div>
          )}
          {isChecked && (
              <PluginComment
                isModalEmoji={isEmojiModal}
                setIsModalEmoji={setIsEmojiModal}
                onPluginAfterChange={(value) =>
                  handleSchelduleAfterChange({ ...value })
                }
              />
            )}
          </div>
          <DialogFooter className="flex items-center justify-end">
            <Button
              disabled={isDisabledButton}
              type="submit"
              className="text-white"
              onClick={handleUpdate}
            >
              Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <>
        <ModalUpgrade
          isOpen={isModalUpgradeOpen}
          onClose={() => setIsModalUpgradeOpen(false)}
        />
      </>
    </>
  );
};
