export * from "@trpc/react-query/shared";

/**
 * We deploy our tRPC router on multiple lambdas to keep number of imports as small as possible
 * TODO: Make this dynamic based on folders in trpc server?
 */
export const ENDPOINTS = [
  "apiKeys",
  "appRoutingForms",
  "apps",
  "auth",
  "deploymentSetup",
  "features",
  "insights",
  "payments",
  "public",
  "saml",
  "teams",
  "organizations",
  "users",
  "viewer",
  "webhook",
  "workflows",
  "appsRouter",
  "googleWorkspace",
  "visitorLocations",
  "billings",
  "documents",
  "socials",
  "openaiUsage",
  "xConnect",
  "notifications",
  "postFactory",
] as const;
