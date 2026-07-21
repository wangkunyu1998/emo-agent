import type { ApiMeta } from '@repo/contracts/common';

export function createMeta(): ApiMeta {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}
