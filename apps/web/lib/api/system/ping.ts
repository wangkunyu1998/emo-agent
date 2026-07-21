import type { ApiResponse } from '@repo/contracts/common';
import type { PingRequest, PingResponse } from '@repo/contracts/system';
import { createApiClient } from '../client';
import { toUpstreamFailure } from '../common/errors';

export async function postPing(
  payload: PingRequest,
): Promise<ApiResponse<PingResponse>> {
  const client = createApiClient();

  try {
    const response = await client.rpc.system.ping.$post({
      json: payload,
    });

    return (await response.json()) as ApiResponse<PingResponse>;
  } catch (error) {
    return toUpstreamFailure(error);
  }
}
