import PageWrapper from "@components/PageWrapper";
import Shell, {
  MobileNavigationMoreItems,
} from "@quillsocial/features/shell/Shell";

export default function MorePage() {
  return (
    <Shell heading="More" hideHeadingOnMobile>
      <div className="max-w-screen-lg md:hidden">
        <MobileNavigationMoreItems />
      </div>
    </Shell>
  );
}
MorePage.PageWrapper = PageWrapper;
