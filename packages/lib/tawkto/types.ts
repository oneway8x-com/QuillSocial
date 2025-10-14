/**
 * Tawk.to Live Chat Integration Types
 * Based on official Tawk.to JavaScript API documentation
 */

export interface TawkToVisitor {
  name?: string | { first: string; last: string };
  email?: string;
  phone?: string;
  [key: string]: any; // For custom attributes
}

export interface TawkToConfig {
  /** Your Tawk.to Property ID (required) */
  propertyId: string;
  /** Your Tawk.to Widget ID (required) */
  widgetId: string;
  /** Whether to auto-start the connection (default: true) */
  autoStart?: boolean;
  /** Custom z-index for the widget */
  zIndex?: number | string;
  /** Visitor information to pre-populate */
  visitor?: TawkToVisitor;
  /** Whether to enable secure mode */
  secureMode?: boolean;
  /** Hash for secure mode (required if secureMode is true) */
  hash?: string;
}

export interface TawkToAPI {
  // Connection methods
  start(options?: { showWidget?: boolean }): void;
  shutdown(): void;
  switchWidget(data: { propertyId: string; widgetId: string }, callback?: (error?: any) => void): void;

  // Authentication
  login(data: TawkToVisitor & { hash: string; userId: string }, callback?: (error?: any) => void): void;
  logout(callback?: (error?: any) => void): void;

  // Widget control
  maximize(): void;
  minimize(): void;
  toggle(): void;
  popup(): void;
  showWidget(): void;
  hideWidget(): void;
  toggleVisibility(): void;
  endChat(): void;

  // Status methods
  getStatus(): 'online' | 'away' | 'offline';
  getWindowType(): 'inline' | 'embed';
  isChatMaximized(): boolean;
  isChatMinimized(): boolean;
  isChatHidden(): boolean;
  isChatOngoing(): boolean;
  isVisitorEngaged(): boolean;

  // Data methods
  setAttributes(attributes: Record<string, any>, callback?: (error?: any) => void): void;
  addEvent(eventName: string, metadata?: Record<string, any>, callback?: (error?: any) => void): void;
  addTags(tags: string[], callback?: (error?: any) => void): void;
  removeTags(tags: string[], callback?: (error?: any) => void): void;

  // Configuration
  visitor?: TawkToVisitor;
  customStyle?: { zIndex: number | string };
  autoStart?: boolean;

  // Event callbacks
  onLoad?: () => void;
  onStatusChange?: (status: 'online' | 'away' | 'offline') => void;
  onBeforeLoad?: () => void;
  onChatMaximized?: () => void;
  onChatMinimized?: () => void;
  onChatHidden?: () => void;
  onChatStarted?: () => void;
  onChatEnded?: () => void;
  onPrechatSubmit?: (data: any) => void;
  onOfflineSubmit?: (data: { name: string; email: string; message: string; questions: any[] }) => void;
  onChatMessageVisitor?: (message: string) => void;
  onChatMessageAgent?: (message: string) => void;
  onChatMessageSystem?: (message: string) => void;
  onAgentJoinChat?: (data: { name: string; position: string; image: string; id: string }) => void;
  onAgentLeaveChat?: (data: { name: string; id: string }) => void;

  // Additional methods to get visitor info
  getVisitorInfo?: () => TawkToVisitor | null;
  onChatSatisfaction?: (satisfaction: -1 | 0 | 1) => void;
  onVisitorNameChanged?: (visitorName: string) => void;
  onFileUpload?: (link: string) => void;
  onTagsUpdated?: (data: any) => void;
}

declare global {
  interface Window {
    Tawk_API?: TawkToAPI;
    Tawk_LoadStart?: Date;
  }
}

export type TawkToStatus = 'online' | 'away' | 'offline';
export type TawkToWindowType = 'inline' | 'embed';
export type TawkToSatisfaction = -1 | 0 | 1; // dislike | neutral | like
