const envFile = process.env.NODE_ENV === 'production' ? '../../.env.production' : '../../.env.development';
require("dotenv").config({ path: envFile });
const CopyWebpackPlugin = require("copy-webpack-plugin");
const os = require("os");
const path = require("path");
const englishTranslation = require("./public/static/locales/en/common.json");
const { withAxiom } = require("next-axiom");
const { i18n } = require("./next-i18next.config");
const { pages } = require("./pages");
const { getSubdomainRegExp } = require("./getSubdomainRegExp");

if (!process.env.NEXTAUTH_SECRET) throw new Error("Please set NEXTAUTH_SECRET");
if (!process.env.MY_APP_ENCRYPTION_KEY) throw new Error("Please set MY_APP_ENCRYPTION_KEY");

// So we can test deploy previews preview
if (process.env.VERCEL_URL && !process.env.NEXT_PUBLIC_WEBAPP_URL) {
  process.env.NEXT_PUBLIC_WEBAPP_URL = "https://" + process.env.VERCEL_URL;
}
// Check for configuration of NEXTAUTH_URL before overriding
if (!process.env.NEXTAUTH_URL && process.env.NEXT_PUBLIC_WEBAPP_URL) {
  process.env.NEXTAUTH_URL = process.env.NEXT_PUBLIC_WEBAPP_URL + "/api/auth";
}


if (process.env.CSP_POLICY === "strict" && process.env.NODE_ENV === "production") {
  throw new Error(
    "Strict CSP policy(for style-src) is not yet supported in production. You can experiment with it in Dev Mode"
  );
}

if (!process.env.EMAIL_FROM) {
  console.warn(
    "\x1b[33mwarn",
    "\x1b[0m",
    "EMAIL_FROM environment variable is not set, this may indicate mailing is currently disabled. Please refer to the .env.example file."
  );
}

if (!process.env.NEXTAUTH_URL) throw new Error("Please set NEXTAUTH_URL");

const validJson = (jsonString) => {
  try {
    const o = JSON.parse(jsonString);
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
};

if (process.env.GOOGLE_API_CREDENTIALS && !validJson(process.env.GOOGLE_API_CREDENTIALS)) {
  console.warn(
    "\x1b[33mwarn",
    "\x1b[0m",
    '- Disabled \'Google Calendar\' integration. Reason: Invalid value for GOOGLE_API_CREDENTIALS environment variable. When set, this value needs to contain valid JSON like {"web":{"client_id":"<clid>","client_secret":"<secret>","redirect_uris":["<yourhost>/api/integrations/googlecalendar/callback>"]}. You can download this JSON from your OAuth Client @ https://console.cloud.google.com/apis/credentials.'
  );
}

const informAboutDuplicateTranslations = () => {
  const valueSet = new Set();

  for (const key in englishTranslation) {
    if (valueSet.has(englishTranslation[key])) {
      console.warn("\x1b[33mDuplicate value found in:", "\x1b[0m", key);
    } else {
      valueSet.add(englishTranslation[key]);
    }
  }
};

informAboutDuplicateTranslations();
const plugins = [];
if (process.env.ANALYZE === "true") {
  // only load dependency if env `ANALYZE` was set
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  });
  plugins.push(withBundleAnalyzer);
}

plugins.push(withAxiom);

// .* matches / as well(Note: *(i.e wildcard) doesn't match / but .*(i.e. RegExp) does)
// It would match /free/30min but not /bookings/upcoming because 'bookings' is an item in pages
// It would also not match /free/30min/embed because we are ensuring just two slashes
// ?!book ensures it doesn't match /free/book page which doesn't have a corresponding new-booker page.
// [^/]+ makes the RegExp match the full path, it seems like a partial match doesn't work.
// book$ ensures that only /book is excluded from rewrite(which is at the end always) and not /booked

// Important Note: When modifying these RegExps update apps/web/test/lib/next-config.test.ts as well
const userTypeRouteRegExp = `/:user((?!${pages.join("/|")})[^/]*)/:type((?!book$)[^/]+)`;
const teamTypeRouteRegExp = "/team/:slug/:type((?!book$)[^/]+)";
const privateLinkRouteRegExp = "/d/:link/:slug((?!book$)[^/]+)";
const embedUserTypeRouteRegExp = `/:user((?!${pages.join("/|")})[^/]*)/:type/embed`;
const embedTeamTypeRouteRegExp = "/team/:slug/:type/embed";
const subdomainRegExp = getSubdomainRegExp(process.env.NEXT_PUBLIC_WEBAPP_URL);
// Important Note: Do update the RegExp in apps/web/test/lib/next-config.test.ts when changing it.
const orgHostRegExp = `^(?<orgSlug>${subdomainRegExp})\\..*`;

const matcherConfigRootPath = {
  has: [
    {
      type: "host",
      value: orgHostRegExp,
    },
  ],
  source: "/",
};

const matcherConfigOrgMemberPath = {
  has: [
    {
      type: "host",
      value: orgHostRegExp,
    },
  ],
  source: `/:user((?!${pages.join("|")}|_next|public)[a-zA-Z0-9\-_]+)`,
};

const matcherConfigUserPath = {
  has: [
    {
      type: "host",
      value: `^(?<orgSlug>${subdomainRegExp}[^.]+)\\..*`,
    },
  ],
  source: `/:user((?!${pages.join("|")}|_next|public))/:path*`,
};

