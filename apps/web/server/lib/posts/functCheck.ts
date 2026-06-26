import dayjs from "@quillsocial/dayjs";
import prisma from "@quillsocial/prisma";
import { BillingType } from "@quillsocial/prisma/enums";

//functions use to check billing
export const getUserStats = async (userId: number) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const countPost = await prisma.post.count({
    where: {
      userId: userId,
      createdDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const accounts = await prisma.credential.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      appId: true,
      emailOrUserName: true,
    },
  });

  const countAccount = accounts.length > 0 ? accounts.length : 0;

  return {
    countAccount,
    countPost,
  };
};
export const isWithinMonthLimit = (dateTime: any, monthLimit: any) => {
  const today = dayjs();
  const selectedDate = dayjs(dateTime);
  const diffInMonths = selectedDate.diff(today, "month");
  return diffInMonths <= monthLimit;
};

//  export const getConditionToUpgrade = (data: any, type: string) => {
//     const nAccount = data?.countAccount;
//     const nPost = data?.countPost;
//     if (type === BillingType.FREE_TIER) {
//       return {
//         accountIsTrue: nAccount < 1,
//         postIsTrue: nPost < 12,
//         month: 1,
//       };
//     } else if (type === BillingType.BUSINESS) {
//       return {
//         accountIsTrue: nAccount < 5,
//         postIsTrue: nPost < 300,
//         month: 12,
//       };
//     } else if (type === BillingType.UNLIMITED) {
//       return {
//         accountIsTrue: true,
//         postIsTrue: true,
//         month: Infinity,
//       };
//     }
//     return {};
//   };
