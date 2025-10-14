import { mergeRouters, router } from "../../trpc";
import { loggedInViewerRouter } from "../loggedInViewer/_router";
import { publicViewerRouter } from "../publicViewer/_router";
import { viewerAdminRouter } from "./admin/_router";
import { appsRouter } from "./apps/_router";
import { authRouter } from "./auth/_router";
import { billingsRouter } from "./billings/_router";
import { googleWorkspaceRouter } from "./googleWorkspace/_router";
import { notificationsRouter } from "./notifications/_router";
import { openaiUsageRouter } from "./openaiUsage";
import { viewerOrganizationsRouter } from "./organizations/_router";
import { socialsRouter } from "./socials/_router";
import { viewerTeamsRouter } from "./teams/_router";
import { xConnectRouter } from "./xConnect";
import { threadsConnectRouter } from "./threadsConnect";

export const viewerRouter = mergeRouters(
  loggedInViewerRouter,
  router({
    loggedInViewerRouter,
    public: publicViewerRouter,
    auth: authRouter,
    googleWorkspace: googleWorkspaceRouter,
    teams: viewerTeamsRouter,
    organizations: viewerOrganizationsRouter,
    admin: viewerAdminRouter,
    appsRouter: appsRouter,
    billings: billingsRouter,
    socials: socialsRouter,
    openaiUsage: openaiUsageRouter,
    xConnect: xConnectRouter,
    threadsConnect: threadsConnectRouter,
    notifications: notificationsRouter,
  })
);
