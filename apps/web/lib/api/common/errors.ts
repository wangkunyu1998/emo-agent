import { BizCode, type ApiFailure } from '@repo/contracts/common';

export function toUpstreamFailure(error: unknown): ApiFailure {
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
