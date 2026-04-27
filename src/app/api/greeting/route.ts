import { NextRequest, NextResponse } from 'next/server';

const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription } = await request.json();

    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MINIMAX_API_KEY is not configured' }, { status: 500 });
    }

    const prompt = `根据以下简历和岗位描述，生成一段 50-80 字的专业打招呼语，用于在求职软件中吸引 HR 注意力。语气专业、自信，突出与岗位的匹配度。

简历：
${resumeText}

岗位描述：
${jobDescription}

要求：
- 50-80 字
- 突出个人亮点
- 强调岗位匹配度
- 语气友好专业
- 直接输出打招呼语，不要其他解释`;

    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'abab5.5-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
        group_id: process.env.MINIMAX_GROUP_ID,
      }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ message: message.trim() });
  } catch (error) {
    console.error('Greeting API error:', error);
    return NextResponse.json({ error: 'Failed to generate greeting' }, { status: 500 });
  }
}