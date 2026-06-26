import type { Tool } from "./types";
import { expandOutlineTool, generatePostsTool } from "./tools.content";
import { listTargetsTool, scoreFeedTool } from "./tools.engage";
import { schedulePostTool } from "./tools.schedule";

/**
 * Returns content-related tools for agent registration.
 * Includes tools for expanding outlines and generating platform-specific posts.
 */
export function contentTools(): Tool<any, any>[] {
  return [expandOutlineTool, generatePostsTool];
}

/**
 * Returns engagement-related tools for agent registration.
 * Includes tools for listing targets and scoring feed items.
 */
export function engagementTools(): Tool<any, any>[] {
  return [listTargetsTool, scoreFeedTool];
}

/**
 * Returns scheduling-related tools for agent registration.
 * Includes tools for scheduling posts across platforms.
 */
export function scheduleTools(): Tool<any, any>[] {
  return [schedulePostTool];
}

/**
 * Returns all available tools for agent registration.
 */
export function allTools(): Tool<any, any>[] {
  return [...contentTools(), ...engagementTools(), ...scheduleTools()];
}
