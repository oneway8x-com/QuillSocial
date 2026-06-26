import PageWrapper from "@components/PageWrapper";
import Shell from "@quillsocial/features/shell/Shell";
import { Button, HeadSeo } from "@quillsocial/ui";

const actionCards = [
  {
    title: "Start from today's progress",
    description: "Write what you shipped, learned, fixed, or noticed today.",
    cta: "Create post",
    href: "/create",
  },
  {
    title: "Capture an idea",
    description: "Save a raw idea before it disappears.",
    cta: "Add idea",
    href: "/ideas-pillars",
  },
  {
    title: "Engage with peers",
    description: "Find relevant conversations and prepare thoughtful replies.",
    cta: "Open Engage",
    href: "/engage",
  },
  {
    title: "Review calendar",
    description: "Check what is scheduled or already published.",
    cta: "Open Calendar",
    href: "/calendar",
  },
];

const momentumStats = [
  { label: "Current streak", value: "0 days" },
  { label: "Drafts waiting", value: "Review soon" },
  { label: "Scheduled this week", value: "Plan ahead" },
  { label: "Engagement queue", value: "Ready to review" },
];

const DashboardPage = () => {
  return (
    <>
      <HeadSeo
        title="Today's Momentum"
        description="Turn what you built today into content, schedule it, and engage with the right people."
      />
      <Shell
        withoutSeo
        heading="Today's Momentum"
        subtitle="Turn what you built today into content, schedule it, and engage with the right people."
      >
        <div className="space-y-8 pb-10">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actionCards.map((card) => (
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

          <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Today's suggested action
              </p>
              <h2 className="mt-2 text-xl font-semibold text-gray-950">
                Turn one recent update into a draft.
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Capture the context while it is fresh, then decide later whether
                it belongs on LinkedIn, X, Threads, or your blog.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href="/write/0" color="secondary">
                  Continue draft
                </Button>
                <Button href="/ideas-pillars" color="minimal">
                  Start from idea
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Momentum
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {momentumStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-950">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <Button href="/engage" color="primary" className="mt-5">
                Open engagement queue
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Upcoming scheduled posts
                </p>
                <h2 className="mt-2 text-lg font-semibold text-gray-950">
                  No schedule preview yet
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Use Calendar to review scheduled and published content.
                </p>
              </div>
              <Button href="/calendar" color="secondary">
                Open Calendar
              </Button>
            </div>
          </section>
        </div>
      </Shell>
    </>
  );
};

DashboardPage.PageWrapper = PageWrapper;
export default DashboardPage;
