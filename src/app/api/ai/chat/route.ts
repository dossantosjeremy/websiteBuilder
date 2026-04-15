import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiChatLimiter } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { projects, projectVersions, aiChatHistory, appSettings } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getLocalUser } from '@/lib/auth';
import { trimToTokenLimit } from '@/lib/token-utils';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const attachmentSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  data: z.string(), // base64 for images, plain text for text files
  isImage: z.boolean(),
});

const chatRequestSchema = z.object({
  message: z.string().min(1),
  projectId: z.string(),
  pageIndex: z.number().int().min(0),
  selectedComponentJson: z.unknown().optional(),
  mode: z.enum(['page', 'component']),
  attachments: z.array(attachmentSchema).optional(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    // no auth check needed — local mode
    // Rate limiting: 30 req/min per user
    const rateCheck = aiChatLimiter('local');
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many AI requests. Please slow down.' },
        {
          status: 429,
          headers: { 'X-RateLimit-Reset': rateCheck.reset.toISOString() },
        }
      );
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, projectId, pageIndex, selectedComponentJson, mode, history, attachments } = parsed.data;

    const projectIdNum = parseInt(projectId);
    if (isNaN(projectIdNum)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const dbUser = await getLocalUser();

    // ── Load user's AI settings from DB (key entered via Settings UI) ──
    // Wrap in try/catch — table may not exist yet on first deploy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let settings: Record<string, any> = {};
    try {
      // Ensure the table exists before querying it
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS app_settings (
          id         SERIAL PRIMARY KEY,
          user_id    INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          data       JSONB NOT NULL DEFAULT '{}',
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      const [settingsRow] = await db.select().from(appSettings).where(eq(appSettings.userId, dbUser.id));
      settings = (settingsRow?.data ?? {}) as Record<string, any>;
    } catch (e) {
      console.warn('Could not load settings from DB, using env var fallback:', e);
    }

    const aiProvider: string = settings.aiProvider ?? 'anthropic';
    const aiApiKey: string = settings.aiApiKey ?? process.env.ANTHROPIC_API_KEY ?? '';

    if (!aiApiKey) {
      return NextResponse.json(
        { error: 'No AI API key configured. Add your key in Settings (gear icon at top right).' },
        { status: 400 }
      );
    }

    // Build the model based on provider choice
    let model;
    if (aiProvider === 'openai') {
      const openai = createOpenAI({ apiKey: aiApiKey });
      model = openai('gpt-4o');
    } else {
      const anthropic = createAnthropic({ apiKey: aiApiKey });
      model = anthropic('claude-sonnet-4-6');
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectIdNum), eq(projects.userId, dbUser.id)));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Build context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectMeta = (project.meta as any) ?? {};
    const siteType: string = projectMeta.siteType ?? 'website';
    const projectPages = (project.pages as Array<{ name?: string }>) ?? [];
    const currentPage = projectPages[pageIndex];
    const pageName = currentPage?.name ?? `Page ${pageIndex + 1}`;

    let contextContent = '';
    if (mode === 'page') {
      contextContent = trimToTokenLimit(currentPage, 8000);
    } else if (mode === 'component' && selectedComponentJson) {
      contextContent = JSON.stringify(selectedComponentJson);
    }

    const isComponentMode = mode === 'component' && selectedComponentJson != null;

    const systemPrompt = `You are an expert web designer and developer assistant embedded in a WYSIWYG website builder powered by GrapesJS.

CRITICAL: Your entire response must be a single raw JSON object. No markdown, no code fences, no backticks, no explanation outside JSON. Start your response with { and end with }.

When making changes, respond with:
{"type":"edit","explanation":"Brief plain-English description","componentsDiff":[...],"stylesDiff":[...]}

When answering questions only (no changes), respond with:
{"type":"message","explanation":"Your answer here","componentsDiff":null,"stylesDiff":null}

${isComponentMode ? `
COMPONENT MODE — CRITICAL SCOPE RULE:
The user has selected a SPECIFIC component. You must ONLY modify that one component.
- componentsDiff must contain exactly ONE component object: the updated version of the selected component below.
- Do NOT return the full page. Do NOT add siblings or wrappers outside the selected component.
- Only change what the user asked about within that component.
- Keep all unmentioned parts of the selected component intact.
Selected component to modify:
${contextContent}
` : `
PAGE MODE:
You are editing the full page. componentsDiff is the complete new components array for the page.
${contextContent ? `Current page context:\n${contextContent}` : ''}
`}

Rules:
- Output ONLY raw JSON. Never wrap in \`\`\`json or any markdown.
- explanations must be 1-3 sentences of plain English
- componentsDiff must be a valid GrapesJS components array when type is "edit"

GRAPESJS COMPONENT FORMAT — CRITICAL:
Every element must be a component object with tagName + components[] children. NEVER put HTML strings in "content" for container elements.

CORRECT (nested component tree):
{"tagName":"section","attributes":{"style":"background:#1a1a1a;padding:80px 20px"},"components":[
  {"tagName":"h1","type":"text","attributes":{"style":"color:#fff;font-size:48px"},"components":[{"type":"textnode","content":"Welcome"}]},
  {"tagName":"p","type":"text","attributes":{"style":"color:#ccc"},"components":[{"type":"textnode","content":"Subtitle text here"}]},
  {"tagName":"a","attributes":{"href":"#","style":"background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;display:inline-block"},"components":[{"type":"textnode","content":"Get Started"}]}
]}

WRONG (never do this — raw HTML in content):
{"tagName":"div","content":"<h1>Hello</h1><p>World</p>"}

Rules for text:
- Text nodes: {"type":"textnode","content":"plain text only, no HTML tags"}
- Inline text elements (span, a, strong, em): use components[] with textnode children
- Never use "content" with HTML tags — always decompose into nested tagName objects

Styling: use attributes.style with inline CSS. Use hex colors, px/rem units.
- Current project: ${project.name} | Page: ${pageName} | Site type: ${siteType}`;

    // Build the user message content — multi-modal when attachments are present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userContent: any = message;
    if (attachments && attachments.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts: any[] = [{ type: 'text', text: message }];
      for (const att of attachments) {
        if (att.isImage) {
          parts.push({
            type: 'image',
            image: att.data, // base64 string
            mimeType: att.mimeType,
          });
        } else {
          // Text file — include as context text
          parts.push({
            type: 'text',
            text: `\n\n[Attached file: ${att.name}]\n${att.data}`,
          });
        }
      }
      userContent = parts;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: Array<{ role: 'user' | 'assistant'; content: any }> = [
      ...history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: userContent },
    ];

    console.log('[AI] provider:', aiProvider, '| model: claude-sonnet-4-6 | key prefix:', aiApiKey.slice(0, 10));

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
    });

    // Collect the full text for post-stream processing
    let fullText = '';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          let chunkCount = 0;
          // Use fullStream instead of textStream so error events are surfaced
          // rather than silently discarded (which caused empty responses / "Done.")
          for await (const event of result.fullStream) {
            if (event.type === 'text-delta') {
              chunkCount++;
              fullText += event.text;
              const data = JSON.stringify({ chunk: event.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (event.type === 'error') {
              throw event.error;
            }
          }
          console.log('[AI] stream done, chunks:', chunkCount, '| text length:', fullText.length);

          // Parse the final response — strip markdown code fences if Claude added them
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let parsedResult: any = null;
          const cleanText = fullText
            .trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```\s*$/, '')
            .trim();
          try {
            parsedResult = JSON.parse(cleanText);
          } catch {
            // Try to extract JSON from within the text (e.g. if there's preamble text)
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsedResult = JSON.parse(jsonMatch[0]);
              } catch { /* fall through */ }
            }
            if (!parsedResult) {
              parsedResult = {
                type: 'message',
                explanation: cleanText,
                componentsDiff: null,
                stylesDiff: null,
              };
            }
          }

          // Send done event
          const doneData = JSON.stringify({ done: true, result: parsedResult });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          // Post-stream: save version snapshot if edit
          if (parsedResult?.type === 'edit') {
            try {
              const versionLabel = `AI: ${message.slice(0, 60)}`;
              const grapejsJson = project.grapejsJson as Record<string, unknown>;
              await db.insert(projectVersions).values({
                projectId: projectIdNum,
                userId: dbUser.id,
                grapejsJson,
                pages: (project.pages as unknown[]) ?? [],
                label: versionLabel,
                triggeredBy: 'ai',
              });
            } catch (versionErr) {
              console.error('Failed to save AI version:', versionErr);
            }
          }

          // Save chat history (user message)
          try {
            await db.insert(aiChatHistory).values({
              projectId: projectIdNum,
              userId: dbUser.id,
              role: 'user',
              content: message,
              contextSnapshot: { mode, pageIndex },
            });

            // Save assistant response
            await db.insert(aiChatHistory).values({
              projectId: projectIdNum,
              userId: dbUser.id,
              role: 'assistant',
              content: parsedResult?.explanation ?? fullText,
              contextSnapshot: { type: parsedResult?.type },
            });
          } catch (histErr) {
            console.error('Failed to save chat history:', histErr);
          }
        } catch (streamErr) {
          console.error('Stream error:', streamErr);
          const errMsg = streamErr instanceof Error ? streamErr.message : String(streamErr);
          const errData = JSON.stringify({ error: errMsg });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/ai/chat error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
