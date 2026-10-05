import { spawn } from "node:child_process";

const commands = [
  ["api", "npm", ["run", "dev:api"]],
  ["web", "npm", ["run", "dev:web"]]
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`[${name}] stopped by ${signal}`);
      return;
    }
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });

  return child;
});

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
