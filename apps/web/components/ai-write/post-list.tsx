import { Pagination } from "./Pagination";
import PostDetail from "./post-detail";
import TopicSuggestions from "./topic-suggestions";
import useMeQuery from "@lib/hooks/useMeQuery";
import dayjs from "@quillsocial/dayjs";
import SocialAvatar from "@quillsocial/features/shell/SocialAvatar";
import { TWITTER_APP_ID, WEBAPP_URL } from "@quillsocial/lib/constants";
import { trpc } from "@quillsocial/trpc/react";
import { Post } from "@quillsocial/types/Posts";
import { Button, showToast } from "@quillsocial/ui";
import { Dialog, DialogContent } from "@quillsocial/ui";
import { debounce } from "lodash";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

function PostList() {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [credentialId, setCredentialId] = useState();
  const [appId, setAppId] = useState("linkedin-social");
  const [post, setPost] = useState<Post>({
    id: 0,
    idea: "",
    content: "",
    appId: "linkedin-social",
  });
  const itemsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);

  const query = useMeQuery();
  const user = query.data;
  const router = useRouter();

  const { isLoading: ischeckForAIAppsLoading, data: isAIPresent } =
    trpc.viewer.appsRouter.checkForAIApps.useQuery();

  useEffect(() => {
    if (
      user?.currentSocialProfile?.credentialId !== null &&
      user?.currentSocialProfile?.credentialId !== undefined
    ) {
      setCredentialId(user?.currentSocialProfile?.credentialId);
    }
    // setAppId(user?.currentSocialProfile?.appId!);
  }, [user?.currentSocialProfile?.credentialId]);

  const handleKeyDown = async (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // Handle custom behavior for Enter key
      await generatePosts(appId, idea);
    }
  };

  const generatePosts = async (appId: string, idea: string) => {
    if (!ischeckForAIAppsLoading && !isAIPresent) {
      showToast(
        "Please install ChatGPT app from Apps menu to use this feature",
        "error"
      );
      router.push(`/settings/my-account/app-integrations`);
      return;
    }
    if (!idea) {
      showToast("Please key in your idea!", "warning");
      return;
    }

    setIsLoading(true);
    const response = await fetch(`/api/openai/ai-write`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: appId?.replace("-social", "") ?? "linkedin", // replace with your type
        idea: idea,
      }),
    });
    const data = await response.json();

    if (typeof data === "object" && data !== null) {
      const { posts, topics, tokens } = data;
      setTopics(topics);
      const newPosts = processPostData(posts);
      await sendProcessedPosts(newPosts, tokens);
    }
    setIsLoading(false);
  };

  const processPostData = (posts: any) => {
    const processedPosts = posts?.reduce(
      (accumulator: any, post: any, index: number) => {
        const cleanContent = post.replace(/^(\d+)\.\s/, "").replace(/"/g, "");
        if (cleanContent.trim() !== "") {
          accumulator.push({
            idea,
            content: cleanContent,
            avatarUrl: user?.currentSocialProfile?.avatarUrl,
            name: user?.currentSocialProfile?.name || user?.name,
            emailOrUserName: user?.currentSocialProfile?.emailOrUserName || "-",
            credentialId: user?.currentSocialProfile?.credentialId,
            createdDate: new Date(),
            appId,
            pageId: user?.currentSocialProfile?.pageId,
          });
        }
        return accumulator;
      },
      []
    );

    return processedPosts ?? [];
  };

  const sendProcessedPosts = async (newPost: any, tokens: any) => {
    try {
      const response = await fetch(`/api/posts/saveContent`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: newPost, idea, tokens }),
      });
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.lastRecords) {
          const createdPosts: Post[] = responseData.lastRecords.map(
            (x: any) => ({
              ...x,
              emailOrUserName:
                x.credential?.emailOrUserName ||
                user?.currentSocialProfile?.emailOrUserName ||
                "-",
              id: x.id,
              avatarUrl: x.credential.avatarUrl,
              name: x.credential.name,
            })
          );
          const updatedAllPosts = [...allPosts];
          updatedAllPosts.unshift(...createdPosts);
          setAllPosts(updatedAllPosts);
          // setProcessedPosts((prevAllPosts) => [...createdPosts, ...prevAllPosts]);
        } else {
          console.error("No data returned from the server");
          showToast("No data returned from the server", "error");
        }
      } else {
        const errorText = await response.text();
        showToast(`Failed to save post: ${errorText}`, "error");
      }
    } catch (err) {
      showToast("An error occurred while saving the post.", "error");
      console.error(err);
    }
  };

  const debouncedApiCall = useMemo(() => {
    return debounce(async () => {
      if (credentialId !== null) {
        const response = await fetch(
          `/api/posts/getAll?credentialId=${credentialId}`,
          {
            credentials: "include",
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          console.error("Failed to get data");
        }
        const dataResponse = await response.json();
        setIsLoading(false);
        if (typeof dataResponse === "object" && dataResponse !== null) {
          const { data } = dataResponse;
          if (Array.isArray(data)) {
            const postsFromDb = data.map((x: any) => {
              return {
                id: x.id,
                idea: x.idea,
                topic: x.idea,
                content: x.content,
                image: x.imagesDataURL,
                avatarUrl: x.credential?.avatarUrl,
                name: x.credential?.name,
                emailOrUserName: x.credential?.emailOrUserName,
                credentialId: x.credential?.id,
                createdDate: x.createdDate,
                pageId: x.pageId,
                appId: x.appId,
              };
            });
            setAllPosts(postsFromDb);
          } else {
            console.error("Data is not an array:", data);
            setAllPosts([]);
          }
        }
      }
    }, 150);
  }, [credentialId]);

  useEffect(() => {
    if (credentialId !== null) {
      setIsLoading(true);
      debouncedApiCall();
    }
  }, [debouncedApiCall, credentialId]);

  const openSlideOverWithData = (post: Post) => {
    setPost(post);
    setIsSlideOverOpen(true);
  };

  const handleTopicClick = (idea: any) => {
    setIdea(idea);
    generatePosts(appId, idea);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    const totalPages = Math.ceil(allPosts.length / itemsPerPage);
    setTotalPages(totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = allPosts.slice(startIndex, endIndex);
    setDisplayedPosts(currentItems);
  }, [allPosts, currentPage]);

  return (
    <>
      <div className="flex items-center justify-center pt-10 text-6xl font-bold">
        <p>What will you</p>&nbsp;
        <p className="bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
          write today?
        </p>
      </div>
      <div className="pt-5 text-center text-xl font-medium text-neutral-500">
        Your AI assistant is ready to create 💡
      </div>
      {/* <div className="mt-10 flex gap-2.5 sm:ml-[100px] md:ml-[300px]">
        <button className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow transition-all duration-200 ease-in-out hover:bg-gray-100 hover:text-indigo-500">
          <MessageSquare />
          Single
        </button>
        <button className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow transition-all duration-200 ease-in-out hover:bg-gray-100 hover:text-indigo-500">
          <MessagesSquare />
          Thread
        </button>
      </div> */}
      <div className="items-center justify-center">
        <div className="pb-5">
          <div className="mx-auto mt-5 flex  h-12 rounded-xl border border-gray-200 shadow sm:w-auto md:w-[500px]">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              {/* <select
                className="block w-full rounded-none rounded-l-xl border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                defaultValue="Try business or the future of employment">
                <option>United States</option>
                <option>Canada</option>
                <option>Mexico</option>
              </select> */}
              <input
                type="text"
                name="text"
                id="text"
                value={idea}
                onChange={($event) => setIdea($event.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Your idea"
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              type="button"
              onClick={() => generatePosts(appId, idea)}
              disabled={isLoading}
              className="bg-size-200 bg-pos-0 hover:bg-pos-100 relative -ml-px gap-x-1.5 rounded-r-xl bg-gradient-to-br from-blue-300 via-indigo-500 to-indigo-500 px-3 py-2  pl-[10px] text-base font-medium text-white shadow-md transition-all duration-500 hover:scale-105 hover:from-blue-400 hover:via-blue-200 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 sm:block sm:text-lg"
            >
              {isLoading ? "..." : "Generate Ideas"}
            </button>
          </div>
          {topics && topics.length !== 0 && (
            <>
              <div className="mb-2.5 mt-5 flex justify-center text-center text-sm text-gray-500">
                Topic ideas
              </div>
              <div className="mb-2.5 mt-5 flex justify-center gap-3 text-center text-sm text-gray-500">
                {topics.map((topic) => (
                  <Button
                    onClick={() => handleTopicClick(topic)}
                    className="inline-flex items-center rounded-full border border-none
                   border-transparent bg-slate-100 px-4 py-2 text-xs font-medium text-slate-800 shadow-sm hover:border-none hover:bg-slate-50 hover:text-indigo-500
                    hover:shadow-md hover:outline-none"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    {topic}
                  </Button>
                ))}
              </div>
            </>
          )}
          <div className="mx-auto mb-5 mt-5 grid max-w-2xl auto-rows-fr grid-cols-1 gap-8 sm:mt-20  lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {displayedPosts.map((post) => (
              <article
                key={post?.id}
                onClick={() => router.push(`/write/${post?.id}`)}
                // onClick={() => openSlideOverWithData(post)}
                className="relative isolate flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white px-8 py-8  shadow "
              >
                <div className="-ml-4 flex items-center gap-x-4">
                  <svg
                    viewBox="0 0 2 2"
                    className="-ml-0.5 h-0.5 w-0.5 flex-none fill-white/50"
                  >
                    <circle cx={1} cy={1} r={1} />
                  </svg>
                  <div className="flex gap-x-2.5">
                    <SocialAvatar
                      size="mdLg"
                      appId={user?.currentSocialProfile?.appId}
                      avatarUrl={user?.currentSocialProfile?.avatarUrl}
                    />
                    {/* <img
                      src={post.avatarUrl}
                      alt=""
                      className="h-12 w-12 flex-none rounded-full bg-white/10"
                    /> */}
                    <div className="mt-[7px] text-xs">
                      <p className="font-bold">{post.name}</p>
                      <p className="text-gray-500">@{post.emailOrUserName}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 max-h-[250px] overflow-y-auto text-left text-sm">
                  <span
                    className=""
                    dangerouslySetInnerHTML={{
                      __html: post.content.replace(/\n/g, "<br />"),
                    }}
                  />
                  {post.image && <img src={post.image} />}
                </div>
                <div className="mt-auto">
                  <div className="mt-3 flex flex-wrap items-center gap-y-1 overflow-hidden text-sm leading-6 text-gray-500">
                    <time dateTime="2023-03-16" className="mr-8">
                      {dayjs(post.createdDate).format("YYYY-MM-DD HH:mm")}
                    </time>
                  </div>
                  <div className="mt-3 flex gap-[10px] border-t pt-5">
                    <div className="flex">
                      <button>
                        <img
                          className="h-[90%] w-[90%]"
                          src={WEBAPP_URL + "/LikeGroup.svg"}
                          alt=""
                        />
                      </button>
                      <div className="-ml-1">99</div>
                    </div>
                    <div className="flex">
                      <button>
                        <img
                          className="-mt-[1px] mr-1 h-4 w-4"
                          src={WEBAPP_URL + "/comment_icon.svg"}
                          alt=""
                        />
                      </button>
                      <div>630</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {isLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <Dialog open={isLoading}>
                  <DialogContent>
                    <div className="text-center">
                      <svg
                        className="bg-awst text-awst mx-auto mb-3 h-8 w-8 animate-spin"
                        viewBox="0 0 24 24"
                      ></svg>
                      <p className="text-default ml-2 text-[16px]">
                        Creating...
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          <div>&nbsp;</div>
          {!isLoading && displayedPosts.length !== 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={allPosts.length}
            />
          )}
          <PostDetail
            open={isSlideOverOpen}
            data={post}
            setOpen={setIsSlideOverOpen}
          />
        </div>
      </div>
    </>
  );
}

export default PostList;
