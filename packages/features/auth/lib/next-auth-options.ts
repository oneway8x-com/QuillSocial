import { publicDomain } from "../../../../apps/web/pages/api/auth/pulic-email";
import { CustomScopesXProvider } from "./CustomScopesXProvider";
import { ErrorCode } from "./ErrorCode";
import { LinkedinProvider } from "./LinkedinProvider";
import { isPasswordValid } from "./isPasswordValid";
import MyAppAuthAdapter from "./next-auth-custom-adapter";
import { updateUserCredential } from "./updateUserCredential";
import { verifyPassword } from "./verifyPassword";
import type { UserPermissionRole, Membership, Team } from "@prisma/client";
import getAppKeysFromSlug from "@quillsocial/app-store/_utils/getAppKeysFromSlug";
import {
  sendToJuneSo,
  TrackEventJuneSo,
  EVENTS,
} from "@quillsocial/features/june.so/juneso";
import {
  IS_TEAM_BILLING_ENABLED,
  WEBAPP_URL,
} from "@quillsocial/lib/constants";
import { symmetricDecrypt } from "@quillsocial/lib/crypto";
import { defaultCookies } from "@quillsocial/lib/default-cookies";
import { isENVDev } from "@quillsocial/lib/env";
import logger from "@quillsocial/lib/logger";
import { randomString } from "@quillsocial/lib/random";
import slugify from "@quillsocial/lib/slugify";
import prisma from "@quillsocial/prisma";
import { IdentityProvider } from "@quillsocial/prisma/enums";
import {
  teamMetadataSchema,
  userMetadata,
} from "@quillsocial/prisma/zod-utils";
import type { AuthOptions, Session } from "next-auth";
import { encode } from "next-auth/jwt";
import type { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import TwitterProvider from "next-auth/providers/twitter";

const GOOGLE_API_CREDENTIALS = process.env.GOOGLE_API_CREDENTIALS || "{}";
const safeParseGoogleCreds = (raw: string): any => {
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(
      "Invalid GOOGLE_API_CREDENTIALS JSON in auth options; Google login disabled. Error:",
      (e as Error).message
    );
    return {};
  }
};
const { client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET } =
  safeParseGoogleCreds(GOOGLE_API_CREDENTIALS)?.web || {};
const IS_GOOGLE_LOGIN_ENABLED = !!(
  GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
);

const usernameSlug = (username: string) =>
  slugify(username) + "-" + randomString(6).toLowerCase();

const loginWithTotp = async (user: { email: string }) =>
  `/auth/login?totp=${await (
    await import("./signJwt")
  ).default({ email: user.email })}`;

type UserTeams = {
  teams: (Membership & {
    team: Team;
  })[];
};

export const checkIfUserBelongsToActiveTeam = <T extends UserTeams>(user: T) =>
  user.teams.some((m: { team: { metadata: unknown } }) => {
    if (!IS_TEAM_BILLING_ENABLED) {
      return true;
    }

    const metadata = teamMetadataSchema.safeParse(m.team.metadata);

    return metadata.success && metadata.data?.subscriptionId;
  });

