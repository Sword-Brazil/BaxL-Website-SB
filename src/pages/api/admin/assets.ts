import { AssetUploadSchema } from "@/models/schemas/admin";
import { handler, parseBody } from "@/server/http";
import { saveUpload } from "@/server/services/assetService";
import { requireRole } from "@/server/session";

// Upload em base64 no JSON (≤ 2 MB decodificado ≈ 2,7 MB em base64).
export const config = { api: { bodyParser: { sizeLimit: "3mb" } } };

export default handler({
  POST: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(201).json(await saveUpload(parseBody(AssetUploadSchema, req)));
  },
});
