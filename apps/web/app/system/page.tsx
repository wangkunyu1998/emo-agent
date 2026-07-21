import { Card, CardContent } from '@repo/ui/card';
import { pingWithValidation } from './api';

const rpcPayload = { name: 'web' };

export default async function SystemPage() {
  const pingResult = await pingWithValidation(rpcPayload);
  const requestBody = JSON.stringify(rpcPayload, null, 2);
  const responseBody = JSON.stringify(pingResult, null, 2);

  return (
    <main className="min-h-screen bg-surface-canvas px-6 py-10 text-content-primary">
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.3em] text-content-tertiary uppercase">
                System route
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-content-primary">
                /system · ping API validation
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
