import PageWrapper from "@components/PageWrapper";
import Shell from "@quillsocial/features/shell/Shell";
import { Button, HeadSeo } from "@quillsocial/ui";

const creationCards = [
  {
    title: "Write",
    description: "Draft and edit a post manually with AI rewrite help.",
    cta: "Open editor",
    href: "/write/0",
  },
  {
    title: "AI Assist",
    description: "Generate draft posts from your idea, update, or lesson.",
    cta: "Generate drafts",
    href: "/ai-write",
  },
  {
    title: "Templates",
    description:
      "Use proven formats for launches, lessons, stories, and questions.",
    cta: "Browse templates",
    href: "/post-generator",
  },
  {
    title: "Repurpose",
    description:
      "Turn one outline into X, LinkedIn, Threads, carousel, Shorts, or blog formats.",
    cta: "Repurpose content",
    href: "/post-factory",
  },
];

const linkedInTools = [
  {
    title: "LinkedIn Headline Generator",
    description: "Create profile headline options from CV or resume text.",
    href: "/tools/linkedin/headline-generator",
  },
  {
    title: "LinkedIn About Generator",
    description: "Draft longer About-section options from CV or resume text.",
    href: "/tools/linkedin/about-generator",
  },
];

const CreatePage = () => {
  return (
    <>
      <HeadSeo
        title="Create"
        description="Write once, then adapt your idea for every platform."
      />
      <Shell
        withoutSeo
        heading="Create"
        subtitle="Write once, then adapt your idea for every platform."
      >
        <div className="space-y-8 pb-10">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {creationCards.map((card) => (
              <article
                key={card.title}
                className="flex min-h-[220px] flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-base font-semibold text-gray-950">
                  {card.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">
                  {card.description}
                </p>
                <Button href={card.href} color="primary" className="mt-5 w-fit">
                  {card.cta}
                </Button>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Tools
                </p>
                <h2 className="mt-2 text-lg font-semibold text-gray-950">
                  LinkedIn Profile Tools
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {linkedInTools.map((tool) => (
                <article
                  key={tool.title}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <h3 className="text-sm font-semibold text-gray-950">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {tool.description}
                  </p>
                  <Button href={tool.href} color="secondary" className="mt-4">
                    Open tool
                  </Button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </Shell>
    </>
  );
};

CreatePage.PageWrapper = PageWrapper;
export default CreatePage;