const providers: Provider[] = [
  CredentialsProvider({
    id: "credentials",
    name: "QuillAI",
    type: "credentials",
    credentials: {
      email: {
        label: "Email Address",
        type: "email",
        placeholder: "john.doe@example.com",
      },
      password: {
        label: "Password",
        type: "password",
        placeholder: "Your super secure password",
      },
      totpCode: {
        label: "Two-factor Code",
        type: "input",
        placeholder: "Code from authenticator app",
      },
    },
    async authorize(credentials) {
      if (!credentials) {
        console.error(`For some reason credentials are missing`);
        throw new Error(ErrorCode.InternalServerError);
      }

      const authLog = logger.getChildLogger({ prefix: ["Auth", "Login"] });
      authLog.debug("Attempting login", {
        email: credentials.email,
        hasPassword: !!credentials.password,
        hasTotpCode: !!credentials.totpCode,
        ts: new Date().toISOString(),
      });

      const user = await prisma.user.findUnique({
        where: {
          email: credentials.email.toLowerCase(),
        },
        select: {
          role: true,
          id: true,
          username: true,
          name: true,
          email: true,
          metadata: true,
          identityProvider: true,
          password: true,
          organizationId: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          organization: {
            select: {
              id: true,
            },
          },
          teams: {
            include: {
              team: true,
            },
          },
        },
      });

      authLog.debug("User lookup", {
        found: !!user,
        id: user?.id,
        identityProvider: user?.identityProvider,
        hasPassword: !!user?.password,
        twoFactorEnabled: !!user?.twoFactorEnabled,
      });

      // Don't leak information about it being username or password that is invalid
      if (!user) {
        authLog.debug("No user found for email");
        throw new Error(ErrorCode.IncorrectUsernamePassword);
      }

      if (
        user.identityProvider !== IdentityProvider.DB &&
        !credentials.totpCode
      ) {
        authLog.debug("Blocked: Non-DB identity provider requires totpCode", {
          identityProvider: user.identityProvider,
        });
        throw new Error(ErrorCode.ThirdPartyIdentityProviderEnabled);
      }

      if (!user.password) {
        authLog.debug("No stored password while password path expected");
        throw new Error(ErrorCode.IncorrectUsernamePassword);
      }

      const isCorrectPassword = await verifyPassword(
        credentials.password,
        user.password
      );

      authLog.debug("Password verification", {
        isCorrectPassword,
        providedPasswordLength: credentials.password?.length,
      });

      if (!isCorrectPassword) {
        throw new Error(ErrorCode.IncorrectUsernamePassword);
      }

      // Disabled two-factor authentication by bypassing related checks
      // if (!credentials.totpCode) {
      //   authLog.debug("Two-factor required but no code provided");
      //   throw new Error(ErrorCode.SecondFactorRequired);
      // }

      // if (!user.twoFactorSecret) {
      //   console.error(
      //     `Two factor is enabled for user ${user.id} but they have no secret`
      //   );
      //   throw new Error(ErrorCode.InternalServerError);
      // }

      // if (!process.env.MY_APP_ENCRYPTION_KEY) {
      //   console.error(
      //     `"Missing encryption key; cannot proceed with two factor login."`
      //   );
      //   throw new Error(ErrorCode.InternalServerError);
      // }

      // const secret = symmetricDecrypt(
      //   user.twoFactorSecret,
      //   process.env.MY_APP_ENCRYPTION_KEY
      // );
      // if (secret.length !== 32) {
      //   console.error(
      //     `Two factor secret decryption failed. Expected key with length 32 but got ${secret.length}`
      //   );
      //   throw new Error(ErrorCode.InternalServerError);
      // }

      // const isValidToken = (await import("otplib")).authenticator.check(
      //   credentials.totpCode,
      //   secret
      // );

      // authLog.debug("2FA token validation", { isValidToken });

      // if (!isValidToken) {
      //   throw new Error(ErrorCode.IncorrectTwoFactorCode);
      // }

      // Check if the user you are logging into has any active teams
      const hasActiveTeams = checkIfUserBelongsToActiveTeam(user);

      // authentication success- but does it meet the minimum password requirements?
      const validateRole = (role: UserPermissionRole) => {
        // User's role is not "ADMIN"
        if (role !== "ADMIN") return role;
        // User's identity provider is not "DB"
        if (user.identityProvider !== IdentityProvider.DB) return role;
        // User's password is valid and two-factor authentication is enabled
        if (
          isPasswordValid(credentials.password, false, true) &&
          user.twoFactorEnabled
        )
          return role;
        // Code is running in a development environment
        if (isENVDev) return role;
        // By this point it is an ADMIN without valid security conditions
        return "INACTIVE_ADMIN";
      };

      const result: any = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: validateRole(user.role) as UserPermissionRole | "INACTIVE_ADMIN",
        belongsToActiveTeam: hasActiveTeams,
        organizationId: user.organizationId,
      };

      authLog.debug("Role validation", {
        originalRole: user.role,
        finalRole: result.role,
      });
      authLog.debug("Login success", {
        id: result.id,
        role: result.role,
        belongsToActiveTeam: result.belongsToActiveTeam,
      });

      return result;
    },
  }),
  CustomScopesXProvider({
    clientId: process.env.TWITTER_API_KEY!,
    clientSecret: process.env.TWITTER_API_SECRET!,
    version: "2.0",
  }),
  LinkedinProvider({
    clientId: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  }),
];