/** @type {import("next").NextConfig} */
const nextConfig = {
  i18n,
  productionBrowserSourceMaps: true,
  output: 'standalone',
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  /* We already do type check on GH actions */
  typescript: {
    ignoreBuildErrors: !!process.env.CI,
  },
  transpilePackages: [
    "@quillsocial/app-store",
    "@quillsocial/core",
    "@quillsocial/dayjs",
    "@quillsocial/emails",
    "@quillsocial/features",
    "@quillsocial/lib",
    "@quillsocial/prisma",
    "@quillsocial/trpc",
    "@quillsocial/ui",
    "lucide-react",
  ],
  modularizeImports: {
    "@quillsocial/ui/components/icon": {
      transform: "lucide-react/dist/esm/icons/{{ kebabCase member }}",
      preventFullImport: true,
    },
    "@quillsocial/features/insights/components": {
      transform: "@quillsocial/features/insights/components/{{member}}",
      skipDefaultConversion: true,
      preventFullImport: true,
    },
    lodash: {
      transform: "lodash/{{member}}",
    },

  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { webpack, buildId, isServer }) => {

    // added for GCP nodejs package compatibility
    // https://stackoverflow.com/a/71548920
    if (!isServer) {
      config.resolve.fallback.fs = false
      config.resolve.fallback.tls = false
      config.resolve.fallback.net = false
      config.resolve.fallback.child_process = false
    }

    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "../../packages/app-store/**/static/**",
            to({ context, absoluteFilename }) {
              // Adds compatibility for windows path
              if (os.platform() === "win32") {
                const absoluteFilenameWin = absoluteFilename.replaceAll("\\", "/");
                const contextWin = context.replaceAll("\\", "/");
                const appName = /app-store\/(.*)\/static/.exec(absoluteFilenameWin);
                return Promise.resolve(`${contextWin}/public/app-store/${appName[1]}/[name][ext]`);
              }
              const appName = /app-store\/(.*)\/static/.exec(absoluteFilename);
              return Promise.resolve(`${context}/public/app-store/${appName[1]}/[name][ext]`);
            },
          },
        ],
      })
    );

    config.plugins.push(new webpack.DefinePlugin({ "process.env.BUILD_ID": JSON.stringify(buildId) }));

    config.resolve.fallback = {
      ...config.resolve.fallback, // if you miss it, all the other options in fallback, specified
      // by next.js will be dropped. Doesn't make much sense, but how it is
      fs: false,
    };

    /**
     * TODO: Find more possible barrels for this project.
     *  @see https://github.com/vercel/next.js/issues/12557#issuecomment-1196931845
     **/
    config.module.rules.push({
      test: [/lib\/.*.tsx?/i],
      sideEffects: false,
    });

    return config;
  },
  async rewrites() {


    let afterFiles = [
      {
        source: "/:user/avatar.png",
        destination: "/api/user/avatar?username=:user",
      },
      {
        source: "/team/:teamname/avatar.png",
        destination: "/api/user/avatar?teamname=:teamname",
      },
      {
        source: "/forms/:formQuery*",
        destination: "/apps/routing-forms/routing-link/:formQuery*",
      },
      {
        source: "/router",
        destination: "/apps/routing-forms/router",
      },
    ];

    return {
      afterFiles,
    };
  },
  async headers() {
    return [
      {
        source: "/auth/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      {
        source: "/signup",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      ...[
        {
          ...matcherConfigRootPath,
          headers: [
            {
              key: "X-Access-Org-path",
              value: "/team/:orgSlug",
            },
          ],
        },

        {
          ...matcherConfigUserPath,
          headers: [
            {
              key: "X-Access-Org-path",
              value: "/:user/:path",
            },
          ],
        },
      ],
    ];
  },
  async redirects() {
    const redirects = [
      {
        source: "/api/app-store/:path*",
        destination: "/app-store/:path*",
        permanent: true,
      },
      {
        source: "/auth/signup",
        destination: "/signup",
        permanent: true,
      },
      {
        source: "/settings",
        destination: "/settings/my-account/profile",
        permanent: true,
      },
      {
        source: "/settings/teams",
        destination: "/teams",
        permanent: true,
      },
      {
        source: "/settings/admin",
        destination: "/settings/admin/flags",
        permanent: true,
      },
      /* V2 testers get redirected to the new settings */
      {
        source: "/settings/profile",
        destination: "/settings/my-account/profile",
        permanent: false,
      },
      {
        source: "/settings/security",
        destination: "/settings/security/password",
        permanent: false,
      },
      {
        source: "/call/:path*",
        destination: "/video/:path*",
        permanent: false,
      },
      /* Attempt to mitigate DDoS attack */
      {
        source: "/api/auth/:path*",
        has: [
          {
            type: "query",
            key: "callbackUrl",
            // prettier-ignore
            value: "^(?!https?:\/\/).*$",
          },
        ],
        destination: "/404",
        permanent: false,
      },
      {
        source: "/support",
        destination: "/write/0",
        permanent: true,
      }
    ];



    return redirects;
  },
};

module.exports = () => plugins.reduce((acc, next) => next(acc), nextConfig);
