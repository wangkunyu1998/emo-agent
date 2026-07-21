import { buildSuccess } from '@repo/contracts/common';
import { Hono } from 'hono';
import { createMeta } from '../lib/meta';
import { catalogRoutes } from './catalog';
import { orderRoutes } from './order';
import { systemRoutes } from './system';
import { userRoutes } from './user';

const routes = new Hono()
  .get('/health', (c) => {
    return c.json(buildSuccess({ service: 'api' }, createMeta()));
  })
  .route('/rpc/system', systemRoutes)
  .route('/rpc/catalog', catalogRoutes)
  .route('/rpc/user', userRoutes)
  .route('/rpc/order', orderRoutes);

export default routes;
