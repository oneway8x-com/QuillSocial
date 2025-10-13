import PageWrapper from "@components/PageWrapper";
import Card from "@components/post-generator/card";
import {
  templatesInfo,
  templateCategories,
} from "@components/post-generator/constTemplateWrapper";
import { ChatProvider } from "@lib/hooks/Chat/ChatProvider";
import { BrainProvider } from "@lib/hooks/Chat/brain-provider";
import useMeQuery from "@lib/hooks/useMeQuery";
import dayjs from "@quillsocial/dayjs";
import Shell from "@quillsocial/features/shell/Shell";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { trpc } from "@quillsocial/trpc/react";
import { Button, HeadSeo, showToast } from "@quillsocial/ui";
import { HorizontalTabs } from "@quillsocial/ui";
import type {
  VerticalTabItemProps,
  HorizontalTabItemProps,
} from "@quillsocial/ui";
import { Dialog, DialogContent } from "@quillsocial/ui";
import { Mail } from "@quillsocial/ui/components/icon";
import { debounce } from "lodash";
import {
  Heart,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Search,
  UsersIcon,
  Star,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { components } from "react-select";

const PostGeneratorPage = () => {
  const { t } = useLocale();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const query = useMeQuery();

  const handleCardClick = (code: string) => {
    if (!ischeckForAIAppsLoading && !isAIPresent) {
      showToast(
        "Please install ChatGPT app from Apps menu to use this feature",
        "error"
      );
      router.push(`/settings/my-account/app-integrations`);
      return;
    }
    router.push(`/post-generator/templates/${code}`);
  };

  const { isLoading: ischeckForAIAppsLoading, data: isAIPresent } =
    trpc.viewer.appsRouter.checkForAIApps.useQuery();

  // Filter templates based on category and search
  const filteredTemplates = useMemo(() => {
    let filtered = templatesInfo;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (template) => template.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.title.toLowerCase().includes(query) ||
          template.subtitle.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  // Create category tabs
  const categoryTabs = [
    { id: "all", name: "✨ All Templates", icon: Star },
    ...templateCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: Star,
    })),
  ];

  return (
    <>
      <HeadSeo title={t("My-Content")} description="Generate posts with AI" />
      <Shell
        withoutSeo
        heading={`Generate posts with AI`}
        subtitle="Select a template to generate high-quality posts with AI"
      >
        <div className="w-full space-y-6 pb-10">
          {/* Search Bar */}
          <div className="relative mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="scrollbar-hide overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    selectedCategory === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-700">
                No templates found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <>
              {/* Category Info */}
              {selectedCategory !== "all" && (
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                  {templateCategories
                    .filter((cat) => cat.id === selectedCategory)
                    .map((cat) => (
                      <div key={cat.id} className="flex items-center space-x-3">
                        <span className="text-3xl">{cat.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {cat.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Templates Grid */}
              <div className="mt-2 flex flex-wrap justify-center gap-5 md:justify-start">
                {filteredTemplates.map((info) => (
                  <div
                    key={info.id}
                    onClick={() => handleCardClick(info.code)}
                    className="hover:cursor-pointer"
                  >
                    <Card
                      key={info.id}
                      title={info.title}
                      subtitle={info.subtitle}
                      description={info.description}
                      isNew={info.isNew}
                      backgroundColor={info.backgroundColor}
                    />
                  </div>
                ))}
              </div>

              {/* Template Count */}
              <div className="pt-4 text-center text-sm text-gray-500">
                Showing {filteredTemplates.length} of {templatesInfo.length}{" "}
                templates
              </div>
            </>
          )}
        </div>
      </Shell>
    </>
  );
};
PostGeneratorPage.PageWrapper = PageWrapper;
export default PostGeneratorPage;
