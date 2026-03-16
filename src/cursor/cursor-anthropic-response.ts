import { DeltaAccumulator } from '../glmt/delta-accumulator';
import { GlmtTransformer } from '../glmt/glmt-transformer';
import { SSEParser } from '../glmt/sse-parser';
import type { OpenAIResponse, SSEEvent } from '../glmt/pipeline';

function createErrorResponse(message: string): Response {
  return new Response(
    JSON.stringify({
      error: {
        type: 'api_error',
        message,
      },
    }),
    {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function formatSseEvent(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function createAnthropicJsonResponse(response: Response): Promise<Response> {
  try {
    const openAiResponse = (await response.json()) as OpenAIResponse;
    const anthropicResponse = new GlmtTransformer().transformResponse(openAiResponse);
    return new Response(JSON.stringify(anthropicResponse), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return createErrorResponse(
      `Failed to translate Cursor JSON response: ${(error as Error).message}`
    );
  }
}

function createAnthropicStreamingResponse(response: Response): Response {
  const body = response.body;
  if (!body) {
    return createErrorResponse('Cursor stream ended before a response body was available');
  }

  const parser = new SSEParser();
  const transformer = new GlmtTransformer();
  const accumulator = new DeltaAccumulator({});
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (!value) {
            continue;
          }

          const events = parser.parse(Buffer.from(value));
          events.forEach((event) => {
            const anthropicEvents = transformer.transformDelta(event as SSEEvent, accumulator);
            anthropicEvents.forEach((anthropicEvent) => {
              controller.enqueue(
                encoder.encode(formatSseEvent(anthropicEvent.event, anthropicEvent.data))
              );
            });
          });
        }

        if (!accumulator.isFinalized() && accumulator.isMessageStarted()) {
          transformer.finalizeDelta(accumulator).forEach((anthropicEvent) => {
            controller.enqueue(
              encoder.encode(formatSseEvent(anthropicEvent.event, anthropicEvent.data))
            );
          });
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            formatSseEvent('error', {
              type: 'error',
              error: {
                type: 'api_error',
                message: `Failed to translate Cursor SSE response: ${(error as Error).message}`,
              },
            })
          )
        );
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: response.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export async function createAnthropicProxyResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    return response;
  }

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/event-stream')
    ? createAnthropicStreamingResponse(response)
    : createAnthropicJsonResponse(response);
}
