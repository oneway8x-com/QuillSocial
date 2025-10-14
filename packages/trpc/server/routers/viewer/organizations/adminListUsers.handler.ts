import type { TrpcSessionUser } from "../../../trpc";
import type { TAdminListUsersInputSchema } from "./adminListUsers.schema";
import type { Prisma } from "@prisma/client";
import { prisma } from "@quillsocial/prisma";
import { UserPermissionRole } from "@quillsocial/prisma/enums";

type AdminListUsersOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TAdminListUsersInputSchema;
};

export const adminListUsersHandler = async ({ ctx, input }: AdminListUsersOptions) => {
  const { page, pageSize, search, role, sortBy, sortOrder } = input;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const whereConditions: Prisma.UserWhereInput[] = [];

  // Filter by role if specified
  if (role && role !== "ALL") {
    whereConditions.push({
      role: role as UserPermissionRole,
    });
  }

  // Search filter
  if (search && search.trim().length > 0) {
    whereConditions.push({
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.UserWhereInput = whereConditions.length > 0 ? { AND: whereConditions } : {};

  // Build orderBy clause
  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  // Fetch users with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        avatar: true,
        createdDate: true,
        emailVerified: true,
        identityProvider: true,
        completedOnboarding: true,
        verified: true,
        twoFactorEnabled: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        teams: {
          where: {
            accepted: true,
          },
          select: {
            id: true,
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasMore: skip + pageSize < total,
  };
};
