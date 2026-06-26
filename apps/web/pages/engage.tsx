import PageWrapper from "@components/PageWrapper";
import Shell from "@quillsocial/features/shell/Shell";
import { Button, HeadSeo } from "@quillsocial/ui";

const engageCards = [
  {
    title: "X / Twitter",
    description:
      "Discover posts by topic, hashtag, or target list and prepare suggested replies.",
    cta: "Open X Engage",
    href: "/x-connect",
  },
  {
    title: "Threads",
    description:
      "Find relevant Threads conversations and queue human-approved replies.",
    cta: "Open Threads Engage",
    href: "/threads-connect",
  },
];

const workflowSteps = [
  "Discover relevant conversations",
  "Review suggested replies",
  "Approve before posting",
];

const EngagePage = () => {
  return (
    <>
      <HeadSeo
        title="Engage"
        description="Find relevant conversations and prepare replies with full human approval."
      />
      <Shell
        withoutSeo
        heading="Engage"
        subtitle="Find relevant conversations and prepare replies with full human approval."
      >
        <div className="space-y-8 pb-10">
          <section className="grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">
                  Step {index + 1}
                </p>
                <h2 className="mt-2 text-base font-semibold text-gray-950">
                  {step}
                </h2>
              </div>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {engageCards.map((card) => (
              <article
                key={card.title}
                className="flex min-h-[220px] flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-950">
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

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-950">
              Quill does not send engagement automatically without your
              approval.
            </p>
          </section>
        </div>
      </Shell>
    </>
  );
};

EngagePage.PageWrapper = PageWrapper;
export default EngagePage;
