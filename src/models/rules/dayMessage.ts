// Mensagem do dia para colar no WhatsApp (negrito com *texto*): título, melhores times com Striker
// e vídeo de cada um, e as rotações dos Causadores de Dano.

import { SLOTS, type Slot } from "@/models/domain/enums";

export interface DayMessageMember {
  slot: Slot;
  /** "Personagem (Traje)" ou só o personagem quando o traje tem o mesmo nome. */
  name: string;
  /** Só o personagem (vai na linha do Striker). */
  agentName: string;
  female: boolean;
  isDamageDealer: boolean;
  /** Personagem do Striker meta do Causador de Dano. */
  strikerName: string | null;
}

export interface DayMessageTeam {
  members: DayMessageMember[];
  /** Dobradinha: sai no número do time. */
  duo: boolean;
  videoUrl: string | null;
}

export interface DayMessageRotations {
  /** "Personagem (Traje)" do Causador de Dano. */
  name: string;
  rotations: { title: string | null; sequence: string; description: string | null }[];
}

export interface DayMessageLabels {
  bestTeams: string;
  rotation: string;
  leader: string;
  and: string;
  meta: string;
  /** "Dia 5": o dia da BA no ciclo. */
  day: (n: number) => string;
  noRestriction: string;
  duo: string;
  striker: (striker: string, target: string, female: boolean) => string;
}

export interface DayMessageInput {
  mode: string;
  /** Dia da BA no ciclo (1–28). */
  day: number;
  /** Efeito da temporada no modo (vai em maiúsculas, como no jogo). */
  effect: string | null;
  /** Valores da restrição do dia, já traduzidos. */
  criteria: string[];
  teams: DayMessageTeam[];
  rotations: DayMessageRotations[];
  labels: DayMessageLabels;
}

/** "Personagem (Traje)"; sem o traje quando ele tem o nome do personagem. */
export const memberName = (agent: string, uniform: string) =>
  uniform.trim().toLowerCase() === agent.trim().toLowerCase() ? agent : `${agent} (${uniform})`;

/** "A, B e C". */
const joinNames = (names: string[], and: string) =>
  names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} ${and} ${names[names.length - 1]}`;

const bySlot = (members: DayMessageMember[]) => [...members].sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));

/** Quem dá nome à Meta no título: o Causador de Dano da principal ou, sem ele, o líder. */
function metaName(team: DayMessageTeam | undefined): string | null {
  if (!team) return null;
  const members = bySlot(team.members);
  return (members.find((m) => m.isDamageDealer) ?? members[0])?.agentName ?? null;
}

export function buildDayMessage({ mode, day, effect, criteria, teams, rotations, labels }: DayMessageInput): string {
  const restriction = criteria.length ? criteria : [labels.noRestriction];
  const head = [mode, labels.day(day).toUpperCase(), effect?.toUpperCase(), ...restriction].filter(Boolean).join(" ");
  const name = metaName(teams[0]);
  const blocks: string[] = [`*${name ? `${head} | ${name} ${labels.meta}` : head}:*`];

  if (teams.length) {
    blocks.push(`*${labels.bestTeams}:*`);
    teams.forEach((team, i) => {
      const [leader, ...rest] = bySlot(team.members);
      const line = joinNames([`${leader.name} ${labels.leader}`, ...rest.map((m) => m.name)], labels.and);
      const strikers = team.members
        .filter((m) => m.isDamageDealer && m.strikerName)
        .map((m) => labels.striker(m.strikerName!, m.agentName, m.female));
      const number = team.duo ? `*${i + 1}- ${labels.duo}:*` : `*${i + 1}-*`;
      blocks.push([`${number} ${line}`, ...strikers].join("\n"));
      if (team.videoUrl) blocks.push(team.videoUrl);
    });
  }

  const withRotations = rotations.filter((r) => r.rotations.length);
  if (withRotations.length) {
    blocks.push(`*${labels.rotation}:*`);
    for (const r of withRotations) {
      const body = r.rotations.map((rot) =>
        [[rot.title ? `_${rot.title.trim()}_` : null, rot.sequence.trim()].filter(Boolean).join("\n"), rot.description?.trim()]
          .filter(Boolean)
          .join("\n\n"),
      );
      blocks.push([`- *${r.name}:*`, body.join("\n\n")].join("\n"));
    }
  }
  return blocks.join("\n\n");
}
