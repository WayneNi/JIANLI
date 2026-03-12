import { NextRequest } from 'next/server';
import { ANALYSIS_PROMPT, SYSTEM_PROMPT, SUGGESTION_PROMPT, OPTIMIZE_PROMPT, ATS_CHECK_PROMPT, COVER_LETTER_PROMPT, INTERVIEW_QUESTIONS_PROMPT } from '@/lib/ai-prompts';
import { parseAIResponse, parseSuggestionResponse } from '@/lib/resume-optimizer';
import { analyzeResumeATS } from '@/lib/ats-checker';
import type { StreamChunk, ResumeSuggestion, AtsCheckResult } from '@/types/resume';

// MiniMax API endpoint
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

async function callMiniMaxAPI(
  prompt: string,
  systemPrompt: string = SYSTEM_PROMPT,
  stream: boolean = true
) {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY is not configured');
  }

  // Using MiniMax's chat completion API
  const response = await fetch(`${MINIMAX_API_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'abab6.5s-chat',
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
      temperature: 0.7,
      max_tokens: 8192,
      stream: stream,
    }),
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

  return response;
}

async function* streamAIResponse(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response body');
  }

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || '';
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription, targetRole, action } = body;

    // Handle cover letter generation request
    if (action === 'coverLetter') {
      return handleCoverLetterGeneration(resumeText, jobDescription);
    }

    // Handle interview questions generation request
    if (action === 'interviewQuestions') {
      return handleInterviewQuestionsGeneration(resumeText, jobDescription);
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

    // Send status update: parsing complete, now analyzing
    const encoder = new TextEncoder();

    const sendChunk = (chunk: StreamChunk) => {
      return encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
    };

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send analyzing status
          controller.enqueue(
            sendChunk({
              type: 'status',
              status: 'analyzing',
              message: '正在分析经历描述...',
            })
          );

          // If JD is provided, generate suggestions first
          let suggestion: ResumeSuggestion | undefined;
          if (jobDescription && jobDescription.trim()) {
            controller.enqueue(
              sendChunk({
                type: 'status',
                status: 'suggesting',
                message: '正在生成简历改善建议...',
              })
            );

            const suggestionPrompt = SUGGESTION_PROMPT(resumeText, jobDescription);

            const suggestionResponse = await callMiniMaxAPI(
              suggestionPrompt,
              '你是一位专业的简历优化顾问，擅长分析简历与目标岗位的匹配度，并给出具体的改善建议。请严格按照JSON格式输出。',
              true
            );

            let suggestionText = '';
            for await (const content of streamAIResponse(suggestionResponse)) {
              suggestionText += content;
            }

            suggestion = parseSuggestionResponse(suggestionText);

            // Send suggestion to client
            controller.enqueue(
              sendChunk({
                type: 'suggestion',
                status: 'suggesting',
                message: '改善建议生成完成',
                suggestion: suggestion,
              })
            );
          }

          // Now optimize the resume
          controller.enqueue(
            sendChunk({
              type: 'status',
              status: 'optimizing',
              message: '正在应用 STAR 法则优化...',
            })
          );

          const optimizePrompt = OPTIMIZE_PROMPT(resumeText, jobDescription);
          const optimizeResponse = await callMiniMaxAPI(optimizePrompt);

          let fullResponse = '';

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

          // Parse the final response
          controller.enqueue(
            sendChunk({
              type: 'status',
              status: 'formatting',
              message: '正在整理输出格式...',
            })
          );

          const optimized = parseAIResponse(fullResponse);

          // Run ATS check
          const optimizedText = JSON.stringify(optimized);
          const atsResult = analyzeResumeATS(optimizedText, jobDescription);

          // Send ATS check result
          controller.enqueue(
            sendChunk({
              type: 'ats',
              status: 'formatting',
              message: '正在检测 ATS 友好度...',
              atsCheck: atsResult,
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

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
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
async function handleCoverLetterGeneration(resumeText: string, jobDescription?: string) {
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
async function handleInterviewQuestionsGeneration(resumeText: string, jobDescription?: string) {
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
