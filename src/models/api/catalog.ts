import type { Catalog } from "@/models/domain/types";
import { apiFetch } from "./client";

export const getCatalog = () => apiFetch<Catalog>("/api/catalog");
