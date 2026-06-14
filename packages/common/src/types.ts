import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string(),
  name: z.string(),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(3).max(20),
});
