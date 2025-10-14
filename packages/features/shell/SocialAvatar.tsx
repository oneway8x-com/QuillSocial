import classNames from "@quillsocial/lib/classNames";
import { WEBAPP_URL, LOGO_ICON } from "@quillsocial/lib/constants";
import { trpc } from "@quillsocial/trpc/react";
import { Avatar } from "@quillsocial/ui";
import React from "react";

interface SocialAvatarProps {
  avatarUrl: string;
  name?: string;
  appId: string;
  size: string;
}

const SocialAvatar: React.FC<SocialAvatarProps> = ({
  avatarUrl,
  name,
  size,
  appId,
}) => {
  const mappedSize =
    size === "xxs" ||
    size === "xs" ||
    size === "xsm" ||
    size === "sm" ||
    size === "md" ||
    size === "mdLg" ||
    size === "lg" ||
    size === "xl"
      ? size
      : "mdLg";
  const imgClass = mappedSize === "sm" ? "ml-3 h-2 w-3" : "ml-8 h-4 w-4";

  // sizes mapping copied from Avatar component to ensure fallback image matches size
  const sizesPropsBySize = {
    xxs: "w-3.5 h-3.5 min-w-3.5 min-h-3.5",
    xs: "w-4 h-4 min-w-4 min-h-4 max-h-4",
    xsm: "w-5 h-5 min-w-5 min-h-5",
    sm: "w-6 h-6 min-w-6 min-h-6",
    md: "w-8 h-8 min-w-8 min-h-8",
    mdLg: "w-10 h-10 min-w-10 min-h-10",
    lg: "w-16 h-16 min-w-16 min-h-16",
    xl: "w-24 h-24 min-w-24 min-h-24",
  } as const;

  const avatarRootClass = sizesPropsBySize[mappedSize];

  // Special handling for xconsumerkeys-social to use SVG logo as avatar
  const displayAvatarUrl =
    appId === "xconsumerkeys-social"
      ? `${WEBAPP_URL}/logo/xconsumerkeys-social-logo.svg`
      : avatarUrl;

  const fallbackLogo = (
    <img
      src={`${WEBAPP_URL}${LOGO_ICON}`}
      alt="Quill logo"
      className={classNames("rounded-full", avatarRootClass)}
    />
  );

  return (
    <div className="relative flex items-center">
      <Avatar
        size={mappedSize}
        imageSrc={displayAvatarUrl || undefined}
        alt={name || "Nameless User"}
        className="relative z-10 overflow-hidden"
        fallback={fallbackLogo}
      />
      <img
        src={`${WEBAPP_URL}/logo/${appId}-logo.svg`}
        alt={appId}
        className={`absolute z-10 mt-5 rounded ${imgClass}`}
      />
    </div>
  );
};

export function useCurrentUserAccount() {
  const socialAccounts = trpc.viewer.socials.getSocialNetWorking.useQuery();
  if (!socialAccounts.data) {
    return undefined;
  }

  return socialAccounts.data.find((account) => account.isUserCurrentProfile);
}

export default SocialAvatar;
