import { type DashaData, type DashaEntry, formatDate } from "@/lib/kpEngine";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const LORD_COLORS: Record<string, string> = {
  Sun: "oklch(0.78 0.16 60)",
  Moon: "oklch(0.85 0.06 250)",
  Mars: "oklch(0.65 0.22 25)",
  Mercury: "oklch(0.72 0.14 145)",
  Jupiter: "oklch(0.82 0.16 80)",
  Venus: "oklch(0.78 0.12 330)",
  Saturn: "oklch(0.60 0.08 275)",
  Rahu: "oklch(0.55 0.15 290)",
  Ketu: "oklch(0.65 0.12 45)",
};

function isActive(entry: DashaEntry): boolean {
  const now = new Date();
  return entry.startDate <= now && now < entry.endDate;
}

function isFuture(entry: DashaEntry): boolean {
  return entry.startDate > new Date();
}

interface DashaRowProps {
  entry: DashaEntry;
  level: number;
  index: number;
}

function DashaRow({ entry, level, index }: DashaRowProps) {
  const [expanded, setExpanded] = useState(false);
  const active = isActive(entry);
  const future = isFuture(entry);
  const color = LORD_COLORS[entry.lord] || "oklch(0.7 0.1 60)";
  const children =
    level === 0
      ? entry.antardashas
      : level === 1
        ? entry.pratyantars
        : undefined;
  const hasChildren = children && children.length > 0;

  return (
    <div
      data-ocid={`dasha.item.${index + 1}`}
      className={`rounded-lg mb-1 overflow-hidden border transition-all ${
        active
          ? "border-amber-400/50 bg-amber-950/20"
          : "border-transparent hover:border-white/10"
      }`}
      style={{ paddingLeft: level * 12 }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left group"
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{ cursor: hasChildren ? "pointer" : "default" }}
      >
        {/* Color dot */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        {/* Lord name */}
        <span
          className={`font-semibold text-sm flex-1 ${
            active
              ? "text-amber-300"
              : future
                ? "text-white/50"
                : "text-white/90"
          }`}
        >
          {entry.lord}
          {active && (
            <span className="ml-2 text-[10px] bg-amber-500 text-amber-950 font-bold px-1.5 py-0.5 rounded-full">
              NOW
            </span>
          )}
        </span>
        {/* Dates */}
        <span className="text-[11px] text-white/40 mr-2 hidden sm:block">
          {formatDate(entry.startDate)} – {formatDate(entry.endDate)}
        </span>
        {/* Expand icon */}
        {hasChildren && (
          <span className="text-white/40 group-hover:text-white/70 transition-colors">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </button>

      {/* Mobile dates */}
      <div className="px-3 pb-1.5 text-[10px] text-white/35 sm:hidden">
        {formatDate(entry.startDate)} – {formatDate(entry.endDate)}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-2 pb-1">
              {children!.map((child, ci) => (
                <DashaRow
                  key={`${child.lord}-${ci}`}
                  entry={child}
                  level={level + 1}
                  index={ci}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  dasha: DashaData;
}

export default function DashaSection({ dasha }: Props) {
  const activeMaha = dasha.mahadashas.find(isActive);

  return (
    <div
      className="rounded-xl h-full flex flex-col"
      style={{
        background: "oklch(var(--dasha-bg))",
        color: "oklch(var(--dasha-text))",
      }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "oklch(var(--dasha-border))" }}
      >
        <h3 className="font-semibold text-sm text-amber-400">
          Vimshottari Dasha
        </h3>
        {activeMaha && (
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(var(--dasha-muted))" }}
          >
            Current:{" "}
            <span className="text-amber-300 font-medium">
              {activeMaha.lord}
            </span>{" "}
            Mahadasha
          </p>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto px-2 py-2"
        style={{ maxHeight: 480 }}
      >
        <div
          className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-2"
          style={{ color: "oklch(var(--dasha-muted))" }}
        >
          Click to expand Antardasha → Pratyantar
        </div>
        {dasha.mahadashas.map((entry, i) => (
          <DashaRow
            key={`${entry.lord}-${i}`}
            entry={entry}
            level={0}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
