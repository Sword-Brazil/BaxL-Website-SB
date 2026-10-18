import type { NextApiRequest, NextApiResponse } from "next";
import { z, type ZodType } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RESTRICTION_VIOLATION"
  | "RATE_LIMITED"
  | "METHOD_NOT_ALLOWED"
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

/** Roteia por método HTTP e converte HttpError no formato de erro padrão da API. */
export function handler(handlers: Partial<Record<Method, Handler>>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const fn = handlers[req.method as Method];
    if (!fn) {
      res.setHeader("Allow", Object.keys(handlers).join(", "));
      return sendError(res, 405, "METHOD_NOT_ALLOWED", "Método não permitido");
    }
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof HttpError) return sendError(res, e.status, e.code, e.message, e.fields);
      console.error(e);
      return sendError(res, 500, "INTERNAL_ERROR", "Erro interno");
    }
  };
}

/** IP do cliente, para o limite de tentativas de login. */
export function clientIp(req: NextApiRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0];
  return (first ?? req.socket.remoteAddress ?? "unknown").trim();
}
