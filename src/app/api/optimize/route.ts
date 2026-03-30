import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { SYSTEM_PROMPT, SUGGESTION_PROMPT, OPTIMIZE_PROMPT, COVER_LETTER_PROMPT, INTERVIEW_QUESTIONS_PROMPT } from '@/lib/ai-prompts';
import { parseAIResponse, parseSuggestionResponse } from '@/lib/resume-optimizer';
import { analyzeResumeATS } from '@/lib/ats-checker';
import { checkCredits, consumeCredits, reserveCredits, refundCredits } from '@/lib/credit';
import prisma from '@/lib/db';
import type { StreamChunk, ResumeSuggestion, OptimizedResume } from '@/types/resume';

// MiniMax API endpoint
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

// Simple LRU cache for optimization results
type CacheEntry = { result: { optimized: OptimizedResume; suggestion?: ResumeSuggestion }; timestamp: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(resumeText: string, jobDescription: string): string {
  // Simple hash-based cache key
  const str = resumeText.slice(0, 500) + '|' + (jobDescription || '').slice(0, 200);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

function getCachedResult(resumeText: string, jobDescription: string): { optimized: OptimizedResume; suggestion?: ResumeSuggestion } | null {
  const key = getCacheKey(resumeText, jobDescription);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    cache.delete(key); // Move to end (LRU)
    cache.set(key, cached);
    return cached.result;
  }
  cache.delete(key);
  return null;
}

function setCachedResult(resumeText: string, jobDescription: string, result: { optimized: OptimizedResume; suggestion?: ResumeSuggestion }) {
  const key = getCacheKey(resumeText, jobDescription);
  if (cache.size >= 50) {
    // Remove oldest entry (first in Map)
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { result, timestamp: Date.now() });
}

const FETCH_TIMEOUT_MS = 30000; // 30 seconds

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = FETCH_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`请求超时（${timeoutMs / 1000}秒），请检查网络连接后重试`);
    }
    throw error;
  }
}

