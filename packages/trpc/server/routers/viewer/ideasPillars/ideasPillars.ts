import { z } from "zod";
import { TRPCError } from "@trpc/server";
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { withUsageLogging } from "@quill/agent";
import prisma from "@quillsocial/prisma";

// Helper function to generate outline with proper user tracking
async function generateOutlineForUser(
  idea: string,
  tone: "friendly" | "authoritative" | "contrarian",
  userId: number
): Promise<string> {
  const agentContext = {
    prisma,
    openaiApiKey: process.env.OPENAI_API_KEY,
    logger: console,
  };

  // Use withUsageLogging directly with the correct userId
  const callOpenAI = withUsageLogging(agentContext, {
    userId,
    requestType: "expand_outline",
    model: "gpt-4o-mini",
    apiEndpoint: "/api/trpc/viewer.ideasPillars.generateOutline",
  });

  const systemPrompt = `You are a content strategist helping to expand ideas into detailed outlines.
Create a structured outline that:
- Has 3-5 main sections
- Each section has 2-4 key points
- Uses a ${tone} tone throughout
- Is suitable for social media content or blog posts
- Focuses on actionable insights and clear takeaways`;

  const userPrompt = `Expand this idea into a detailed outline:

"${idea}"

Tone: ${tone}

Provide a clear, numbered outline with sections and subsections.`;

  const response = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], {
    temperature: 0.7,
  });

  return response.text;
}

// Input schemas
const createPillarSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().default("bg-indigo-600"),
});

const updatePillarSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  order: z.number().optional(),
});

const createIdeaSchema = z.object({
  pillarId: z.string(),
  title: z.string().min(1).max(1000),
  tags: z.array(z.string()).default([]),
});

const updateIdeaSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(1000).optional(),
  pillarId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["RAW", "OUTLINED"]).optional(),
});

const saveOutlineSchema = z.object({
  ideaId: z.string(),
  text: z.string().min(30),
  tone: z.enum(["FRIENDLY", "AUTHORITATIVE", "CONTRARIAN"]).default("FRIENDLY"),
});

const generateOutlineSchema = z.object({
  ideaId: z.string(),
  tone: z.enum(["FRIENDLY", "AUTHORITATIVE", "CONTRARIAN"]).default("FRIENDLY"),
});

