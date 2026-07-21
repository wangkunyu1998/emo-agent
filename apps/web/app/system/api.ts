import {
  BizCode,
  buildFailure,
  type ApiResponse,
} from '@repo/contracts/common';
import {
  PingRequestSchema,
  PingResponseSchema,
  type PingResponse,
} from '@repo/contracts/system';
import { postPing } from '../../lib/api/system/ping';

function createLocalMeta() {
  return {
    requestId: 'web-local',
    timestamp: new Date().toISOString(),
  };
}

/**
 * system 路由页面对应的 API 校验入口：
 * 1. 校验请求体
 * 2. 调用共享 lib/api 请求
 * 3. 校验成功响应 data
 */
export async function pingWithValidation(
  input: unknown,
): Promise<ApiResponse<PingResponse>> {
  const parsedRequest = PingRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    return buildFailure(
      {
        code: BizCode.COMMON_INVALID_REQUEST,
        message: 'Invalid ping request',
        details: parsedRequest.error.issues,
      },
      createLocalMeta(),
    );
  }

  const result = await postPing(parsedRequest.data);

  if (!result.ok) {
    return result;
  }

  const parsedResponse = PingResponseSchema.safeParse(result.data);

  if (!parsedResponse.success) {
    return buildFailure(
      {
        code: BizCode.SYSTEM_INTERNAL_ERROR,
        message: 'Invalid ping response from api',
        details: parsedResponse.error.issues,
      },
      result.meta,
    );
  }

  return {
    ok: true,
    data: parsedResponse.data,
    meta: result.meta,
  };
}
