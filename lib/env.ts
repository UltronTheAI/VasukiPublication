import { z } from "zod";

/**
 * Server-only environment variable schema.
 * These variables must NEVER be leaked to the client bundle.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .default(
      process.env.NODE_ENV === "production"
        ? ""
        : "mongodb://127.0.0.1:27017"
    ),
  MONGODB_DATABASE: z.string().min(1, "MONGODB_DATABASE is required").default("vasukisquare"),
  ADMIN_ACCESS_TOKEN: z.string().optional().default(""),
  ADMIN_SESSION_SECRET: z.string().optional().default(""),
});

/**
 * Public environment variable schema.
 * Safe for client-side and server-side consumption.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1).default("Vasuki Publication"),
});

/**
 * Validate and parse server environment variables.
 * Fails fast with clear descriptive error messages when required variables are invalid.
 */
function validateServerEnv() {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DATABASE: process.env.MONGODB_DATABASE,
    ADMIN_ACCESS_TOKEN: process.env.ADMIN_ACCESS_TOKEN,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    
    const message = `[VasukiPublication] Invalid server environment variables:\n${errorDetails}\nPlease check your .env.local or production environment configuration.`;
    
    // In production or build time, enforce strict validation
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    } else {
      console.warn(`\x1b[33m⚠️ ${message}\x1b[0m`);
    }

    return serverEnvSchema.parse({
      NODE_ENV: process.env.NODE_ENV || "development",
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
      MONGODB_DATABASE: process.env.MONGODB_DATABASE || "vasukisquare",
      ADMIN_ACCESS_TOKEN: process.env.ADMIN_ACCESS_TOKEN || "",
      ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || "",
    });
  }

  return result.data;
}

/**
 * Validate public environment variables.
 */
function validatePublicEnv() {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.warn(`[VasukiPublication] Public env validation warnings:\n${errorDetails}`);
    return publicEnvSchema.parse({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_NAME: "Vasuki Publication",
    });
  }

  return result.data;
}

export const serverEnv = validateServerEnv();
export const publicEnv = validatePublicEnv();

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

