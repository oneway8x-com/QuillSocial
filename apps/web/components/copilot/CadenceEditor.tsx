import React, { useEffect, useState } from "react";
import { Button, NumberInput, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@quillsocial/ui";
import { Trash2, Plus } from "@quillsocial/ui/components/icon";
import classNames from "classnames";
import { CadenceChannel, CadenceDay, CadenceFormat, PlanCadenceSlot } from "./types";
import { cadenceChannels, cadenceDays, cadenceFormats, createId } from "./utils";
import { channelLabels, formatLegend } from "./constants";

interface CadenceEditorProps {
  open: boolean;
  cadence: PlanCadenceSlot[];
  onClose: () => void;
  onSave: (cadence: PlanCadenceSlot[]) => void;
}

export const CadenceEditor: React.FC<CadenceEditorProps> = ({ open, cadence, onClose, onSave }) => {
  const [localCadence, setLocalCadence] = useState<PlanCadenceSlot[]>(cadence);

  useEffect(() => { setLocalCadence(cadence); }, [cadence]);

  const updateSlot = (id: string, updater: Partial<PlanCadenceSlot>) => {
    setLocalCadence((prev) => prev.map((slot) => (slot.id === id ? { ...slot, ...updater } : slot)));
  };

  const toggleChannel = (id: string, channel: CadenceChannel) => {
    setLocalCadence((prev) => prev.map((slot) => {
      if (slot.id !== id) return slot;
      const channels = slot.channels.includes(channel)
        ? slot.channels.filter((v) => v !== channel)
        : [...slot.channels, channel];
      return { ...slot, channels };
    }));
  };

  const addSlot = () => {
    setLocalCadence((prev) => ([...prev, { id: createId(), day: "Mon", type: "text", channels: ["linkedin"], hourHint: 9 }]));
  };

  const removeSlot = (id: string) => setLocalCadence((prev) => prev.filter((slot) => slot.id !== id));

  return (
    <Sheet open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>Edit cadence</SheetTitle>
        </SheetHeader>
        <div className="mt-6 grid gap-4">
          {localCadence.map((slot) => (
            <div key={slot.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-600">{slot.day} • {formatLegend[slot.type]}</div>
                <Button variant="icon" color="minimal" size="sm" onClick={() => removeSlot(slot.id)} aria-label="Remove slot">
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Day</label>
                  <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={slot.day} onChange={(e) => updateSlot(slot.id, { day: e.target.value as CadenceDay })}>
                    {cadenceDays.map((day) => (<option key={day} value={day}>{day}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Format</label>
                  <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={slot.type} onChange={(e) => updateSlot(slot.id, { type: e.target.value as CadenceFormat })}>
                    {cadenceFormats.map((format) => (<option key={format} value={format}>{formatLegend[format]}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Channels</label>
                <div className="flex flex-wrap gap-2">
                  {cadenceChannels.map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(slot.id, channel)}
                      className={classNames(
                        "rounded-xl px-3 py-1 text-xs font-semibold transition",
                        slot.channels.includes(channel) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {channelLabels[channel]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Hour hint</label>
                <NumberInput
                  value={slot.hourHint ?? ""}
                  min={5}
                  max={20}
                  placeholder="9"
                  onChange={(event) => updateSlot(slot.id, { hourHint: event.target.value ? Number(event.target.value) : undefined })}
                />
              </div>
            </div>
          ))}
        </div>
        <SheetFooter className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button color="minimal" onClick={addSlot} StartIcon={Plus}>Add slot</Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button color="minimal" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(localCadence)}>Save cadence</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

