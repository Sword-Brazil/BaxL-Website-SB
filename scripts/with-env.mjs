// Roda um comando com as variáveis de .env.local carregadas do jeito do Next (com expansão de
// ${VAR}), já que a CLI do Prisma só lê .env. Ex.: node scripts/with-env.mjs prisma migrate deploy
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });
const [command, ...args] = process.argv.slice(2);
const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