if (IS_GOOGLE_LOGIN_ENABLED) {
  providers.push(
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

providers.push(
  EmailProvider({
    type: "email",
    maxAge: 10 * 60 * 60, // Magic links are valid for 10 min only
    // Here we setup the sendVerificationRequest that calls the email template with the identifier (email) and token to verify.
    // sendVerificationRequest: async (props) => (await import("./sendVerificationRequest")).default(props),
  })
);

function isNumber(n: string) {
  return !isNaN(parseFloat(n)) && !isNaN(+n);
}

const myAppAuthAdapter = MyAppAuthAdapter(prisma);

const mapIdentityProvider = (providerName: string) => {
  switch (providerName) {
    case "saml-idp":
    case "saml":
      return IdentityProvider.SAML;
    case "twitter":
      return IdentityProvider.TWITTER;
    case "linkedin":
      return IdentityProvider.LINKEDIN;
    default:
      return IdentityProvider.GOOGLE;
  }
};

export const AUTH_OPTIONS: AuthOptions = {
  // @ts-ignore
  adapter: myAppAuthAdapter,
  session: {
    strategy: "jwt",
  },
  jwt: {
    // decorate the native JWT encode function
    // Impl. detail: We don't pass through as this function is called with encode/decode functions.
    encode: async ({ token, maxAge, secret }) => {
      if (token?.sub && isNumber(token.sub)) {
        const user = await prisma.user.findFirst({
          where: { id: Number(token.sub) },
          select: { metadata: true },
        });
        // if no user is found, we still don't want to crash here.
        if (user) {
          const metadata = userMetadata.parse(user.metadata);
          if (metadata?.sessionTimeout) {
            maxAge = metadata.sessionTimeout * 60;
          }
        }
      }
      return encode({ secret, token, maxAge });
    },
  },
  cookies: defaultCookies(WEBAPP_URL?.startsWith("https://")),
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error", // Error code passed in query string as ?error=
    verifyRequest: "/auth/verify",
    // newUser: "/auth/new", // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      const autoMergeIdentities = async () => {
        const existingUser = await prisma.user.findFirst({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          where: { email: token.email! },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            organizationId: true,
            role: true,
            teams: {
              include: {
                team: true,
              },
            },
          },
        });

        if (!existingUser) {
          return token;
        }

        // Check if the existingUser has any active teams
        const belongsToActiveTeam =
          checkIfUserBelongsToActiveTeam(existingUser);
        const { teams, ...existingUserWithoutTeamsField } = existingUser;

        return {
          ...existingUserWithoutTeamsField,
          ...token,
          belongsToActiveTeam,
        };
      };
      if (!user) {
        return await autoMergeIdentities();
      }
      if (!account) {
        return token;
      }
      if (account.type === "credentials") {
        // return token if credentials,saml-idp
        if (account.provider === "saml-idp") {
          return token;
        }
        // any other credentials, add user info
        return {
          ...token,
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          impersonatedByUID: user?.impersonatedByUID,
          belongsToActiveTeam: user?.belongsToActiveTeam,
          organizationId: user?.organizationId,
        };
      }

      // The arguments above are from the provider so we need to look up the
      // user based on those values in order to construct a JWT.
      if (account.type === "oauth") {
        if (!account.provider || !account.providerAccountId) {
          return token;
        }
        let idP: IdentityProvider =
          account.provider === "saml"
            ? IdentityProvider.SAML
            : IdentityProvider.GOOGLE;
        if (account.provider === "twitter") idP = IdentityProvider.TWITTER;
        if (account.provider === "linkedin") idP = IdentityProvider.LINKEDIN;
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              {
                identityProvider: idP,
              },
              {
                identityProviderId: account.providerAccountId,
              },
            ],
          },
        });

        if (!existingUser) {
          return await autoMergeIdentities();
        }

        return {
          ...token,
          id: existingUser.id,
          name: existingUser.name,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role,
          impersonatedByUID: token.impersonatedByUID as number,
          belongsToActiveTeam: token?.belongsToActiveTeam as boolean,
          organizationId: token?.organizationId,
        };
      }

      return token;
    },
    async session({ session, token }) {
      const hasValidLicense = true;
      const calendsoSession: Session = {
        ...session,
        hasValidLicense,
        user: {
          ...session.user,
          id: token.id as number,
          name: token.name,
          username: token.username as string,
          role: token.role as UserPermissionRole,
          impersonatedByUID: token.impersonatedByUID as number,
          belongsToActiveTeam: token?.belongsToActiveTeam as boolean,
          organizationId: token?.organizationId,
        },
      };

      return calendsoSession;
    },
    async signIn(params) {
      const { user, account, profile } = params;
      if (account?.provider === "email") {
        return true;
      }

      // In this case we've already verified the credentials in the authorize
      // callback so we can sign the user in.
      // Only if provider is not saml-idp
      if (account?.provider !== "saml-idp") {
        if (account?.type === "credentials") {
          return true;
        }

        if (account?.type !== "oauth") {
          return false;
        }
      }

      const userEmail =
        account.provider === "twitter"
          ? account.providerAccountId + "@twitter.account"
          : user.email;
      if (!userEmail) {
        return false;
      }

      if (!user.name) {
        return false;
      }

      if (account?.provider) {
        const idP: IdentityProvider = mapIdentityProvider(account.provider);

        // @ts-ignore-error TODO validate email_verified key on profile
        user.email_verified =
          user.email_verified ||
          !!user.emailVerified ||
          (profile as any)?.email_verified;

        if (account?.provider !== "twitter" && !user.email_verified) {
          return "/auth/error?error=unverified-email";
        }

        let existingUser = await prisma.user.findFirst({
          include: {
            accounts: {
              where: {
                provider: account.provider,
              },
            },
          },
          where: {
            identityProvider: idP,
            identityProviderId: account.providerAccountId,
          },
        });

        /* --- START FIX LEGACY ISSUE WHERE 'identityProviderId' was accidentally set to userId --- */
        if (!existingUser) {
          existingUser = await prisma.user.findFirst({
            include: {
              accounts: {
                where: {
                  provider: account.provider,
                },
              },
            },
            where: {
              identityProvider: idP,
              identityProviderId: account.providerAccountId,
            },
          });
          if (existingUser) {
            await prisma.user.update({
              where: {
                id: existingUser?.id,
              },
              data: {
                identityProviderId: account.providerAccountId,
              },
            });
          }
        }
        /* --- END FIXES LEGACY ISSUE WHERE 'identityProviderId' was accidentally set to userId --- */
        if (existingUser) {
          // In this case there's an existing user and their email address
          // hasn't changed since they last logged in.
          if (existingUser.email === userEmail) {
            try {
              // If old user without Account entry we link their google account
              if (existingUser.accounts.length === 0) {
                const linkAccountWithUserData = {
                  ...account,
                  userId: existingUser.id,
                };
                await myAppAuthAdapter.linkAccount(linkAccountWithUserData);
              }
            } catch (error) {
              if (error instanceof Error) {
                console.error(
                  "Error while linking account of already existing user"
                );
              }
            }
            await updateUserCredentialFromProvider(user, account, profile);
            if (existingUser.twoFactorEnabled) {
              return loginWithTotp(existingUser);
            } else {
              return true;
            }
          }

          // If the email address doesn't match, check if an account already exists
          // with the new email address. If it does, for now we return an error. If
          // not, update the email of their account and log them in.
          const userWithNewEmail = await prisma.user.findFirst({
            where: { email: userEmail },
          });

          if (!userWithNewEmail) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { email: userEmail },
            });
            await updateUserCredentialFromProvider(user, account, profile);
            if (existingUser.twoFactorEnabled) {
              return loginWithTotp(existingUser);
            } else {
              return true;
            }
          } else {
            return "/auth/error?error=new-email-conflict";
          }
        }

        // If there's no existing user for this identity provider and id, create
        // a new account. If an account already exists with the incoming email
        // address return an error for now.
        const existingUserWithEmail = await prisma.user.findFirst({
          where: {
            email: {
              equals: userEmail,
              mode: "insensitive",
            },
          },
        });

        if (existingUserWithEmail) {
          // if self-hosted then we can allow auto-merge of identity providers if email is verified
          if (existingUserWithEmail.emailVerified) {
            await updateUserCredentialFromProvider(user, account, profile);
            if (existingUserWithEmail.twoFactorEnabled) {
              return loginWithTotp(existingUserWithEmail);
            } else {
              return true;
            }
          }

          // check if user was invited
          if (
            !existingUserWithEmail.password &&
            !existingUserWithEmail.emailVerified &&
            !existingUserWithEmail.username
          ) {
            await prisma.user.update({
              where: {
                email: existingUserWithEmail.email,
              },
              data: {
                // update the email to the IdP email
                email: userEmail,
                // Slugify the incoming name and append a few random characters to
                // prevent conflicts for users with the same name.
                username: usernameSlug(user.name),
                emailVerified: new Date(Date.now()),
                name: user.name,
                identityProvider: idP,
                identityProviderId: account.providerAccountId,
              },
            });
            await updateUserCredentialFromProvider(user, account, profile);
            if (existingUserWithEmail.twoFactorEnabled) {
              return loginWithTotp(existingUserWithEmail);
            } else {
              return true;
            }
          }

          // User signs up with email/password and then tries to login with Google/SAML using the same email
          if (
            existingUserWithEmail.identityProvider === IdentityProvider.DB &&
            (idP === IdentityProvider.LINKEDIN ||
              idP === IdentityProvider.TWITTER ||
              idP === IdentityProvider.GOOGLE ||
              idP === IdentityProvider.SAML)
          ) {
            await prisma.user.update({
              where: { email: existingUserWithEmail.email },
              // also update email to the IdP email
              data: {
                password: null,
                email: userEmail,
                identityProvider: idP,
                identityProviderId: account.providerAccountId,
              },
            });
            await updateUserCredentialFromProvider(user, account, profile);
            if (existingUserWithEmail.twoFactorEnabled) {
              return loginWithTotp(existingUserWithEmail);
            } else {
              return true;
            }
          } else if (
            existingUserWithEmail.identityProvider === IdentityProvider.DB
          ) {
            return "/auth/error?error=use-password-login";
          }

          return "/auth/error?error=use-identity-login";
        }

        const newUser = await prisma.user.create({
          data: {
            // Slugify the incoming name and append a few random characters to
            // prevent conflicts for users with the same name.
            username: usernameSlug(user.name),
            emailVerified: new Date(Date.now()),
            name: user.name,
            email: userEmail,
            identityProvider: idP,
            identityProviderId: account.providerAccountId,
          },
        });

        if (newUser) {
          sendToJuneSo({
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.name,
          });
          TrackEventJuneSo({ id: newUser.toString(), event: EVENTS.SIGNED_UP });
        }

        const linkAccountNewUserData = { ...account, userId: newUser.id };
        if (
          idP === "LINKEDIN" &&
          "refresh_token_expires_in" in linkAccountNewUserData
        ) {
          delete linkAccountNewUserData.refresh_token_expires_in;
        }
        await myAppAuthAdapter.linkAccount(linkAccountNewUserData);
        await updateUserCredentialFromProvider(user, account, profile);
        if (account.twoFactorEnabled) {
          return loginWithTotp(newUser);
        } else {
          return true;
        }
      }

      return false;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same domain
      else if (new URL(url).hostname === new URL(WEBAPP_URL).hostname)
        return url;
      return baseUrl;
    },
  },
};

