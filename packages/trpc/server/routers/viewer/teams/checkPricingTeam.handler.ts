import { TrpcSessionUser } from "../../../trpc";
import { getReminderType, getDayTrial } from "../payments/remdinder-type";
import { getFirstOrCreateOrgOfUserHandler } from "./getFirstOrCreateOrgOfUser.handler";
import { prisma } from "@quillsocial/prisma";
import { BillingType, UserPermissionRole } from "@quillsocial/prisma/enums";

type GetPricingTeamOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
};

export const getPricingTeamHanlder = async ({ ctx }: GetPricingTeamOptions) => {
  if (!ctx.user || !ctx.user.id) {
    throw new Error("Invalid user");
  }
  const userId = ctx.user.id;

  const timeZone = ctx.user.timeZone;

  // Check if user is ADMIN - skip reminders for admins
  if (ctx.user.role === UserPermissionRole.ADMIN) {
    return {
      day: 0,
      isOwner: true,
      isRemind: false,
      dayTrial: 0,
      billings: 0,
      isLTD: false,
      maxLTDSubs: 1,
    };
  }

  const member = await prisma.membership.findFirst({
    where: {
      userId,
    },
    select: {
      teamId: true,
      role: true,

      team: {
        select: {
          startTrialDate: true,
          members: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  const teamId = member?.teamId;
  if (!teamId) {
    throw new Error("Invalid team");
  }
  const isOwner = member.role === "ADMIN" || member.role === "OWNER";
  let isLTD = false;
  let maxLTDSubs = 1;

  const billings = await prisma.billing.findMany({
    where: {
      teamId: teamId,
      status: "ACTIVE",
      OR: [{ type: "PER_USER" }, { type: "LTD" }],
    },
    select: {
      id: true,
      quantity: true,
      paymentId: true,
      type: true,
    },
  });

  if (!member.team?.startTrialDate) {
    await prisma.team.update({
      where: {
        id: member.teamId,
      },
      data: {
        startTrialDate: new Date(),
      },
    });
  }
  const quantity = sumArray(billings.map((x: any) => x.quantity));
  const reminderType = getReminderType(
    member.team?.startTrialDate ?? new Date(),
    timeZone
  );
  const dayTrial = getDayTrial(
    member.team?.startTrialDate ?? new Date(),
    timeZone
  );
  let isRemind = true;
  const teamLength = (member.team as any)?.members?.length ?? 1;

  if (
    billings &&
    billings.length > 0 &&
    (billings[0].paymentId === "LTD" || billings[0].type === "LTD")
  ) {
    //Check LTD
    isRemind = false;
    isLTD = true;
    maxLTDSubs = billings[0].quantity;
  } else if (quantity >= teamLength) {
    isRemind = false;
  } else {
    isRemind = reminderType !== 0;
  }
  if (!billings || billings.length == 0) {
    isRemind = true;
  }
  return {
    day: reminderType,
    isOwner: isOwner,
    isRemind: isRemind,
    dayTrial: dayTrial,
    billings: billings.length,
    isLTD,
    maxLTDSubs,
  };
};

const isUserOwnerOfTeam = (team: any, userId: any) => {
  if (!team || !team.members || !userId) {
    return false;
  }
  for (const member of team.members) {
    if (member.id === userId && member.role === "OWNER") {
      return true;
    }
  }
  return false;
};

function sumArray(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

const findOwnerUserOfTeam = (team: any) => {
  if (!team || !team.members) {
    return null;
  }
  for (const member of team.members) {
    if (member.role === "OWNER") {
      return member;
    }
  }
  return null;
};
