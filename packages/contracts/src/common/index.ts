export const BizCode = {
  COMMON_INVALID_REQUEST: 'COMMON.INVALID_REQUEST', // 无效请求
  COMMON_NOT_FOUND: 'COMMON.NOT_FOUND', // 未找到
  AUTH_UNAUTHORIZED: 'AUTH.UNAUTHORIZED', // 未授权
  AUTH_FORBIDDEN: 'AUTH.FORBIDDEN', // 禁止访问
  BIZ_CONFLICT: 'BIZ.CONFLICT', // 业务冲突
  BIZ_RULE_VIOLATION: 'BIZ.RULE_VIOLATION', // 业务规则违反
  SYSTEM_INTERNAL_ERROR: 'SYSTEM.INTERNAL_ERROR', // 系统内部错误
  SYSTEM_UPSTREAM_TIMEOUT: 'SYSTEM.UPSTREAM_TIMEOUT', // 上游超时
} as const;

export type BizCode = (typeof BizCode)[keyof typeof BizCode];

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiError<E = unknown> {
  code: BizCode;
  message: string;
  details?: E;
}

export interface ApiFailure<E = unknown> {
  ok: false;
  error: ApiError<E>;
  meta: ApiMeta;
}

export type ApiResponse<T, E = unknown> = ApiSuccess<T> | ApiFailure<E>;

export function buildSuccess<T>(data: T, meta: ApiMeta): ApiSuccess<T> {
  return { ok: true, data, meta };
}

export function buildFailure<E = unknown>(
  error: ApiError<E>,
  meta: ApiMeta,
): ApiFailure<E> {
  return { ok: false, error, meta };
}
