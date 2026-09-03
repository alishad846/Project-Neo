import { z } from "zod";

export const signupRequestSchema = z.object({
  fullName: z.string().min(1),
  shopName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type SignupRequestDto = z.infer<typeof signupRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