async function callMiniMaxAPI(
  prompt: string,
  systemPrompt: string = SYSTEM_PROMPT,
  stream: boolean = true,
  maxTokens: number = 8192,
  retries: number = 3
): Promise<Response> {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY is not configured');
  }

  let lastError = new Error('Unknown error');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[MiniMax] API attempt ${attempt}/${retries}`);

      // Using MiniMax's chat completion API
      const response = await fetchWithTimeout(`${MINIMAX_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.7',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
          stream: stream,
          response_format: { type: "json_object" },
          group_id: process.env.MINIMAX_GROUP_ID,
        }),
        timeoutMs: FETCH_TIMEOUT_MS,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.base_resp?.status_msg) {
            errorMsg = errorJson.base_resp.status_msg;
            if (errorMsg === 'insufficient balance') {
              errorMsg = 'API 余额不足，请充值后再试';
            }
          }
        } catch {}
        throw new Error(`MiniMax API error: ${response.status} - ${errorMsg}`);
      }

      console.log(`[MiniMax] API attempt ${attempt} succeeded`);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[MiniMax] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < retries) {
        const backoffMs = 1000 * attempt; // 1s, 2s, 3s
        console.log(`[MiniMax] Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError;
}

async function* streamAIResponse(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response body');
  }

  const decoder = new TextDecoder();
  let chunkCount = 0;
  let totalContentLength = 0;

  console.log('[MiniMax] Stream started');

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log(`[MiniMax] Stream completed. Total chunks: ${chunkCount}, Total content length: ${totalContentLength}`);
      break;
    }

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          console.log('[MiniMax] Received [DONE] signal');
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          chunkCount++;

          // Enhanced content extraction - check all possible fields
          // MiniMax streaming uses choices[0].delta.content
          const choice = parsed.choices?.[0];
          let content = '';

          if (choice) {
            // Try all possible field names
            content =
              choice?.delta?.content ||
              choice?.delta?.reasoning_content ||
              choice?.message?.content ||
              choice?.text ||
              choice?.content ||
              '';
          }

          // Also check top-level fields
          if (!content) {
            content = parsed.text || parsed.content || '';
          }

          if (content) {
            totalContentLength += content.length;

            // Log every 20th chunk to avoid log spam but still provide visibility
            if (chunkCount % 20 === 1) {
              console.log(`[MiniMax] Chunk ${chunkCount}: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
            }

            yield content;
          } else if (chunkCount <= 3) {
            // Log first few chunks for debugging if no content found
            console.log(`[MiniMax] Chunk ${chunkCount} - no content extracted. Keys:`, Object.keys(parsed), 'Choice keys:', choice ? Object.keys(choice) : 'N/A');
          }
        } catch (e) {
          console.error('[MiniMax] Parse error:', e, 'Raw data:', data.substring(0, 200));
        }
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { resumeText, jobDescription, action } = body;

    // Handle cover letter generation request
    if (action === 'coverLetter') {
      return handleCoverLetterGeneration(resumeText, jobDescription, session.user.id);
    }

    // Handle interview questions generation request
    if (action === 'interviewQuestions') {
      return handleInterviewQuestionsGeneration(resumeText, jobDescription, session.user.id);
    }

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: 'resumeText is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Reserve credits before starting optimization (atomic operation to prevent race conditions)
    const creditReservation = await reserveCredits(session.user.id, 'OPTIMIZE');
    if (!creditReservation.success) {
      return new Response(
        JSON.stringify({
          error: creditReservation.error || '积分不足',
          code: creditReservation.error?.includes('不足') ? 'NO_CREDITS' : 'RESERVATION_FAILED',
          required: creditReservation.cost,
          remaining: creditReservation.remaining,
          upgradeUrl: '/pricing',
        }),
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Send status update: parsing complete, now analyzing
    const encoder = new TextEncoder();

    const sendChunk = (chunk: StreamChunk) => {
      return encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
    };

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Check cache first
          const cachedResult = getCachedResult(resumeText, jobDescription);
          if (cachedResult) {
            // Cache hit - refund the reserved credits since no API call was made
            if (creditReservation.success && creditReservation.cost && creditReservation.cost > 0) {
              await refundCredits(session.user.id, 'OPTIMIZE', creditReservation.cost);
            }
            // Send cached result immediately
            controller.enqueue(
              sendChunk({
                type: 'status',
                status: 'completed',
                message: '优化完成！（缓存命中）',
              })
            );
            if (cachedResult.suggestion) {
              controller.enqueue(
                sendChunk({
                  type: 'suggestion',
                  status: 'completed',
                  message: '改善建议（缓存）',
                  suggestion: cachedResult.suggestion,
                })
              );
            }
            controller.enqueue(
              sendChunk({
                type: 'content',
                content: 'cached',
              })
            );
            controller.enqueue(
              sendChunk({
                type: 'done',
                status: 'completed',
                message: '优化完成！',
                data: cachedResult.optimized,
                fromCache: true,
              })
            );
            controller.close();
            return;
          }

          // Send analyzing status
          controller.enqueue(
            sendChunk({
              type: 'status',
              status: 'analyzing',
              message: '正在分析经历描述...',
            })
          );

          let suggestion: ResumeSuggestion | undefined;
          let optimized: OptimizedResume;
          let atsResult: { score: number; issues: string[]; suggestions: string[] } | undefined;

          // If JD is provided, run suggestion and optimization in PARALLEL
          if (jobDescription && jobDescription.trim()) {
            controller.enqueue(
              sendChunk({
                type: 'status',
                status: 'suggesting',
                message: '正在生成简历改善建议...',
              })
            );

            const suggestionPrompt = SUGGESTION_PROMPT(resumeText, jobDescription);
            const optimizePrompt = OPTIMIZE_PROMPT(resumeText, jobDescription);

            // Start ATS check in parallel with AI calls (it only needs resumeText and JD, not AI results)
            const atsCheckPromise = Promise.resolve().then(() => analyzeResumeATS(resumeText, jobDescription));

            // Parallel API calls - both suggestion and optimization run concurrently
            // Increased max_tokens for suggestion to allow more detailed suggestions
            const [suggestionResponse, optimizeResponse] = await Promise.all([
              callMiniMaxAPI(
                suggestionPrompt,
                '你是一位专业的简历优化顾问，擅长分析简历与目标岗位的匹配度。你的职责是识别简历与JD要求的真实差距，给出可执行的改善建议。重要原则：1. 只关注 JD 明确要求的技能、经验、素质 2. 不要编造 JD 未提及的要求（如"公司生态认知"） 3. 差距分析必须具体、可操作、与求职直接相关。请严格按照JSON格式输出，必须包含 add、emphasize、remove 三种类型的建议，每种至少 1-2 条。',
                true,
                4096 // Increased for more detailed suggestions
              ),
              callMiniMaxAPI(optimizePrompt, SYSTEM_PROMPT, true, 8192),
            ]);

            // Stream optimize response while collecting suggestion text
            let suggestionText = '';
            let fullResponse = '';

            // Process both streams concurrently
            const [suggestionResult, optimizeResult] = await Promise.all([
              (async () => {
                for await (const content of streamAIResponse(suggestionResponse)) {
                  suggestionText += content;
                }
                return suggestionText;
              })(),
              (async () => {
                for await (const content of streamAIResponse(optimizeResponse)) {
                  fullResponse += content;
                  // Stream content to client
                  controller.enqueue(
                    sendChunk({
                      type: 'content',
                      content: content,
                    })
                  );
                }
                return fullResponse;
              })(),
            ]);

            suggestionText = suggestionResult;
            fullResponse = optimizeResult;

            // Parse suggestion separately - if it fails, we still want to return the optimized resume
            let suggestionError = false;
            try {
              suggestion = parseSuggestionResponse(suggestionText);
            } catch (e) {
              console.error('Suggestion parsing failed:', e);
              suggestionError = true;
              suggestion = undefined;
            }
            optimized = parseAIResponse(fullResponse);

            // Send suggestion to client
            controller.enqueue(
              sendChunk({
                type: 'suggestion',
                status: 'suggesting',
                message: suggestionError ? '改善建议生成失败' : '改善建议生成完成',
                suggestion: suggestion,
                suggestionError: suggestionError,
              })
            );

            // Get ATS result (was running in parallel)
            atsResult = await atsCheckPromise;

            // Send ATS check result
            controller.enqueue(
              sendChunk({
                type: 'ats',
                status: 'formatting',
                message: '正在检测 ATS 友好度...',
                atsCheck: atsResult,
              })
            );
          } else {
            // No JD - just optimize without suggestion
            controller.enqueue(
              sendChunk({
                type: 'status',
                status: 'optimizing',
                message: '正在应用 STAR 法则优化...',
              })
            );

            // Start ATS check in parallel with AI optimization
            const atsCheckPromise = Promise.resolve().then(() => analyzeResumeATS(resumeText, jobDescription));

            const optimizePrompt = OPTIMIZE_PROMPT(resumeText, jobDescription);
            const optimizeResponse = await callMiniMaxAPI(optimizePrompt, SYSTEM_PROMPT, true, 8192);

            let fullResponse = '';
            for await (const content of streamAIResponse(optimizeResponse)) {
              fullResponse += content;
              controller.enqueue(
                sendChunk({
                  type: 'content',
                  content: content,
                })
              );
            }

            optimized = parseAIResponse(fullResponse);

            // Wait for parallel ATS check
            atsResult = await atsCheckPromise;

            // Send ATS check result
            controller.enqueue(
              sendChunk({
                type: 'ats',
                status: 'formatting',
                message: '正在检测 ATS 友好度...',
                atsCheck: atsResult,
              })
            );
          }

          // Cache the result
          setCachedResult(resumeText, jobDescription, { optimized, suggestion });

          // Report remaining credits (already deducted via reserveCredits)
          if (creditReservation.remaining !== undefined) {
            controller.enqueue(
              sendChunk({
                type: 'credits',
                remaining: creditReservation.remaining,
                reason: 'credits',
              })
            );
          }

          // Parse the final response
          controller.enqueue(
            sendChunk({
              type: 'status',
              status: 'formatting',
              message: '正在整理输出格式...',
            })
          );

          // Send final result with suggestion included
          controller.enqueue(
            sendChunk({
              type: 'done',
              status: 'completed',
              message: '优化完成！',
              data: optimized,
            })
          );

          // Save optimization record to database
          try {
            await prisma.resume.create({
              data: {
                userId: session.user.id,
                originalText: resumeText,
                optimizedText: JSON.stringify(optimized),
                jobDescription: jobDescription || null,
                atsScore: atsResult?.score || null,
              },
            });
          } catch (e) {
            console.error('[Optimize] Failed to save resume record:', e);
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          // Refund credits if optimization failed
          if (creditReservation.success && creditReservation.cost && creditReservation.cost > 0) {
            await refundCredits(session.user.id, 'OPTIMIZE', creditReservation.cost);
          }
          controller.enqueue(
            sendChunk({
              type: 'error',
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown error',
            })
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cover Letter Generation Handler
async function handleCoverLetterGeneration(resumeText: string, jobDescription: string | undefined, userId: string) {
  // Check credits for cover letter
  const creditCheck = await checkCredits(userId, 'COVER_LETTER');
  if (!creditCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: creditCheck.message || '积分不足',
        code: creditCheck.error,
        required: creditCheck.required,
        remaining: creditCheck.remaining,
        upgradeUrl: '/pricing',
      }),
      {
        status: creditCheck.error === 'NO_CREDITS' ? 402 : 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const encoder = new TextEncoder();

  const sendChunk = (chunk: StreamChunk) => {
    return encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
  };

  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          sendChunk({
            type: 'status',
            message: '正在生成求职信...',
          })
        );

        const prompt = COVER_LETTER_PROMPT(resumeText, jobDescription || '');
        const response = await callMiniMaxAPI(prompt);

        let fullContent = '';
        for await (const content of streamAIResponse(response)) {
          fullContent += content;
          controller.enqueue(
            sendChunk({
              type: 'content',
              content: content,
            })
          );
        }

        // Try to parse the response
        let coverLetter = null;
        try {
          const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          coverLetter = JSON.parse(cleaned);
        } catch {
          // If parsing fails, create a simple object
          coverLetter = {
            subject: '求职信',
            content: fullContent,
          };
        }

        // Consume credits after successful generation
        const consumeResult = await consumeCredits(userId, 'COVER_LETTER');
        if (consumeResult.remaining !== undefined) {
          controller.enqueue(
            sendChunk({
              type: 'credits',
              remaining: consumeResult.remaining,
              reason: consumeResult.reason,
            })
          );
        }

        controller.enqueue(
          sendChunk({
            type: 'done',
            coverLetter: coverLetter,
          })
        );

        controller.close();
      } catch (error) {
        console.error('Cover letter error:', error);
        controller.enqueue(
          sendChunk({
            type: 'error',
            message: error instanceof Error ? error.message : '生成失败',
          })
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// Interview Questions Generation Handler
async function handleInterviewQuestionsGeneration(resumeText: string, jobDescription: string | undefined, userId: string) {
  // Check credits for interview questions
  const creditCheck = await checkCredits(userId, 'INTERVIEW');
  if (!creditCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: creditCheck.message || '积分不足',
        code: creditCheck.error,
        required: creditCheck.required,
        remaining: creditCheck.remaining,
        upgradeUrl: '/pricing',
      }),
      {
        status: creditCheck.error === 'NO_CREDITS' ? 402 : 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const encoder = new TextEncoder();

  const sendChunk = (chunk: StreamChunk) => {
    return encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
  };

  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          sendChunk({
            type: 'status',
            message: '正在生成面试问题...',
          })
        );

        const prompt = INTERVIEW_QUESTIONS_PROMPT(resumeText, jobDescription);
        const response = await callMiniMaxAPI(prompt);

        let fullContent = '';
        for await (const content of streamAIResponse(response)) {
          fullContent += content;
          controller.enqueue(
            sendChunk({
              type: 'content',
              content: content,
            })
          );
        }

        // Try to parse the response
        let interviewQuestions = [];
        try {
          const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          const parsed = JSON.parse(cleaned);
          interviewQuestions = parsed.questions || [];
        } catch {
          interviewQuestions = [];
        }

        // Consume credits after successful generation
        const consumeResult = await consumeCredits(userId, 'INTERVIEW');
        if (consumeResult.remaining !== undefined) {
          controller.enqueue(
            sendChunk({
              type: 'credits',
              remaining: consumeResult.remaining,
              reason: consumeResult.reason,
            })
          );
        }

        controller.enqueue(
          sendChunk({
            type: 'done',
            interviewQuestions: interviewQuestions,
          })
        );

        controller.close();
      } catch (error) {
        console.error('Interview questions error:', error);
        controller.enqueue(
          sendChunk({
            type: 'error',
            message: error instanceof Error ? error.message : '生成失败',
          })
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
