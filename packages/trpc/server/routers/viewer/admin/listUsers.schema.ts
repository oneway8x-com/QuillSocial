import { z } from "zod";

export const ZListUsersInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  search: z.string().optional().default(""),
  role: z.enum(["USER", "ADMIN", "ALL"]).default("ALL"),
  sortBy: z.enum(["email", "name", "createdDate", "role"]).default("createdDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TListUsersInputSchema = z.infer<typeof ZListUsersInputSchema>;
