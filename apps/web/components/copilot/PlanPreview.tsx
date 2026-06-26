import React from "react";
import classNames from "classnames";
import { Badge, Button } from "@quillsocial/ui";
import { ChevronDown, Edit } from "@quillsocial/ui/components/icon";
import {
  CadenceChannel,
  CadenceFormat,
  Plan,
  PlanBlockKey,
  PlanPillar,
  Target,
  TargetPlatform,
} from "./types";
import { cadenceDays } from "./utils";
import { channelLabels, formatLegend, platformBadges } from "./constants";

interface PlanPreviewProps {
  plan: Plan;
  expandedBlock: PlanBlockKey | null;
  onToggleBlock: (block: PlanBlockKey) => void;
  onEditPillars: () => void;
  onEditCadence: () => void;
  onEditTargets: () => void;
  onEditEngagement: () => void;
  validationErrors: Partial<Record<PlanBlockKey, string>>;
}

const PlanPreviewBlock: React.FC<{
  title: string;
  block: PlanBlockKey;
  expandedBlock: PlanBlockKey | null;
  onToggleBlock: (block: PlanBlockKey) => void;
  onEdit: () => void;
  hasError?: boolean;
  helper?: string;
  children: React.ReactNode;
}> = ({ title, block, expandedBlock, onToggleBlock, onEdit, hasError, helper, children }) => {
  const isOpen = expandedBlock === block;
  return (
    <div className={classNames("rounded-2xl border bg-white", hasError ? "border-rose-400" : "border-slate-200")}>
      <button
        type="button"
        onClick={() => onToggleBlock(block)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{title}</span>
            {hasError && (
              <Badge color="danger" size="sm">
                Fix
              </Badge>
            )}
          </div>
          {helper && <p className="text-xs text-slate-500">{helper}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="icon"
            color="minimal"
            size="sm"
            aria-label={`Edit ${title}`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <Edit size={16} />
          </Button>
          <ChevronDown className={classNames("transition-transform", isOpen ? "rotate-180" : "rotate-0")} size={18} />
        </div>
      </button>
      {isOpen && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </div>
  );
};

const PillarTag: React.FC<{ pillar: PlanPillar }> = ({ pillar }) => (
  <div className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-slate-800" style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}>
    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pillar.color }} />
    {pillar.name}
  </div>
);

const CadenceGrid: React.FC<{ plan: Plan }> = ({ plan }) => {
  const dayColumns = cadenceDays.map((day) => ({ day, slots: plan.cadence.filter((slot) => slot.day === day) }));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-7 gap-3">
        {dayColumns.map(({ day, slots }) => (
          <div key={day} className="space-y-2">
            <div className="text-sm font-semibold text-slate-600">{day}</div>
            {slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">Empty</div>
            ) : (
              slots.map((slot) => (
                <div key={`${slot.id}-${slot.type}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <span>{formatLegend[slot.type]}</span>
                    {slot.hourHint && <span>{`${slot.hourHint}:00`}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {slot.channels.map((channel) => (
                      <span key={`${slot.id}-${channel}`} className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {channelLabels[channel]}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-600">Legend</span>
          {Object.entries(formatLegend).map(([key, label]) => (
            <span key={key} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const TargetsList: React.FC<{ targets: Target[] }> = ({ targets }) => {
  if (targets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">
        No targets yet. Import handles or add manually.
      </div>
    );
  }
  return (
    <ul className="space-y-2 text-sm">
      {targets.map((target) => {
        const badge = platformBadges[target.platform as TargetPlatform] ?? platformBadges.other;
        return (
          <li key={target.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div>
              <div className="font-medium text-slate-700">{target.handle}</div>
              {target.notes && <div className="text-xs text-slate-500">{target.notes}</div>}
            </div>
            <span className={classNames("rounded-full px-2 py-0.5 text-xs font-semibold", badge.tone)}>{badge.label}</span>
          </li>
        );
      })}
    </ul>
  );
};

export const PlanPreview: React.FC<PlanPreviewProps> = ({
  plan,
  expandedBlock,
  onToggleBlock,
  onEditCadence,
  onEditEngagement,
  onEditPillars,
  onEditTargets,
  validationErrors,
}) => (
  <div className="space-y-4">
    <PlanPreviewBlock
      title="Pillars"
      block="pillars"
      expandedBlock={expandedBlock}
      onToggleBlock={onToggleBlock}
      onEdit={onEditPillars}
      hasError={Boolean(validationErrors.pillars)}
      helper="These set your storytelling themes."
    >
      <div className="flex flex-wrap gap-2">
        {plan.pillars.map((pillar) => (
          <PillarTag key={pillar.id} pillar={pillar} />
        ))}
      </div>
    </PlanPreviewBlock>

    <PlanPreviewBlock
      title="Cadence"
      block="cadence"
      expandedBlock={expandedBlock}
      onToggleBlock={onToggleBlock}
      onEdit={onEditCadence}
      hasError={Boolean(validationErrors.cadence)}
      helper="Weekly structure across channels."
    >
      <CadenceGrid plan={plan} />
    </PlanPreviewBlock>

    <PlanPreviewBlock
      title="Targets"
      block="targets"
      expandedBlock={expandedBlock}
      onToggleBlock={onToggleBlock}
      onEdit={onEditTargets}
      helper="Accounts to follow, reply to, or study."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Peers</span>
            <Badge size="sm">{plan.targets.peers.length}</Badge>
          </div>
          <TargetsList targets={plan.targets.peers} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Prospects</span>
            <Badge size="sm">{plan.targets.prospects.length}</Badge>
          </div>
          <TargetsList targets={plan.targets.prospects} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Leaders</span>
            <Badge size="sm">{plan.targets.leaders.length}</Badge>
          </div>
          <TargetsList targets={plan.targets.leaders} />
        </div>
      </div>
    </PlanPreviewBlock>

    <PlanPreviewBlock
      title="Engagement Goal"
      block="engagement"
      expandedBlock={expandedBlock}
      onToggleBlock={onToggleBlock}
      onEdit={onEditEngagement}
      hasError={Boolean(validationErrors.engagement)}
      helper="Replies per day to hit."
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl font-semibold text-slate-800">{plan.dailyReplies}</div>
        <div className="text-sm text-slate-500">replies / day</div>
      </div>
    </PlanPreviewBlock>
  </div>
);

