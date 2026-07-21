import type { AppType } from '@repo/api';
import { hc } from 'hono/client';
import { getServerEnv } from '../../env.server';

export function createApiClient() {
  const { API_BASE_URL } = getServerEnv();
  return hc<AppType>(API_BASE_URL);
}

export type ApiClient = ReturnType<typeof createApiClient>;
