// Re-export DB types
export type { User, Project, ProjectVersion, Deployment, AiChatHistory } from '@/lib/db/schema';
import type { Project } from '@/lib/db/schema';

// GrapesJS types
export interface GrapesJSData {
  html?: string;
  css?: string;
  components?: GrapesJSComponent[];
  styles?: GrapesJSStyle[];
  assets?: GrapesJSAsset[];
  [key: string]: unknown;
}

export interface GrapesJSComponent {
  type?: string;
  tagName?: string;
  content?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  components?: GrapesJSComponent[];
  style?: Record<string, string>;
  [key: string]: unknown;
}

export interface GrapesJSStyle {
  selectors?: Array<string | { name: string; type: number }>;
  style?: Record<string, string>;
  [key: string]: unknown;
}

export interface GrapesJSAsset {
  type?: string;
  src?: string;
  unitDim?: string;
  height?: number;
  width?: number;
  [key: string]: unknown;
}

// Page types
export interface Page {
  id: string;
  name: string;
  slug: string;
  html?: string;
  css?: string;
  grapejsJson?: GrapesJSData;
  isHome?: boolean;
  meta?: PageMeta;
}

export interface PageMeta {
  title?: string;
  description?: string;
  ogImage?: string;
  [key: string]: unknown;
}

// Project meta
export interface ProjectMeta {
  favicon?: string;
  fonts?: string[];
  scripts?: string[];
  customHead?: string;
  [key: string]: unknown;
}

// Deployment status
export type DeploymentStatus = 'pending' | 'building' | 'ready' | 'error' | 'canceled';

// AI Chat
export interface ChatAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 for images, raw text for text files
  isImage: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'edit' | 'message';
  applied?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentsDiff?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stylesDiff?: any;
  attachments?: ChatAttachment[];
  timestamp: Date;
}

export interface AIContext {
  projectId: number;
  currentPage?: string;
  selectedComponent?: GrapesJSComponent;
  grapejsJson?: GrapesJSData;
}

export interface AIChatRequest {
  message: string;
  projectId: string;
  pageIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedComponentJson?: any;
  mode: 'page' | 'component';
  history: Array<{ role: string; content: string }>;
}

export interface AIChatResponse {
  type: 'edit' | 'message';
  explanation: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentsDiff: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stylesDiff: any | null;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
}

export interface ProjectWithVersionCount {
  project: Project;
  versionsCount: number;
}
