import ModalEditOrNewCustom from "./ModalEditOrNew";
import ModalSelectFormat from "./ModalSelectFormat";
import { templatesInfo } from "./constTemplateWrapper";
import InputTemplateCustom from "./constTemplateWrapper";
import { InputData } from "./constTemplateWrapper";
import { getIdFromCode } from "./constTemplateWrapper";
import { fetchAllFormat, fetchFormatRecomand } from "./selectFormat";
import { TWITTER_APP_ID } from "@quillsocial/lib/constants";
import useMeQuery from "@quillsocial/trpc/react/hooks/useMeQuery";
import { router } from "@quillsocial/trpc/server/trpc";
import { Post } from "@quillsocial/types/Posts";
import { Button, ImageUploader, Input, TextAreaField } from "@quillsocial/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  showToast,
} from "@quillsocial/ui";
import { Pencil, Plus, Bookmark, PenLine } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useState } from "react";

interface TemplateProps {
  id: string;
}
enum Tab {
  NewOutput = "newOutput",
  History = "history",
}
const MainTemplate: React.FC<TemplateProps> = ({ id: code }) => {
  const numId = getIdFromCode(code);
  const [items, setItems] = useState(fetchAllFormat());
  const [itemsRecomend, setItemsRecomend] = useState(
    fetchFormatRecomand(numId)
  );
  const [isModalFormatOpen, setIsModalFormatOpen] = useState(false);
  const [isModalNewOrEditOpen, setIsModalNewOrEditOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [format, setFormat] = useState(``);
  const [selectFormat, setSelectFormat] = useState(``);
  const [inputCustomData, setInputCustomData] = useState<InputData>();
  const [isDataValid, setIsDataValid] = useState(false);
  const [activeTab, setActiveTab] = useState(Tab.NewOutput);
  const [isButtonSave, setIsButtonSave] = useState(false);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);

  const [post, setPost] = useState<Post>({
    id: 0,
    idea: "",
    content: "",
    appId: TWITTER_APP_ID,
    credentialId: 0,
    pageId: undefined,
  });

  const { data: user } = useMeQuery();
  useEffect(() => {
    if (
      user?.currentSocialProfile?.credentialId !== null &&
      user?.currentSocialProfile?.credentialId !== undefined
    ) {
      setPost((prevPost) => ({
        ...prevPost,
        credentialId: user?.currentSocialProfile?.credentialId || "",
        appId: user?.currentSocialProfile?.appId!,
        pageId: user?.currentSocialProfile?.pageId,
      }));
    }
  }, [user?.currentSocialProfile?.credentialId]);

  const router = useRouter();
  const handleModalActionReceive = (
    isNew: boolean,
    isEdit: boolean,
    isUse: boolean,
    newItems: { content: string }[]
  ) => {
    if (isNew || isEdit) {
      setIsModalNewOrEditOpen(true);
    } else {
      setSelectFormat(newItems[0]?.content);
    }
    setIsEdit(isEdit);
    setIsNew(isNew);
    setFormat(newItems[0]?.content);
  };

  const handleEdit = () => {
    setIsEdit(true);
    setFormat(selectFormat);
    setIsModalNewOrEditOpen(true);
  };

  const handleReceiveFormat = (value: string) => {
    setSelectFormat(value);
  };

  const handleInputCustomData = (data: InputData) => {
    setInputCustomData(data);
  };

  const checkInputData = (data: InputData | undefined) => {
    if (data && data.input) {
      const allValuesNonNull = data.input.every(
        (item) => item.optional || (item.value !== null && item.value !== "")
      );
      //   if (allValuesNonNull && selectFormat) {
      //     return true;
      //   } else {
      //     return false;
      //   }
      return allValuesNonNull ? true : false;
    } else {
      return false;
    }
  };

  useEffect(() => {
    const valid = checkInputData(inputCustomData);
    setIsDataValid(valid);
  }, [selectFormat, inputCustomData]);

  const handleGenerate = async () => {
    const isDataValid = checkInputData(inputCustomData);
    if (isDataValid) {
      setIsGenerateLoading(true);
      try {
        await getDataOpenAI(code, selectFormat, inputCustomData!);
      } finally {
        setIsGenerateLoading(false);
      }
    } else {
      showToast("Please fill in the form correctly.", "error");
    }
  };

  const getDataOpenAI = async (
    code: string,
    format: string,
    inputs: InputData
  ) => {
    setIsDataValid(false);
    const response = await fetch(`/api/openai/mysticQuill`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        format,
        inputs,
      }),
    });

    if (!response.ok) {
      const errorStatus = await response.json();
      showToast(errorStatus.message, "error");
      console.error(errorStatus);
      setIsDataValid(true);
      return "";
    } else {
      const responseData = await response.json();
      setPost((prevPost) => ({
        ...prevPost,
        content: responseData.post,
      }));
      setIsDataValid(true);
      return responseData.post;
    }
  };

  const handleSaveClick = async () => {
    setIsButtonSave(true);
    const save = await saveDraft();
    if (save) {
      showToast("Saved successfully", "success");
    } else {
      showToast("Error when saving", "error");
    }
    setIsButtonSave(false);
  };

  const saveDraft = async () => {
    const data = {
      id: post.id,
      content: post.content,
      appId: post.appId,
      credentialId: post.credentialId,
      pageId: post.pageId,
    };
    const response = await fetch(`/api/posts/saveDraft`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });

    if (response.ok) {
      const result = await response.json();
      setPost((prevPost) => ({
        ...prevPost,
        id: result.id,
      }));
      return result.id;
    } else {
      return null;
    }
  };

  return (
    <div className="w-full ">
      <div className="grid grid-cols-12 ">
        <div className="col-span-12 flex h-auto flex-col pr-2 sm:col-span-5">
          {/* <div className="text-awst px-2 py-5 font-bold">
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 640 512"
              className="icon-language mr-1 inline-block"
              height="30"
              width="30"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M152.1 236.2c-3.5-12.1-7.8-33.2-7.8-33.2h-.5s-4.3 21.1-7.8 33.2l-11.1 37.5H163zM616 96H336v320h280c13.3 0 24-10.7 24-24V120c0-13.3-10.7-24-24-24zm-24 120c0 6.6-5.4 12-12 12h-11.4c-6.9 23.6-21.7 47.4-42.7 69.9 8.4 6.4 17.1 12.5 26.1 18 5.5 3.4 7.3 10.5 4.1 16.2l-7.9 13.9c-3.4 5.9-10.9 7.8-16.7 4.3-12.6-7.8-24.5-16.1-35.4-24.9-10.9 8.7-22.7 17.1-35.4 24.9-5.8 3.5-13.3 1.6-16.7-4.3l-7.9-13.9c-3.2-5.6-1.4-12.8 4.2-16.2 9.3-5.7 18-11.7 26.1-18-7.9-8.4-14.9-17-21-25.7-4-5.7-2.2-13.6 3.7-17.1l6.5-3.9 7.3-4.3c5.4-3.2 12.4-1.7 16 3.4 5 7 10.8 14 17.4 20.9 13.5-14.2 23.8-28.9 30-43.2H412c-6.6 0-12-5.4-12-12v-16c0-6.6 5.4-12 12-12h64v-16c0-6.6 5.4-12 12-12h16c6.6 0 12 5.4 12 12v16h64c6.6 0 12 5.4 12 12zM0 120v272c0 13.3 10.7 24 24 24h280V96H24c-13.3 0-24 10.7-24 24zm58.9 216.1L116.4 167c1.7-4.9 6.2-8.1 11.4-8.1h32.5c5.1 0 9.7 3.3 11.4 8.1l57.5 169.1c2.6 7.8-3.1 15.9-11.4 15.9h-22.9a12 12 0 0 1-11.5-8.6l-9.4-31.9h-60.2l-9.1 31.8c-1.5 5.1-6.2 8.7-11.5 8.7H70.3c-8.2 0-14-8.1-11.4-15.9z"></path>
            </svg>
            EngLish
          </div> */}
          {/* use input custom template */}
          <div className="w-full">
            <InputTemplateCustom
              number={numId}
              onInputData={handleInputCustomData}
            />
          </div>
          <div className="flex flex-col p-2">
            <div className="text-sm font-medium leading-6 text-gray-900">
              {" "}
              Select Post format
            </div>
            <div className="flex flex-col gap-4">
              {!selectFormat ? (
                <Button
                  onClick={() => {
                    setIsModalFormatOpen(true);
                  }}
                  StartIcon={Plus}
                  className="text-darkgray-200 w-[200px] rounded-xl border bg-white hover:bg-white hover:font-bold"
                >
                  Select a post format
                </Button>
              ) : (
                <div className="flex h-[140px] flex-col truncate rounded-lg border p-4">
                  <div>
                    <div className="my-2 mt-1 text-sm font-bold text-gray-600">
                      {selectFormat.slice(0, 30)}
                    </div>
                    <div className="my-2 mt-1 truncate text-sm font-normal text-gray-600">
                      {selectFormat.slice(30)}
                    </div>
                  </div>
                  <div className="mt-[20px] flex">
                    <Button
                      onClick={handleEdit}
                      StartIcon={Pencil}
                      className="text-awst border-none bg-slate-50 hover:bg-slate-50"
                    >
                      Edit Selected Format{" "}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectFormat(``);
                      }}
                      className="ml-auto border-none bg-slate-50 text-red-600 hover:bg-slate-50"
                    >
                      Remove{" "}
                    </Button>
                  </div>
                </div>
              )}
              <Button
                disabled={!isDataValid}
                onClick={handleGenerate}
                type="button"
                className="inline-flex w-[120px] items-center justify-center gap-2 rounded-full bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 sm:px-4 sm:py-2.5"
              >
                <svg
                  aria-hidden="true"
                  className="-mr-0.5 h-4 w-4  sm:h-5 sm:w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Generate
              </Button>
            </div>
          </div>
          <div>
            <ModalSelectFormat
              isOpen={isModalFormatOpen}
              onClose={() => setIsModalFormatOpen(false)}
              callBackModalAction={handleModalActionReceive}
              items={items}
              setItems={setItems}
              itemsRecomend={itemsRecomend}
              setItemsRecomend={setItemsRecomend}
            />
            <ModalEditOrNewCustom
              open={isModalNewOrEditOpen}
              onOpenChange={setIsModalNewOrEditOpen}
              textToShow={format}
              handleReceiveText={handleReceiveFormat}
              handleIsBack={(value: boolean) => setIsModalFormatOpen(value)}
              isNew={isNew}
              isEdit={isEdit}
            />
          </div>
        </div>
        <div
          className={`col-span-12 mt-10 h-[700px] bg-slate-50 sm:col-span-7 sm:mt-0`}
        >
          {/* Generate Loading Dialog */}
          <Dialog open={isGenerateLoading}>
            <DialogContent className="w-full max-w-md">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold">Generating content</h3>
                  <p className="text-sm text-gray-600">Please wait while we generate content for you...</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex flex-col p-2">
            <span className="font-bold">Output </span>
            <span>
              {" "}
              Here is the Al generated content for you. Feel free to tweak
              before you post it.
            </span>
            {/* <div className="mt-5 border-b border-gray-200 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <ul className="-mb-px flex flex-wrap">
                <li className="me-2">
                  <a
                    className={`inline-block rounded-t-lg border-b-2 py-4 ${activeTab === Tab.NewOutput
                      ? "border-blue-600 text-blue-600"
                      : "hover:border-gray-300 hover:text-gray-600"
                      } `}
                    aria-current="page"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(Tab.NewOutput);
                    }}>
                    New Output
                  </a>
                </li>
                <li className="me-2">
                  <a
                    className={`inline-block rounded-t-lg border-b-2 p-4 ${activeTab === Tab.History
                      ? "border-blue-600 text-blue-600"
                      : "hover:border-gray-300 hover:text-gray-600"
                      } `}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(Tab.History);
                    }}>
                    History
                  </a>
                </li>
              </ul>
            </div> */}
            <div className="mt-5 rounded-lg border p-4  shadow">
              {/* {activeTab === Tab.NewOutput ? ( */}
              <>
                <div className="flex py-3 text-sm font-medium text-gray-500">
                  <span>{post.content.length} characters</span>
                  {/* <span className='ml-auto'>
                                            <button type="button" className="p-1.5 inline-flex items-center justify-center text-gray-500 transition-all duration-150 rounded-full hover:bg-green-200 hover:text-green-600"><span className="sr-only">Like</span><svg aria-hidden="true" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg></button>
                                            <button type="button" className="p-1.5 inline-flex items-center justify-center text-gray-500 transition-all duration-150 rounded-full hover:bg-red-200 hover:text-red-600"><span className="sr-only">Dislike</span><svg aria-hidden="true" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path></svg></button>
                                            </span> */}
                </div>
                <TextAreaField
                  readOnly={true}
                  id="content"
                  name="content"
                  rows={18}
                  placeholder="Describe what you want to write..."
                  label=""
                  defaultValue={post.content}
                  className="w-95% disabled:bg-emphasis border-none bg-slate-50 pb-9 focus:border-none"
                />
              </>
              {/* // ) : (
              //   <div className="h-[450px]"></div>
              // )} */}
              <div className="group relative mt-5 flex w-full gap-2">
                <Button
                  StartIcon={Bookmark}
                  disabled={isButtonSave}
                  className="text-dark hover:bg-awst flex flex-1 items-center justify-center rounded-lg border-2 bg-white text-center hover:text-white"
                >
                  <span onClick={handleSaveClick}>Save</span>
                </Button>
                <Button
                  onClick={async () => {
                    if (post.id === 0) {
                      const getId = await saveDraft();
                      if (getId) {
                        router.push(`/write/${getId}`);
                      }
                    } else {
                      router.push(`/write/${post.id}`);
                    }
                  }}
                  StartIcon={PenLine}
                  className="text-dark  hover:bg-awst flex flex-1 items-center justify-center rounded-lg border-2 bg-white text-center hover:text-white"
                >
                  {" "}
                  Edit
                </Button>
                {/* <Button className="text-dark hover:bg-awst flex flex-1 items-center justify-center rounded-lg border-2 bg-white hover:text-white">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-tally-4">
                      <path d="M4 4v16" />
                      <path d="M9 4v16" />
                      <path d="M14 4v16" />
                      <path d="M19 4v16" />
                    </svg>
                  </span>
                  <span className="ml-2">Generate carousel</span>{" "}
                </Button> */}
              </div>
            </div>
            {/* <div className="">
              <Button
                type="button"
                className=" shadow-xs group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-gray-600 ring-1 ring-inset ring-gray-300 transition-all duration-150 hover:bg-gray-50 hover:text-gray-900 sm:px-4 sm:py-2.5">
                <svg
                  aria-hidden="true"
                  className="-ml-0.5 h-5 w-5 text-gray-400 transition-all duration-150 group-hover:text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                    clipRule="evenodd"></path>
                </svg>
                Generate more posts
              </Button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainTemplate;
