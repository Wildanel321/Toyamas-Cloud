import { z } from "zod";
import { isValidSlug } from "./slug";

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(50),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(40)
    .refine((val) => isValidSlug(val), {
      message: "Slug must be lowercase letters, numbers, and hyphens (DNS safe)",
    }),
  description: z.string().max(255).optional(),
  repositoryUrl: z
    .string()
    .url("Must be a valid Git URL (https://...)")
    .refine(
      (url) => url.startsWith("https://github.com/") || url.startsWith("https://gitlab.com/") || url.endsWith(".git") || url.startsWith("https://"),
      { message: "Must be a valid HTTPS Git repository URL" }
    ),
  branch: z.string().min(1, "Branch is required").default("main"),
  runtime: z.enum(["nodejs", "nextjs", "python", "laravel", "dockerfile"], {
    errorMap: () => ({ message: "Invalid runtime selected" }),
  }),
  containerPort: z.number().int().min(1).max(65535).default(3000),
  cpuLimit: z.number().min(0.1).max(4.0).default(0.5),
  memoryLimit: z.number().int().min(64).max(8192).default(512),
  autoDeploy: z.boolean().default(true),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(255).optional(),
  repositoryUrl: z.string().url().optional(),
  branch: z.string().min(1).optional(),
  runtime: z.enum(["nodejs", "nextjs", "python", "laravel", "dockerfile"]).optional(),
  containerPort: z.number().int().min(1).max(65535).optional(),
  cpuLimit: z.number().min(0.1).max(4.0).optional(),
  memoryLimit: z.number().int().min(64).max(8192).optional(),
  autoDeploy: z.boolean().optional(),
});

export const envVariableSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[A-Z0-9_]+$/i, "Key must only contain letters, numbers, and underscores"),
  value: z.string(),
  isSecret: z.boolean().default(true),
});

export const domainSchema = z.object({
  hostname: z
    .string()
    .min(3)
    .max(255)
    .regex(
      /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
      "Must be a valid domain hostname (e.g. app.wildanstore.my.id or example.com)"
    ),
});
