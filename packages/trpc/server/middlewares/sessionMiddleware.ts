import type { TRPCContextInner } from "../createContext";
import { middleware } from "../trpc";
import { MembershipRole, UserPermissionRole } from ".prisma/client";
import { WEBAPP_URL } from "@quillsocial/lib/constants";
import { defaultAvatarSrc } from "@quillsocial/lib/defaultAvatarImage";
import {
  teamMetadataSchema,
  userMetadata,
} from "@quillsocial/prisma/zod-utils";
import type { Maybe } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

export async function getUserFromSession(
  ctx: TRPCContextInner,
  session: Maybe<Session>
) {
  const { prisma } = ctx;
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      emailVerified: true,
      bio: true,
      timeZone: true,
      weekStart: true,
      startTime: true,
      endTime: true,
      defaultScheduleId: true,
      bufferTime: true,
      theme: true,
      createdDate: true,
      hideBranding: true,
      avatar: true,
      twoFactorEnabled: true,
      disableImpersonation: true,
      identityProvider: true,
      brandColor: true,
      darkBrandColor: true,
      away: true,
      description: true,
      speakAbout: true,
      credentials: {
        select: {
          id: true,
          type: true,
          key: true,
          userId: true,
          appId: true,
          invalid: true,
        },
        orderBy: {
          id: "asc",
        },
      },

      completedOnboarding: true,
      locale: true,
      timeFormat: true,
      trialEndsAt: true,
      metadata: true,
      role: true,
      organizationId: true,
      allowDynamicBooking: true,
      organization: {
        select: {
          id: true,
          slug: true,
          metadata: true,
        },
      },
      mobile: true,
      teams: true,
    },
  });
  // some hacks to make sure `username` and `email` are never inferred as `null`
  if (!user) {
    return null;
  }

  const { email, username, id } = user;
  if (!email || !id) {
    return null;
  }
  const { currentSocialProfile } = session as any;
  const userMetaData = userMetadata.parse(user.metadata || {});
  const orgMetadata = teamMetadataSchema.parse(
    user.organization?.metadata || {}
  );
  const rawAvatar = user.avatar;
  // This helps to prevent reaching the 4MB payload limit by avoiding base64 and instead passing the avatar url
  user.avatar = rawAvatar
    ? `${WEBAPP_URL}/${user.username}/avatar.png`
    : defaultAvatarSrc({ email });
  const locale = user?.locale || ctx.locale;

  // Check if user has ADMIN role from UserPermissionRole enum
  const isAdmin = user.role === UserPermissionRole.ADMIN;

  return {
    ...user,
    organization: {
      ...user.organization,
      metadata: orgMetadata,
    },
    id,
    rawAvatar,
    email,
    username,
    locale,
    isAdmin,
    currentSocialProfile,
  };
}

export type UserFromSession = Awaited<ReturnType<typeof getUserFromSession>>;

const getSession = async (ctx: TRPCContextInner) => {
  const { req, res } = ctx;
  const { getServerSession } = await import(
    "@quillsocial/features/auth/lib/getServerSession"
  );
  return req ? await getServerSession({ req, res }) : null;
};

const getUserSession = async (ctx: TRPCContextInner) => {
  /**
   * It is possible that the session and user have already been added to the context by a previous middleware
   * or when creating the context
   */
  const session = ctx.session || (await getSession(ctx));
  const user = session ? await getUserFromSession(ctx, session) : null;

  return { user, session };
};
const sessionMiddleware = middleware(async ({ ctx, next }) => {
  const { user, session } = await getUserSession(ctx);

  return next({
    ctx: { user, session },
  });
});

export const isAuthed = middleware(async ({ ctx, next }) => {
  const { user, session } = await getUserSession(ctx);

  if (!user || !session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: { ...ctx, user, session },
  });
});

export const isAdminMiddleware = isAuthed.unstable_pipe(({ ctx, next }) => {
  const { user } = ctx;
  if (user?.role !== UserPermissionRole.ADMIN) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: user } });
});

export default sessionMiddleware;