export const ideasPillarsRouter = router({
  // ==================== Pillars ====================

  initPillars: authedProcedure.mutation(async ({ ctx }) => {
    const defaultPillars = [
      { name: "Build in Public", color: "bg-indigo-600", order: 0 },
      { name: "Founder Lessons", color: "bg-cyan-500", order: 1 },
      { name: "Client Wins", color: "bg-green-600", order: 2 },
      { name: "Playbooks", color: "bg-orange-500", order: 3 },
    ];

    const createdPillars: any[] = [];

    for (const pillarData of defaultPillars) {
      const existing = await ctx.prisma.pillar.findUnique({
        where: {
          userId_name: {
            userId: ctx.user.id,
            name: pillarData.name,
          },
        },
      });

      if (!existing) {
        const pillar = await ctx.prisma.pillar.create({
          data: {
            userId: ctx.user.id,
            ...pillarData,
          },
        });
        createdPillars.push(pillar);
      }
    }

    return {
      created: createdPillars.length,
      pillars: createdPillars,
    };
  }),

  listPillars: authedProcedure.query(async ({ ctx }) => {
    const pillars = await ctx.prisma.pillar.findMany({
      where: {
        userId: ctx.user.id,
        deletedAt: null, // Only return non-deleted pillars
      },
      orderBy: {
        order: "asc",
      },
      include: {
        _count: {
          select: {
            ideas: true,
          },
        },
      },
    });

    return pillars;
  }),

  createPillar: authedProcedure
    .input(createPillarSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if pillar with same name exists
      const existing = await ctx.prisma.pillar.findUnique({
        where: {
          userId_name: {
            userId: ctx.user.id,
            name: input.name,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pillar with this name already exists",
        });
      }

      // Get max order
      const maxOrder = await ctx.prisma.pillar.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const pillar = await ctx.prisma.pillar.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
          order: (maxOrder?.order ?? -1) + 1,
        },
      });

      return pillar;
    }),

  updatePillar: authedProcedure
    .input(updatePillarSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const pillar = await ctx.prisma.pillar.findFirst({
        where: {
          id,
          userId: ctx.user.id,
        },
      });

      if (!pillar) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pillar not found",
        });
      }

      const updated = await ctx.prisma.pillar.update({
        where: { id },
        data,
      });

      return updated;
    }),

  deletePillar: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const pillar = await ctx.prisma.pillar.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
          deletedAt: null,
        },
      });

      if (!pillar) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pillar not found",
        });
      }

      // Soft delete pillar
      await ctx.prisma.pillar.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  // ==================== Ideas ====================

  listIdeas: authedProcedure
    .input(
      z.object({
        pillarId: z.string().optional(),
        status: z.enum(["RAW", "OUTLINED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const ideas = await ctx.prisma.idea.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.pillarId && { pillarId: input.pillarId }),
          ...(input.status && { status: input.status }),
        },
        include: {
          pillar: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          outline: {
            select: {
              id: true,
              text: true,
              tone: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return ideas;
    }),

  getIdea: authedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const idea = await ctx.prisma.idea.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        include: {
          pillar: true,
          outline: true,
        },
      });

      if (!idea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      return idea;
    }),

  createIdea: authedProcedure
    .input(createIdeaSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify pillar exists and belongs to user
      const pillar = await ctx.prisma.pillar.findFirst({
        where: {
          id: input.pillarId,
          userId: ctx.user.id,
        },
      });

      if (!pillar) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pillar not found",
        });
      }

      const idea = await ctx.prisma.idea.create({
        data: {
          userId: ctx.user.id,
          pillarId: input.pillarId,
          title: input.title,
          tags: input.tags,
          status: "RAW",
        },
        include: {
          pillar: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      return idea;
    }),

  updateIdea: authedProcedure
    .input(updateIdeaSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const idea = await ctx.prisma.idea.findFirst({
        where: {
          id,
          userId: ctx.user.id,
        },
      });

      if (!idea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      // If changing pillar, verify new pillar exists
      if (data.pillarId) {
        const pillar = await ctx.prisma.pillar.findFirst({
          where: {
            id: data.pillarId,
            userId: ctx.user.id,
          },
        });

        if (!pillar) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pillar not found",
          });
        }
      }

      const updated = await ctx.prisma.idea.update({
        where: { id },
        data,
        include: {
          pillar: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          outline: {
            select: {
              id: true,
              text: true,
              tone: true,
            },
          },
        },
      });

      return updated;
    }),

  deleteIdea: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const idea = await ctx.prisma.idea.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (!idea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      // Delete idea (will cascade delete outline)
      await ctx.prisma.idea.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ==================== Outlines ====================

  saveOutline: authedProcedure
    .input(saveOutlineSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify idea exists and belongs to user
      const idea = await ctx.prisma.idea.findFirst({
        where: {
          id: input.ideaId,
          userId: ctx.user.id,
        },
      });

      if (!idea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      // Upsert outline
      const outline = await ctx.prisma.outline.upsert({
        where: {
          ideaId: input.ideaId,
        },
        create: {
          ideaId: input.ideaId,
          text: input.text,
          tone: input.tone,
        },
        update: {
          text: input.text,
          tone: input.tone,
        },
      });

      // Update idea status to OUTLINED
      await ctx.prisma.idea.update({
        where: { id: input.ideaId },
        data: { status: "OUTLINED" },
      });

      return outline;
    }),

  generateOutline: authedProcedure
    .input(generateOutlineSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify idea exists and belongs to user
      const idea = await ctx.prisma.idea.findFirst({
        where: {
          id: input.ideaId,
          userId: ctx.user.id,
        },
        include: {
          pillar: true,
        },
      });

      if (!idea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      try {
        // Validate we have the idea title
        if (!idea.title || idea.title.trim().length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Idea title is empty",
          });
        }

        // Convert tone from uppercase to lowercase
        const tone = input.tone.toLowerCase() as "friendly" | "authoritative" | "contrarian";

        console.log("Generating outline:", {
          ideaId: idea.id,
          userId: ctx.user.id,
          tone
        });

        // Generate outline with proper user tracking
        const outlineText = await generateOutlineForUser(idea.title, tone, ctx.user.id);

        console.log("Outline generated successfully");
        console.log("Generated outline length:", outlineText.length);
        console.log("Generated outline preview:", outlineText.substring(0, 100));

        return {
          text: outlineText,
          tone: input.tone,
        };
      } catch (error) {
        console.error("Error generating outline:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate outline. Please try again.",
        });
      }
    }),

  deleteOutline: authedProcedure
    .input(z.object({ ideaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify idea exists and belongs to user
      const idea = await ctx.prisma.idea.findFirst({
        where: {
          id: input.ideaId,
          userId: ctx.user.id,
        },
      });

      if (!idea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      // Delete outline if exists
      await ctx.prisma.outline.deleteMany({
        where: { ideaId: input.ideaId },
      });

      // Update idea status back to RAW
      await ctx.prisma.idea.update({
        where: { id: input.ideaId },
        data: { status: "RAW" },
      });

      return { success: true };
    }),
});
