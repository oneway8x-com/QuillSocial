import PluginComment from "./PluginComment";
import ModalUpgrade from "@quillsocial/features/payments/ModalUpgrade";
import { TWITTER_APP_ID } from "@quillsocial/lib/constants";
import { BillingType } from "@quillsocial/prisma/enums";
import { trpc } from "@quillsocial/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  Switch,
  TextAreaField,
  TextArea,
  TextField,
  Input,
  Select,
} from "@quillsocial/ui";
import { Button, showToast, HeadSeo } from "@quillsocial/ui";
import { useEffect, useMemo, useState } from "react";

export type PluginType = {
  time: string;
  timeType: string;
  comment: string;
};

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onDateTimeChange: (value: string) => void;
  onUpdate: (pluginData?: PluginType) => void;
  appId?: string;
}

export const ScheduleDialog: React.FC<ScheduleDialogProps> = ({
  open,
  onClose,
  onDateTimeChange,
  onUpdate,
  appId,
}) => {
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [isDisabledButton, setIsDisabledButton] = useState(false);
  const [isModalUpgradeOpen, setIsModalUpgradeOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isEmojiModal, setIsEmojiModal] = useState(false);
  const [plugin, setPlugin] = useState({
    time: "",
    timeType: "",
    comment: "",
  });

  const currentBillingQuery =
    trpc.viewer.billings.getCurrentUserBilling.useQuery();
  const getCountSocial =
    trpc.viewer.socials.getSocialConditionsForBilling.useQuery();
  // const checkCondition = getConditionToUpgrade(
  //   getCountSocial.data,
  //   currentBillingQuery.data?.type ?? BillingType.FREE_TIER
  // );

  // Check if plugin comments are supported for this app
  const isPluginCommentSupported = appId === TWITTER_APP_ID;
  console.log(appId, TWITTER_APP_ID);
  const handleDialogClose = () => {
    if (onClose) {
      onClose();
      setSelectedDateTime("");
    }
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateTimeChange) {
      const { value } = e.target;
      setSelectedDateTime(value);
      onDateTimeChange(value);
    }
  };

  const handleUpdate = () => {
    if (!selectedDateTime) {
      showToast("Please select a date", "error");
      return;
    }
    // else {
    //   const month = checkCondition?.month;
    //   const isMonthValid = isWithinMonthLimit(selectedDateTime, month);
    //   if (!isMonthValid) {
    //     setIsModalUpgradeOpen(true);
    //     showToast(
    //       `Please select a date and time that does not exceed ${month} month in the future or update subscription plan`,
    //       "error"
    //     );
    //     return;
    //   }
    // }

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
          <div className="font-bold">Schedule Post</div>
          <div className="flex w-full justify-end">
            <div
              onClick={handleDialogClose}
              className="mr-[-23px] mt-[-45px] flex h-[40px] w-[40px] items-center justify-center rounded-full border-none bg-white text-center text-red-700 hover:cursor-pointer hover:border-none hover:bg-red-100 focus:border-none"
            >
              X
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="flex flex-col">
              <input
                className="appearance-none rounded-lg border border-gray-300 focus:border-b-2 focus:border-blue-500 focus:ring-blue-500"
                type="datetime-local"
                name="partydate"
                value={selectedDateTime}
                onChange={handleDateTimeChange}
              />
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
              Schedule Now
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
