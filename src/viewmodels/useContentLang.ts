import { useRouter } from "next/router";
import { contentLang } from "@/models/rules/localize";

/** Idioma do conteúdo do banco na tela atual: "pt" no português; "en" no inglês e no espanhol. */
export const useContentLang = () => contentLang(useRouter().locale);
