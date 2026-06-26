import { Dialog, Transition } from "@headlessui/react";
import useMeQuery from "@lib/hooks/useMeQuery";
import { FileEvent } from "@lib/types/FileEvent";
import dayjs from "@quillsocial/dayjs";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { BillingType } from "@quillsocial/prisma/enums";
import { trpc } from "@quillsocial/trpc/react";
import { Post } from "@quillsocial/types/Posts";
import { Button, TextAreaField } from "@quillsocial/ui";
import {
  Dialog as AccessDialog,
  DialogContent,
  DialogFooter,
  showToast,
} from "@quillsocial/ui";
import { useRouter } from "next/router";
import { Fragment, useState, useEffect } from "react";

const tabs = [
  { name: "Write", href: "#", current: true },
  { name: "Grow", href: "#", current: false },
];

interface SlideOverProps {
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  data: Post;
}

type UseFileReaderProps = {
  method: ReadAsMethod;
  onLoad?: (result: unknown) => void;
};

type ReadAsMethod =
  | "readAsText"
  | "readAsDataURL"
  | "readAsArrayBuffer"
  | "readAsBinaryString";

const useFileReader = (options: UseFileReaderProps) => {
  const { method = "readAsText", onLoad } = options;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DOMException | null>(null);
  const [result, setResult] = useState<string | ArrayBuffer | null>(null);

  useEffect(() => {
    if (!file && result) {
      setResult(null);
    }
  }, [file, result]);

  useEffect(() => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => setLoading(true);
    reader.onloadend = () => setLoading(false);
    reader.onerror = () => setError(reader.error);

    reader.onload = (e: ProgressEvent<FileReader>) => {
      setResult(e.target?.result ?? null);
      if (onLoad) {
        onLoad(e.target?.result ?? null);
      }
    };
    reader[method](file);
  }, [file, method, onLoad]);

  return [{ result, error, file, loading }, setFile] as const;
};

