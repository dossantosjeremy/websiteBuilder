import { pgTable, serial, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  authUserId: text('auth_user_id').unique().notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  grapejsJson: jsonb('grapesjs_json').notNull().default({}),
  pages: jsonb('pages').default([]),
  meta: jsonb('meta').default({}),
  thumbnail: text('thumbnail'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projectVersions = pgTable('project_versions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id),
  userId: integer('user_id').references(() => users.id),
  grapejsJson: jsonb('grapesjs_json').notNull(),
  pages: jsonb('pages').default([]),
  label: text('label'),
  triggeredBy: text('triggered_by').default('manual'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const deployments = pgTable('deployments', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id),
  vercelDeploymentId: text('vercel_deployment_id'),
  url: text('url'),
  status: text('status'),
  deployedAt: timestamp('deployed_at').defaultNow(),
});

export const aiChatHistory = pgTable('ai_chat_history', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id),
  userId: integer('user_id').references(() => users.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  contextSnapshot: jsonb('context_snapshot'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type ProjectVersion = InferSelectModel<typeof projectVersions>;
export type NewProjectVersion = InferInsertModel<typeof projectVersions>;

export type Deployment = InferSelectModel<typeof deployments>;
export type NewDeployment = InferInsertModel<typeof deployments>;

export type AiChatHistory = InferSelectModel<typeof aiChatHistory>;
export type NewAiChatHistory = InferInsertModel<typeof aiChatHistory>;
