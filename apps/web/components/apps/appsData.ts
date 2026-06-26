import type { App as AppType } from "@quillsocial/types/App";

type AppListItem = {
  title: string;
  description: string;
  logoSrc: string;
  installProps: {
    type: AppType["type"];
    slug: string;
    variant: string;
    allowedMultipleInstalls: boolean;
  };
};

const apps: AppListItem[] = [
  {
    title: "X",
    description:
      "X, formerly called Twitter, is an online social media and social networking service operated by the American company X Corp., the successor of Twitter, Inc. On X, registered users can post text, images and videos.",
    logoSrc: "/logo/x-social-logo.svg",
    installProps: {
      type: "xconsumerkeys_social",
      slug: "xconsumerkeys-social",
      variant: "social",
      allowedMultipleInstalls: false,
    },
  },
  {
    title: "Linkedin",
    description:
      "LinkedIn is a business and employment-focused social media platform that works through websites and mobile apps. It was launched on May 5, 2003. Since December 2016, it has been a wholly owned subsidiary of Microsoft",
    logoSrc: "/logo/linkedin-social-logo.svg",
    installProps: {
      type: "linkedin_social",
      slug: "linkedin-social",
      variant: "social",
      allowedMultipleInstalls: false,
    },
  },
  {
    title: "Facebook Page",
    description:
      "Facebook, owned by Meta Platforms, is a popular online social media and networking service. Founded in 2004 by Mark Zuckerberg and his college roommates, it's a diverse platform enabling users to connect with loved ones, share updates, photos, videos, and explore varied content.",
    logoSrc: "/logo/facebook-social-logo.svg",
    installProps: {
      type: "facebook_social",
      slug: "facebook-social",
      variant: "social",
      allowedMultipleInstalls: false,
    },
  },
  {
    title: "Threads",
    description:
      "Threads is a text-focused social app by Meta that enables short posts and public conversations across topics. It integrates with Instagram identities and is designed for real-time discussion and community building.",
    logoSrc: "/logo/threads-social-logo.svg",
    installProps: {
      type: "threads_social",
      slug: "threads-social",
      variant: "social",
      allowedMultipleInstalls: false,
    },
  },
  {
    title: "Instagram (Business)",
    description:
      "Instagram is a photo and video sharing platform from Meta that supports posts, stories, reels, and direct messaging. This integration uses the Instagram Graph API (via Facebook Login) and is intended for Business or Creator Instagram accounts that are linked to a Facebook Page.",
    logoSrc: "/logo/instagram-social-logo.svg",
    installProps: {
      type: "instagram_social",
      slug: "instagram-social",
      variant: "social",
      allowedMultipleInstalls: false,
    },
  },
];

export default apps;
