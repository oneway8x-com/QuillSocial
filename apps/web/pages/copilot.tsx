import PageWrapper from "@components/PageWrapper";
import CopilotPlanScreen from "@components/copilot/CopilotPlanScreen";
import Shell from "@quillsocial/features/shell/Shell";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { HeadSeo } from "@quillsocial/ui";
import { Bot } from "@quillsocial/ui/components/icon";
import React from "react";

const CopilotPage = () => {
  const { t } = useLocale();

  return (
    <Shell
      backPath="/write/0"
      heading={
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <span>Copilot</span>
        </div>
      }
      subtitle="AI-powered content planning assistant"
    >
      <HeadSeo title="Copilot" description="AI-powered assistant for content planning and strategy" />
      <CopilotPlanScreen />
    </Shell>
  );
};

CopilotPage.PageWrapper = PageWrapper;
export default CopilotPage;
