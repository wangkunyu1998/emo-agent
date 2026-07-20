import { Hono } from 'hono';
import { getApiEnv } from '../env';

type Bindings = {
  APP_ENV: 'development' | 'test' | 'production';
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => {
  const env = getApiEnv(c.env);
  return c.json({ ok: true, service: 'api', appEnv: env.APP_ENV });
});

export default app;
