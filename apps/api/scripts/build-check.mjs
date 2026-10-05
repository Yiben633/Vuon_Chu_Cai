process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/vuon_chu_build?replicaSet=rs0";
process.env.SESSION_SECRET ??= "build_check_placeholder_secret_at_least_32_bytes";

const { createApp } = await import("../src/app.js");

if (typeof createApp !== "function") {
  throw new Error("createApp export is missing");
}

console.log("api build check passed");
