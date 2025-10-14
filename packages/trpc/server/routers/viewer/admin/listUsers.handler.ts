import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import type { TListUsersInputSchema } from "./listUsers.schema";
import { UserPermissionRole } from "@quillsocial/prisma/enums";

type ListUsersOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TListUsersInputSchema;
};

export const listUsersHandler = async ({ ctx, input }: ListUsersOptions) => {
  const { prisma } = await import("@quillsocial/prisma");

  const { page, pageSize, search, role, sortBy, sortOrder } = input;

  // Build where clause
  const where: any = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }

  // Role filter
  if (role !== "ALL") {
    where.role = role === "ADMIN" ? UserPermissionRole.ADMIN : UserPermissionRole.USER;
  }

  // Count total users matching criteria
  const total = await prisma.user.count({ where });

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const totalPages = Math.ceil(total / pageSize);

  // Build orderBy
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  // Fetch users
  const users = await prisma.user.findMany({
    where,
    skip,
    take: pageSize,
    orderBy,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      emailVerified: true,
      avatar: true,
      role: true,
      createdDate: true,
      completedOnboarding: true,
      twoFactorEnabled: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    users,
    total,
    page,
    pageSize,
    totalPages,
  };
};
