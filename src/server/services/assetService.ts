import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ASSET_MAX_BYTES, type AssetUploadInput } from "@/models/schemas/admin";
import { HttpError } from "@/server/http";

const UPLOAD_DIR = path.join(process.cwd(), "public", "assets", "uploads");

const isPng = (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const isWebp = (b: Buffer) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
const isJpeg = (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

const FORMATS = {
  "image/png": { ext: "png", check: isPng },
  "image/webp": { ext: "webp", check: isWebp },
  "image/jpeg": { ext: "jpg", check: isJpeg },
} as const;

/** Salva uma imagem PNG/WebP/JPEG (base64, ≤ 2 MB) em public/assets/uploads e retorna o caminho público. */
export async function saveUpload(input: AssetUploadInput): Promise<{ imagePath: string }> {
  const data = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (data.length === 0 || data.length > ASSET_MAX_BYTES) {
    throw new HttpError(400, "VALIDATION_ERROR", "A imagem deve ter até 2 MB");
  }
  const { ext, check } = FORMATS[input.mimeType];
  if (!check(data)) {
    throw new HttpError(400, "VALIDATION_ERROR", "O conteúdo não é uma imagem PNG, WebP ou JPEG válida");
  }
  const base =
    path
      .parse(input.fileName)
      .name.normalize("NFKD")
      .replace(/[^\w-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 60) || "imagem";
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 10);
  const fileName = `${base}-${hash}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, fileName), data);
  return { imagePath: `/assets/uploads/${fileName}` };
}
