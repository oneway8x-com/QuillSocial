import { z } from "zod";

export const ZAdminListUsersInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "ALL"]).optional().default("ALL"),
  sortBy: z.enum(["email", "name", "createdDate", "role"]).optional().default("createdDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type TAdminListUsersInputSchema = z.infer<typeof ZAdminListUsersInputSchema>;
