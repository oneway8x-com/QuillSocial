import { z } from "zod";
import type { Tool, AgentContext } from "./types";

/**
 * Input schema for schedulePostTool
 */
const SchedulePostInputSchema = z.object({
  channel: z.enum(["linkedin", "x", "carousel", "shorts", "blog"]),
  title: z.string().min(1, "Title cannot be empty"),
  whenISO: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO date string",
  }),
});

type SchedulePostInput = z.infer<typeof SchedulePostInputSchema>;

/**
 * Output type for schedulePostTool
 */
type SchedulePostOutput = {
  id: string;
  channel: string;
  title: string;
  scheduledAt: string;
  status: "scheduled";
};

/**
 * Tool that schedules a post for publication.
 */
export const schedulePostTool: Tool<SchedulePostInput, SchedulePostOutput> = {
  name: "schedulePost",
  description: "Schedules a post for publication on a specified channel at a given date/time. Accepts ISO date strings for scheduling.",
  schema: SchedulePostInputSchema,
  run: async (args, ctx: AgentContext): Promise<SchedulePostOutput> => {
    const { channel, title, whenISO } = args;

    ctx.logger?.info("Scheduling post", { channel, title, whenISO });

    // Validate the date is in the future
    const scheduledDate = new Date(whenISO);
    const now = new Date();

    if (scheduledDate <= now) {
      throw new Error("Scheduled date must be in the future");
    }

    // TODO: Replace with actual database insert
    // const post = await ctx.prisma.scheduledPost.create({
    //   data: {
    //     channel,
    //     title,
    //     scheduledAt: scheduledDate,
    //     status: 'scheduled',
    //     userId: ...,
    //   },
    // });

    // Mock implementation
    const mockId = `post_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    ctx.logger?.info("Post scheduled successfully", {
      id: mockId,
      channel,
      scheduledAt: whenISO
    });

    return {
      id: mockId,
      channel,
      title,
      scheduledAt: whenISO,
      status: "scheduled",
    };
  },
};
