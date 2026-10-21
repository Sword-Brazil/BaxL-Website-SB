import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { z, type ZodType } from "zod";
import "@/lib/zodLocale";
import { stalePrismaClientHint } from "./prismaFreshness";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RESTRICTION_VIOLATION"
  | "RATE_LIMITED"
  | "METHOD_NOT_ALLOWED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export function sendError(
  res: NextApiResponse,
  status: number,
  code: ErrorCode,
  message: string,
  fields?: Record<string, string[]>,
) {
  res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } });
}

/** Valida dados com Zod; lança 400 VALIDATION_ERROR com os erros por campo. */
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = z.flattenError(result.error).fieldErrors as Record<string, string[]>;
    throw new HttpError(400, "VALIDATION_ERROR", "Dados inválidos", fields);
  }
  return result.data;
}

export const parseBody = <T>(schema: ZodType<T>, req: NextApiRequest) => parse(schema, req.body);
export const parseQuery = <T>(schema: ZodType<T>, req: NextApiRequest) => parse(schema, req.query);

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Handler = (req: NextApiRequest, res: NextApiResponse) => unknown | Promise<unknown>;

const host = (value: string | undefined) => {
  try {
    return value ? new URL(value).host : null;
  } catch {
    return null;
  }
};

/**
 * Defesa contra CSRF nas requisições que alteram dados: precisam vir deste site (Origin, ou Referer
 * quando o navegador não manda Origin) e, com corpo, em JSON (um formulário HTML de outro site não
 * consegue enviar JSON). O cookie de sessão já é SameSite=Lax; isto é a segunda barreira.
 */
export function assertSameOrigin(req: NextApiRequest) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  const origin = host(req.headers.origin) ?? host(req.headers.referer);
  const forwarded = req.headers["x-forwarded-host"];
  const self = (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? req.headers.host;
  if (!origin || origin !== self) throw new HttpError(403, "FORBIDDEN", "Origem da requisição não permitida");
  const length = Number(req.headers["content-length"] ?? 0);
  const type = req.headers["content-type"] ?? "";
  if (length > 0 && !type.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "VALIDATION_ERROR", "Envie os dados em JSON");
  }
}

/** Códigos do Prisma de falha de conexão: banco fora do ar, tempo esgotado, fila de conexões cheia. */
const CONNECTION_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

/** O banco de dados está inacessível (e não é um erro do pedido nem do código)? */
export function isDatabaseUnavailable(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientInitializationError ||
    e instanceof Prisma.PrismaClientRustPanicError ||
    (e instanceof Prisma.PrismaClientKnownRequestError && CONNECTION_CODES.has(e.code))
  );
}

/** Roteia por método HTTP e converte HttpError no formato de erro padrão da API. */
export function handler(handlers: Partial<Record<Method, Handler>>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const fn = handlers[req.method as Method];
    if (!fn) {
      res.setHeader("Allow", Object.keys(handlers).join(", "));
      return sendError(res, 405, "METHOD_NOT_ALLOWED", "Método não permitido");
    }
    try {
      assertSameOrigin(req);
      await fn(req, res);
    } catch (e) {
      if (e instanceof HttpError) return sendError(res, e.status, e.code, e.message, e.fields);
      console.error(e);
      if (isDatabaseUnavailable(e)) {
        res.setHeader("Retry-After", "5");
        return sendError(res, 503, "SERVICE_UNAVAILABLE", "Sem conexão com o banco de dados. Tente de novo em instantes.");
      }
      // Em desenvolvimento, explica a causa mais comum de 500 depois de uma migração.
      const hint = stalePrismaClientHint();
      if (hint) console.error(`\n⚠️  ${hint}\n`);
      return sendError(res, 500, "INTERNAL_ERROR", hint ?? "Erro interno");
    }
  };
}

/**
 * IP do cliente, para o limite de tentativas de login. Na Vercel, `x-real-ip` é definido pela
 * própria plataforma (não pelo cliente). Fora dela, o primeiro `x-forwarded-for` pode ser forjado:
 * por isso o login também tem um limite por conta, que não depende do IP.
 */
export function clientIp(req: NextApiRequest): string {
  const header = (name: string) => {
    const v = req.headers[name];
    return (Array.isArray(v) ? v[0] : v)?.split(",")[0]?.trim() || undefined;
  };
  return (header("x-real-ip") ?? header("x-forwarded-for") ?? req.socket.remoteAddress ?? "unknown").slice(0, 64);
}
