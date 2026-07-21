import {
  BizCode,
  buildFailure,
  buildSuccess,
} from '@repo/contracts/common';
import { PingRequestSchema } from '@repo/contracts/system';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { getApiEnv } from '../../../env';
import { createMeta } from '../../lib/meta';

type Bindings = {
  APP_ENV: 'development' | 'test' | 'production';
};

export const systemRoutes = new Hono<{ Bindings: Bindings }>().post(
  '/ping',
  zValidator('json', PingRequestSchema, (result, c) => {
    if (result.success) {
      return;
    }

    const errorMsg = {
      code: BizCode.COMMON_INVALID_REQUEST,
      message: 'Invalid request payload',
      details: result.error.issues,
    };

    return c.json(buildFailure(errorMsg, createMeta()), 400);
  }),
  (c) => {
    const payload = c.req.valid('json');
    const env = getApiEnv(c.env);

    return c.json(
      buildSuccess(
        {
          service: 'api' as const,
          message: `pong222, ${payload.name}`,
          env: env.APP_ENV,
        },
        createMeta(),
      ),
    );
  },
);
