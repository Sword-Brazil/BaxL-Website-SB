import { DragOverlay, defaultDropAnimationSideEffects, type DropAnimation } from "@dnd-kit/core";
import type { Ctp } from "@/models/domain/types";
import { ctpColor } from "@/models/domain/ctpColors";
import { CtpBadge } from "./CtpBadge";

/** Ao soltar: o ícone "assenta" no alvo com uma leve mola. */
const dropAnimation: DropAnimation = {
  duration: 260,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }),
};

/** Ícone do CTP que acompanha o ponteiro/dedo durante o arraste (maior, inclinado e com brilho). */
export function CtpDragOverlay({ ctp }: { ctp: Ctp | null }) {
  const color = ctpColor(ctp) ?? "var(--energy)";
  return (
    <DragOverlay dropAnimation={dropAnimation} zIndex={60}>
      {ctp ? (
        <div
          className="flex size-14 rotate-6 cursor-grabbing items-center justify-center rounded-full bg-card/90 shadow-xl backdrop-blur-sm motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-150"
          style={{ boxShadow: `0 0 0 3px ${color}, 0 10px 30px -6px ${color}` }}
        >
          <CtpBadge ctp={ctp} size="md" />
        </div>
      ) : null}
    </DragOverlay>
  );
}