const PostDetail: React.FC<SlideOverProps> = ({ open, setOpen, data }) => {
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [modalShowDay, setModalShowDay] = useState(false);
  const [isPostNow, setPostNow] = useState(false);
  const [isUpdate, setUpdate] = useState(false);
  const [isLoadButtonSave, setIsLoadButtonSave] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isModalUpgrade, setIsModalUpgrade] = useState(false);
  const [newData, setNewData] = useState<Post>({ ...data });
  const router = useRouter();
  const { t } = useLocale();

  const query = useMeQuery();
  const user = query.data;

  useEffect(() => {
    setNewData({ ...data });
  }, [data]);

  const [{ result }, setFile] = useFileReader({
    method: "readAsDataURL",
  });

  // const currentBillingQuery = trpc.viewer.billings.getCurrentUserBilling.useQuery();
  // const getCountSocial = trpc.viewer.socials.getSocialConditionsForBilling.useQuery();

  const handleContentChange = (event: any) => {
    const newContent = event.target.value;
    setNewData((prevData) => ({ ...prevData, content: newContent }));
    if (newContent !== data.content) {
      setShowSaveButton(true);
    } else {
      setShowSaveButton(false);
    }
  };

  const handleSave = async () => {
    setIsLoadButtonSave(true);
    const rs = await sendProcessedPosts();
    if (rs) {
      showToast("The data was saved", "success");
      setOpen(true);
      setShowSaveButton(false);
      setIsLoadButtonSave(false);
    } else {
      showToast("Error when updating", "error");
    }
  };

  const handleDateTimeChange = (event: any) => {
    const utcDateTimeValue = new Date(event.target.value).toISOString();
    setSelectedDateTime(utcDateTimeValue);
  };

  const sendProcessedPosts = async (key?: string, newFileData?: any) => {
    let requestBody: { data: any; time?: any; key?: string } = {
      data: newData,
    };
    if (key) {
      requestBody.key = key;
    } else {
      setUpdate(true);
      requestBody.time = selectedDateTime;
    }
    if (newFileData) {
      requestBody.data.imagesDataURL = [newFileData];
    }
    const response = await fetch(`/api/posts/updateContent`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    let check: any = { ok: response.ok };
    if (!response.ok) {
      const errorStatus = await response.json();
      showToast(errorStatus.message, "error");
      console.error("Failed to update data");
      setModalShowDay(false);
    } else {
      if (!newFileData) {
        setOpen(false);
        const responseData = await response.json();
        check = { ...check, ...responseData };
        if (check.ok === 0) {
          setPostNow(false);
        } else {
          setModalShowDay(false);
          setUpdate(false);
        }
      } else {
        showToast("Save image data successfully!", "success");
      }
    }
    return check.ok === true;
  };

  const handlePostNow = async (id: number) => {
    setPostNow(true);
    const urlSocial = user?.currentSocialProfile.appId.replace(/-/g, "");
    const response = await fetch(
      `/api/integrations/${urlSocial}/post?id=${id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      console.error("Failed to send data");
    } else {
      const rs = await sendProcessedPosts("now");
      if (rs) {
        router.reload();
        showToast("The post has been posted!", "success");
      } else {
        showToast("Error when Posting", "error");
        setPostNow(false);
      }
    }
  };

  const onInputFile = async (e: FileEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) {
      return;
    }

    const limit = 5 * 1000000; // max limit 5mb
    const file = e.target.files[0];

    if (file.size > limit) {
      showToast(t("image_size_limit_exceed"), "error");
    } else {
      setFile(file);
      if (result) {
        await sendProcessedPosts(undefined, result);
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedDateTime) {
      showToast("Please select Date time", "error");
    } else {
      // if (checkCondition?.month) {
      //   if (checkCondition?.month === Infinity) {
      const rs = await sendProcessedPosts();
      if (rs) {
        router.reload();
        showToast("The post was scheduled successfully", "success");
      } else {
        showToast("Error when scheduled", "error");
        setUpdate(false);
      }
      setSelectedDateTime("");
      // } else {
      //   const month = checkCondition?.month;
      //   const isMonthValid = isWithinMonthLimit(selectedDateTime, month);
      //   if (isMonthValid) {
      //     const rs = await sendProcessedPosts();
      //     if (rs) {
      //       router.reload();
      //       showToast("The post was scheduled successfully", "success");
      //     } else {
      //       showToast("Error when scheduled", "error");
      //       setUpdate(false);
      //     }
      //     setSelectedDateTime("");
      //   } else {
      //     setIsModalUpgrade(true);
      //     showToast(
      //       `Please select a date and time that does not exceed ${month} month in the future or update subscription plan`,
      //       "error"
      //     );
      //   }
      // }
      // } else {
      //   setIsModalUpgrade(true);
      //   showToast("Please update subscription plan to use", "error");
      // }
    }
  };

  const isWithinMonthLimit = (selectedDateTime: any, monthLimit: any) => {
    const today = dayjs();
    const selectedDate = dayjs(selectedDateTime);
    const diffInMonths = selectedDate.diff(today, "month");
    return diffInMonths < monthLimit;
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* <div className="border-b border-gray-200 pt-5">
                      <div className="px-6">
                        <nav className="-mb-px flex justify-center gap-24 space-x-6">
                          {tabs.map((tab) => (
                            <a
                              key={tab.name}
                              href={tab.href}
                              className={classNames(
                                tab.current
                                  ? "border-indigo-500 text-indigo-600"
                                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium"
                              )}>
                              {tab.name}
                            </a>
                          ))}
                        </nav>
                      </div>
                    </div> */}
                    <ul
                      role="list"
                      className="flex-1 divide-y divide-gray-200 overflow-y-auto"
                    >
                      <li key={data.id}>
                        <div className="group relative items-center px-5 py-6">
                          <div className="-ml-4 flex items-center gap-x-4">
                            <svg
                              viewBox="0 0 2 2"
                              className="-ml-0.5 h-0.5 w-0.5 flex-none fill-white/50"
                            >
                              <circle cx={1} cy={1} r={1} />
                            </svg>
                            <div className="flex gap-x-2.5">
                              <img
                                src={data.avatarUrl}
                                alt=""
                                className="h-12 w-12 flex-none rounded-full bg-white/10"
                              />
                              <div className="mt-[7px] gap-3 text-xs">
                                <p className="font-bold">{data.name}</p>
                                <p className="text-gray-500">
                                  {data.emailOrUserName}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* <h3 className="mt-3 text-left text-sm">
                            <a>
                              <span className="absolute inset-0" />
                              {data.content}
                            </a>
                          </h3> */}
                        </div>
                        <div className="mt-[-13px] px-4">
                          <TextAreaField
                            id="content"
                            name="content"
                            rows={8}
                            placeholder="..."
                            label=""
                            className="disabled:bg-emphasis border-none pb-9 focus:border-none"
                            defaultValue={data.content}
                            onChange={handleContentChange}
                            required
                          />
                        </div>
                        <div>
                          {showSaveButton && (
                            <div className="mt-5 flex px-4">
                              <Button
                                disabled={isLoadButtonSave}
                                className="ml-auto"
                                onClick={handleSave}
                              >
                                Save
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="isolate mt-1 flex justify-center gap-2">
                          {/* <div className="button-container">
                            <button
                              className={`button hover:scale-125`}
                              onClick={handleButtonClick}
                              data-popover-target="popover-default">
                              <Circle className="h-full w-full" />
                            </button>
                          </div> */}
                          <div className="button-container">
                            <input
                              type="file"
                              onChange={onInputFile}
                              name="imageLoader"
                              className="block h-7 w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
                              accept="image/*"
                            />

                            {/* <div className="flex w-full items-center justify-center">
                              <label className="hover:bg-gray- flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3">
                                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                  <svg
                                    className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16">
                                    <path
                                      stroke="currentColor"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                  </svg>
                                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    SVG, PNG, JPG or GIF
                                  </p>
                                </div>
                                <input
                                  id="dropzone-file"
                                  type="file"
                                  accept="image/*"
                                  multiple={false}
                                  onChange={onInputFile}
                                  className="hidden"
                                />
                              </label>
                            </div> */}
                          </div>
                          {/* <div className="button-container">
                            <button
                              className={`button hover:scale-125`}
                              onClick={handleButtonClick}
                              data-popover-target="popover-default">
                              <Plus className="h-full w-full" />
                            </button>
                          </div> */}
                        </div>
                        <div className="mt-4 flex justify-center space-x-4">
                          <Button
                            onClick={() => setModalShowDay(true)}
                            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                          >
                            Schedule for day
                          </Button>
                          <Button
                            onClick={() => handlePostNow(data.id)}
                            disabled={isPostNow}
                            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                          >
                            Post Now
                          </Button>
                        </div>
                        <AccessDialog open={modalShowDay}>
                          <DialogContent className="w-[520px]">
                            <div className="flex w-full justify-end">
                              <div
                                onClick={() => {
                                  setModalShowDay(false);
                                  setSelectedDateTime("");
                                }}
                                className="mr-[-23px] mt-[-25px] flex h-[40px] w-[40px] items-center justify-center rounded-full border-none bg-white text-center text-red-700 hover:cursor-pointer hover:border-none hover:bg-red-100 focus:border-none"
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
                                  onChange={handleDateTimeChange}
                                />
                              </div>
                            </div>
                            <DialogFooter className="flex items-center justify-end">
                              <Button
                                disabled={isUpdate}
                                type="submit"
                                className="text-white"
                                onClick={handleUpdate}
                              >
                                OK
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </AccessDialog>
                        <AccessDialog
                          open={isModalUpgrade}
                          onOpenChange={setIsModalUpgrade}
                        >
                          <DialogContent>
                            <div>
                              <div className="flex items-center justify-center">
                                <div className="text-center text-[20px] font-bold">
                                  Upgrade
                                </div>
                              </div>
                              <div className="text-default mt-10 text-center text-[16px]">
                                <p>
                                  Please upgrade your subscription plan to use.
                                </p>
                              </div>
                            </div>
                            <DialogFooter className=" mt-6 flex items-center justify-center">
                              <Button
                                className="bg-default hover:bg-awstbgbt hover:text-awst text-awst"
                                onClick={() => setIsModalUpgrade(false)}
                              >
                                Close
                              </Button>
                              <Button
                                type="submit"
                                className="text-white"
                                onClick={() => router.push("/billing/overview")}
                              >
                                Upgrade
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </AccessDialog>
                      </li>
                    </ul>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default PostDetail;
