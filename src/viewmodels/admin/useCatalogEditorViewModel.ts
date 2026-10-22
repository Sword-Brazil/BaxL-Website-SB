import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useNotifyError } from "@/viewmodels/useNotify";
import { adminApi } from "@/models/api/admin";
import { UNKNOWN, type BossEffect } from "@/models/domain/enums";
import type { Agent, RestrictableAttributes } from "@/models/domain/types";
import { slugify } from "@/models/rules/slug";
import { AgentSchema, ASSET_MAX_BYTES, type AgentInput, type AssetUploadInput } from "@/models/schemas/admin";
import { useCatalogViewModel } from "@/viewmodels/useCatalogViewModel";

type UniformInput = AgentInput["uniforms"][number];

const UNKNOWN_ATTRIBUTES: RestrictableAttributes = { gender: UNKNOWN, side: UNKNOWN, species: UNKNOWN, attackType: UNKNOWN };

const attributesOf = (u: RestrictableAttributes): RestrictableAttributes => ({
  gender: u.gender,
  side: u.side,
  species: u.species,
  attackType: u.attackType,
});

const blank: AgentInput = {
  slug: "",
  name: "",
  active: true,
  uniforms: [{ slug: "padrao", name: "Padrão", imagePath: "", active: true, effects: [], isMetaStriker: false, ...UNKNOWN_ATTRIBUTES }],
};

/** Traje novo começa com os atributos de um traje já cadastrado (ajuste o que for diferente). */
const newUniform = (from?: RestrictableAttributes): UniformInput => ({
  slug: "",
  name: "",
  imagePath: "",
  active: true,
  effects: [],
  isMetaStriker: false,
  ...(from ? attributesOf(from) : UNKNOWN_ATTRIBUTES),
});

const toInput = (a: Agent): AgentInput => ({
  slug: a.slug,
  name: a.name,
  active: a.active,
  uniforms: a.uniforms.map((u) => ({
    id: u.id,
    slug: u.slug,
    name: u.name,
    imagePath: u.imagePath,
    active: u.active,
    effects: u.effects,
    isMetaStriker: u.isMetaStriker,
    ...attributesOf(u),
  })),
});

const MIME: Record<string, AssetUploadInput["mimeType"]> = { "image/png": "image/png", "image/webp": "image/webp", "image/jpeg": "image/jpeg" };

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Catálogo de personagens e trajes (admin/curador): busca, novo personagem, novo traje,
 * troca/remoção de foto de cada traje e desativação. O identificador (slug) é gerado do nome.
 */
export function useCatalogEditorViewModel(messages: { saved: string; uploaded: string; tooBig: string; badType: string }) {
  const qc = useQueryClient();
  const notifyError = useNotifyError();
  const catalog = useCatalogViewModel();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined); // undefined = fechado, null = novo
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const form = useForm<AgentInput>({ resolver: zodResolver(AgentSchema), defaultValues: blank });
  const uniforms = useFieldArray({ control: form.control, name: "uniforms" });

  const agents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? catalog.agents.filter((a) => a.name.toLowerCase().includes(q) || a.slug.includes(q)) : catalog.agents;
  }, [catalog.agents, search]);

  const save = useMutation({
    mutationFn: (input: AgentInput) => (editingId ? adminApi.updateAgent(editingId, input) : adminApi.createAgent(input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycle"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
      setEditingId(undefined);
      toast.success(messages.saved);
    },
    onError: (e: Error) => form.setError("root", { message: e.message }),
  });

  const upload = useMutation({
    mutationFn: async ({ index, file }: { index: number; file: File }) => {
      const mimeType = MIME[file.type];
      if (!mimeType) throw new Error(messages.badType);
      if (file.size > ASSET_MAX_BYTES) throw new Error(messages.tooBig);
      setUploadingIndex(index);
      const { imagePath } = await adminApi.uploadAsset({ fileName: file.name, mimeType, base64: await fileToBase64(file) });
      form.setValue(`uniforms.${index}.imagePath`, imagePath, { shouldDirty: true, shouldValidate: true });
    },
    onSuccess: () => toast.success(messages.uploaded),
    onError: (e: Error) => notifyError(e),
    onSettled: () => setUploadingIndex(null),
  });

  /** Gera o slug a partir do nome enquanto o slug não foi editado à mão (ou está vazio). */
  const syncSlug = (slugField: `slug` | `uniforms.${number}.slug`, name: string, previousName: string) => {
    const current = form.getValues(slugField);
    if (!current || current === slugify(previousName)) form.setValue(slugField, name ? slugify(name) : "", { shouldValidate: true });
  };

  return {
    catalog,
    agents,
    search,
    setSearch,
    form,
    uniforms,
    isOpen: editingId !== undefined,
    isNew: editingId === null,
    openNew: () => {
      form.reset(blank);
      setEditingId(null);
    },
    openEdit: (a: Agent, withNewUniform = false) => {
      form.reset(toInput(a));
      if (withNewUniform) uniforms.prepend(newUniform(a.uniforms[0]));
      setEditingId(a.id);
    },
    addUniform: () => uniforms.prepend(newUniform(form.getValues("uniforms")[0])),
    setUniformAttribute: (index: number, name: keyof RestrictableAttributes, value: string) =>
      form.setValue(`uniforms.${index}.${name}`, value as never, { shouldDirty: true }),
    /** Liga/desliga um efeito que o traje causa no chefe. */
    toggleUniformEffect: (index: number, effect: BossEffect) => {
      const current = form.getValues(`uniforms.${index}.effects`) ?? [];
      const next = current.includes(effect) ? current.filter((e) => e !== effect) : [...current, effect];
      form.setValue(`uniforms.${index}.effects`, next, { shouldDirty: true });
    },
    removeImage: (index: number) => form.setValue(`uniforms.${index}.imagePath`, "", { shouldDirty: true }),
    onAgentNameChange: (name: string) => syncSlug("slug", name, form.getValues("name")),
    onUniformNameChange: (index: number, name: string) =>
      syncSlug(`uniforms.${index}.slug`, name, form.getValues(`uniforms.${index}.name`)),
    close: () => setEditingId(undefined),
    submit: form.handleSubmit((input) => save.mutate(input)),
    isSaving: save.isPending,
    upload: (index: number, file: File) => upload.mutate({ index, file }),
    uploadingIndex,
  };
}