const updateUserCredentialFromProvider = async (
  user: any,
  account: any,
  profile: any
) => {
  //only test for twitter and linkedin
  if (!(account.provider === "linkedin")) {
    return;
  }
  const identityProvider = mapIdentityProvider(account.provider);
  const dbUser = await prisma.user.findFirst({
    where: {
      identityProvider,
      identityProviderId: account.providerAccountId,
    },
  });
  if (!dbUser) return;
  //Twitter v2
  // await updateUserCredential(
  //   identityProvider,
  //   dbUser.id,
  //   account.provider === "twitter" ? profile.data.username : user.email,
  //   account.provider === "twitter" ? profile.data.name : user.name,
  //   account.provider === "twitter" ? user.image : profile.picture,
  //   account.provider === "twitter" ? account.scope.split(" ") : account.scope.split(","),
  //   account.expires_at,
  //   account.access_token,
  //   account.provider === "twitter" ? account.refresh_token : account.id_token
  // );

  //TwitterV1
  await updateUserCredential(
    identityProvider,
    dbUser.id,
    account.provider === "twitter" ? profile.data.username : user.email,
    account.provider === "twitter" ? profile.data.name : user.name,
    account.provider === "twitter" ? user.image : profile.picture,
    account.provider === "twitter"
      ? account.scope.split(" ")
      : account.scope.split(","),
    account.expires_at,
    account.access_token,
    account.provider === "twitter" ? account.refresh_token : account.id_token
  );
};
