import { NextRequest } from 'next/server';
import { ANALYSIS_PROMPT, SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { parseAIResponse } from '@/lib/resume-optimizer';
import type { StreamChunk } from '@/types/resume';

// MiniMax API endpoint
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

async function callMiniMaxAPI(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string
) {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY is not configured');
  }

  const userPrompt = ANALYSIS_PROMPT(resumeText, jobDescription);

  console.log('Resume text:', resumeText);
  console.log('User prompt length:', userPrompt.length);

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
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8192,
      stream: true,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription, targetRole } = body;

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

          // Call MiniMax API with streaming
          const response = await callMiniMaxAPI(
            resumeText,
            jobDescription,
            targetRole
          );

          let fullResponse = '';

          // Process streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Failed to read response body');
          }

          const decoder = new TextDecoder();

          controller.enqueue(
            sendChunk({
              type: 'status',
              status: 'optimizing',
              message: '正在应用 STAR 法则优化...',
            })
          );

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
                  // MiniMax response format
                  const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || '';
                  fullResponse += content;

                  // Stream content to client
                  controller.enqueue(
                    sendChunk({
                      type: 'content',
                      content: content,
                    })
                  );
                } catch {
                  // Skip invalid JSON
                }
              }
            }
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

          // Send final result
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
