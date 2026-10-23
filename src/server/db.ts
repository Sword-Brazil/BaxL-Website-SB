import type { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "./prismaClient";

// Reaproveita o client entre hot reloads do `next dev`.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
