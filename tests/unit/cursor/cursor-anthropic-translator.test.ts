import { describe, expect, it } from 'bun:test';
import { createAnthropicProxyResponse } from '../../../src/cursor/cursor-anthropic-response';
import { translateAnthropicRequest } from '../../../src/cursor/cursor-anthropic-translator';

describe('translateAnthropicRequest', () => {
  it('maps Anthropic system, tool use, and tool result blocks into Cursor OpenAI messages', () => {
    const translated = translateAnthropicRequest({
      model: 'claude-sonnet-4.5',
      stream: true,
      thinking: { type: 'enabled', budget_tokens: 9000 },
      tools: [{ name: 'search', description: 'Search docs', input_schema: { type: 'object' } }],
      system: 'You are helpful.',
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'Find release notes' }] },
        {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'toolu_1', name: 'search', input: { q: 'release' } }],
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_1',
              content: [{ type: 'text', text: 'v7.53.0' }],
            },
            { type: 'text', text: 'Summarize it.' },
          ],
        },
      ],
    });

    expect(translated.model).toBe('claude-sonnet-4.5');
    expect(translated.stream).toBe(true);
    expect(translated.reasoning_effort).toBe('high');
    expect(translated.messages).toEqual([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Find release notes' },
      {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: 'toolu_1',
            type: 'function',
            function: { name: 'search', arguments: '{"q":"release"}' },
          },
        ],
      },
      { role: 'tool', tool_call_id: 'toolu_1', content: 'v7.53.0' },
      { role: 'user', content: 'Summarize it.' },
    ]);
  });

  it('rejects unsupported content blocks', () => {
    expect(() =>
      translateAnthropicRequest({
        messages: [{ role: 'user', content: [{ type: 'image' }] }],
      })
    ).toThrow('is not supported');
  });
});

describe('createAnthropicProxyResponse', () => {
  it('converts OpenAI JSON into Anthropic message JSON', async () => {
    const response = new Response(
      JSON.stringify({
        id: 'chatcmpl_1',
        model: 'claude-sonnet-4.5',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Here is the result.',
              reasoning_content: 'Need to call the tool first.',
              tool_calls: [
                {
                  id: 'toolu_2',
                  type: 'function',
                  function: { name: 'search', arguments: '{"q":"cursor daemon"}' },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
        usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const transformed = await createAnthropicProxyResponse(response);
    const body = (await transformed.json()) as {
      type: string;
      model: string;
      stop_reason: string;
      content: Array<{
        type: string;
        text?: string;
        thinking?: string;
        name?: string;
        input?: Record<string, unknown>;
      }>;
    };

    expect(body.type).toBe('message');
    expect(body.model).toBe('claude-sonnet-4.5');
    expect(body.stop_reason).toBe('tool_use');
    expect(body.content.map((block) => block.type)).toEqual(['thinking', 'text', 'tool_use']);
    expect(body.content[0]?.thinking).toContain('Need to call the tool first');
    expect(body.content[2]?.name).toBe('search');
    expect(body.content[2]?.input).toEqual({ q: 'cursor daemon' });
  });

  it('converts OpenAI SSE chunks into Anthropic SSE events', async () => {
    const openAiSse = [
      'data: {"id":"chatcmpl_2","object":"chat.completion.chunk","created":1,"model":"claude-sonnet-4.5","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"id":"chatcmpl_2","object":"chat.completion.chunk","created":1,"model":"claude-sonnet-4.5","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":5,"completion_tokens":1,"total_tokens":6}}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    const transformed = await createAnthropicProxyResponse(
      new Response(openAiSse, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );

    const body = await transformed.text();
    expect(body).toContain('event: message_start');
    expect(body).toContain('event: content_block_start');
    expect(body).toContain('"type":"text_delta"');
    expect(body).toContain('event: message_stop');
  });
});
