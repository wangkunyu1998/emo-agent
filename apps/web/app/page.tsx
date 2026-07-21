import type { AppType } from '@repo/api';
import {
  BizCode,
  type ApiResponse,
  type PingRequest,
  type PingResponse,
} from '@repo/contracts';
import { Card, CardContent } from '@repo/ui/card';
import { hc } from 'hono/client';
import { getServerEnv } from '../env.server';

const rpcPayload: PingRequest = { name: 'web' };

async function getPingResponse(): Promise<ApiResponse<PingResponse>> {
  const { API_BASE_URL } = getServerEnv();
  const client = hc<AppType>(API_BASE_URL);

  try {
    const response = await client.rpc.system.ping.$post({
      json: rpcPayload,
    });

    return (await response.json()) as ApiResponse<PingResponse>;
  } catch (error) {
    return {
      ok: false,
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: error instanceof Error ? error.message : 'API request failed',
      },
      meta: {
        requestId: 'unavailable',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default async function Home() {
  const pingResult = await getPingResponse();
  const requestBody = JSON.stringify(rpcPayload, null, 2);
  const responseBody = JSON.stringify(pingResult, null, 2);

  return (
    <main className="min-h-screen bg-surface-canvas px-6 py-10 text-content-primary">
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.3em] text-content-tertiary uppercase">
                RPC validation
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-content-primary">
                Shared request and response contract
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-content-secondary">
              <span className="rounded-full border border-border-default px-3 py-1">
                POST /rpc/system/ping
              </span>
              <span className="rounded-full border border-border-default px-3 py-1">
                {pingResult.ok ? 'ok=true' : `code=${pingResult.error.code}`}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border-default bg-surface-elevated p-4">
                <p className="text-sm font-medium text-content-primary">
                  Request
                </p>
                <pre className="mt-3 overflow-x-auto font-mono text-xs leading-6 break-all whitespace-pre-wrap text-content-secondary">
                  {requestBody}
                </pre>
              </div>

              <div className="rounded-2xl border border-border-default bg-surface-elevated p-4">
                <p className="text-sm font-medium text-content-primary">
                  Response
                </p>
                <pre className="mt-3 overflow-x-auto font-mono text-xs leading-6 break-all whitespace-pre-wrap text-content-secondary">
                  {responseBody}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
