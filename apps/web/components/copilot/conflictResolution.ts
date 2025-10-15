import { CadenceDay, Plan } from "./types";
import type { CadenceConflict } from "./utils";

export const applyConflictResolutions = (
  plan: Plan,
  conflicts: CadenceConflict[],
  resolutions: Record<string, { action: "keep" | "merge" | "move"; moveDay?: CadenceDay }>
): Plan => {
  let updatedCadence = [...plan.cadence];

  conflicts.forEach((conflict) => {
    const resolution = resolutions[conflict.id] ?? { action: "merge" };
    if (resolution.action === "keep") {
      return;
    }
    if (resolution.action === "merge") {
      const [first, ...rest] = conflict.slots;
      updatedCadence = updatedCadence.filter((slot) => rest.every((item) => item.id !== slot.id));
      updatedCadence = updatedCadence.map((slot) => (slot.id === first.id ? { ...slot, channels: Array.from(new Set(conflict.slots.flatMap((s) => s.channels))) } : slot));
    }
    if (resolution.action === "move") {
      const targetDay = resolution.moveDay ?? conflict.day;
      const slotToMove = conflict.slots[conflict.slots.length - 1];
      updatedCadence = updatedCadence.map((slot) => (slot.id === slotToMove.id ? { ...slot, day: targetDay } : slot));
    }
  });

  return { ...plan, cadence: updatedCadence };
};
