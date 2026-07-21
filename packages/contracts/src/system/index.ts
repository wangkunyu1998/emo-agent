import { z } from 'zod';

export const PingRequestSchema = z.object({
  name: z.string().trim().min(1),
});

export const PingResponseSchema = z.object({
  service: z.literal('api'),
  message: z.string(),
});

export type PingRequest = z.infer<typeof PingRequestSchema>;
export type PingResponse = z.infer<typeof PingResponseSchema>;
