import type { Rotation } from "@/models/domain/types";
import { apiFetch } from "./client";

export const getRotations = () => apiFetch<Rotation[]>("/api/rotations");
