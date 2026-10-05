const forbiddenWebEnv = ["MONGODB_URI", "SESSION_SECRET", "SPEECH_PROVIDER_API_KEY"];
const allowedWebPrefixes = ["VITE_"];

for (const key of forbiddenWebEnv) {
  if (process.env[key]) {
    console.error(`Không đưa ${key} vào frontend hoặc môi trường VITE_*.`);
    process.exit(1);
  }
}

const invalidViteKeys = Object.keys(process.env).filter(
  (key) => key.startsWith("VITE_") && !allowedWebPrefixes.some((prefix) => key.startsWith(prefix))
);

if (invalidViteKeys.length > 0) {
  console.error(`Biến VITE không hợp lệ: ${invalidViteKeys.join(", ")}`);
  process.exit(1);
}

console.log("Env allowlist check passed.");
