import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().min(1).default("vuonchu.sid"),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(12),
  PARENT_GATE_TTL_MINUTES: z.coerce.number().positive().default(10),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  ALLOW_UNREVIEWED_DEMO_CONTENT: booleanString.default("false"),
  ENABLE_SERVER_RECORDINGS: booleanString.default("false"),
  ENABLE_CLOUD_SPEECH: booleanString.default("false"),
  ENABLE_BROWSER_SPEECH: booleanString.default("false"),
  ENABLE_OAUTH: booleanString.default("false"),
  ENABLE_QR_LOGIN: booleanString.default("false"),
  ENABLE_LUCKY_WHEEL: booleanString.default("false"),
  PRIVATE_MEDIA_DIR: z.string().min(1).default("./var/private-media"),
  RECORDING_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
  MAX_RECORDING_BYTES: z.coerce.number().int().positive().default(5_242_880),
  MAX_RECORDING_SECONDS: z.coerce.number().int().positive().default(15),
  REPORT_TIMEZONE: z.literal("Asia/Ho_Chi_Minh").default("Asia/Ho_Chi_Minh"),
  ADMIN_EMAIL: z.string().optional().default(""),
  ADMIN_PASSWORD: z.string().optional().default(""),
  ADMIN_PIN: z.string().optional().default(""),
  DEMO_PARENT_PASSWORD: z.string().optional().default(""),
  DEMO_PARENT_PIN: z.string().optional().default(""),
  SPEECH_PROVIDER: z.string().optional().default(""),
  SPEECH_PROVIDER_API_KEY: z.string().optional().default(""),
  PRIVATE_STORAGE_BUCKET: z.string().optional().default("")
});

export function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Cấu hình môi trường API không hợp lệ: ${details.join("; ")}`);
  }

  if (parsed.data.NODE_ENV === "production" && parsed.data.ALLOW_UNREVIEWED_DEMO_CONTENT) {
    throw new Error("ALLOW_UNREVIEWED_DEMO_CONTENT không được bật trong production.");
  }

  return parsed.data;
}

export const env = loadEnv();
