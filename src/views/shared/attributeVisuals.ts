/** Ícones de atributo em public/assets/restrictions (copiados de img/restrictions). */
const ICON: Record<string, string> = {
  HERO: "hero",
  VILLAIN: "villain",
  MALE: "male",
  FEMALE: "female",
  MUTANT: "mutant",
  HUMAN: "human",
  INHUMAN: "inhuman",
  ALIEN: "alien",
  COMBAT: "combat",
  BLAST: "blast",
  SPEED: "speed",
  UNIVERSAL: "universal",
};

export const attributeIcon = (value: string) => (ICON[value] ? `/assets/restrictions/${ICON[value]}.webp` : null);

export const attributeVariant = (value: string): "hero" | "villain" | "energy" =>
  value === "HERO" ? "hero" : value === "VILLAIN" ? "villain" : "energy";
