import type { Slot } from "@/lib/catalog";
import { lastName } from "@/lib/catalog";

type Player = {
  id: number;
  name: string;
  position: 'GK'|'DF'|'MF'|'FW';
  birth_year: number | null;
  nationality: string | null;
};

const NOW_YEAR = 2026;

function archetype(p: Player): string {
  if (!p.birth_year) return '';
  const age = NOW_YEAR - p.birth_year;
  if (age >= 65) return '★';
  if (age <= 22) return '⚡';
  return '';
}

function colorFor(pos: string): { bg: string; fg: string } {
  if (pos === 'GK') return { bg: 'var(--accent)', fg: 'var(--accent-foreground)' };
  if (pos === 'FW') return { bg: 'var(--primary)', fg: 'var(--primary-foreground)' };
  return { bg: 'var(--chalk)', fg: '#111' };
}

export function MiniCard({ slot, player, jersey }: { slot: Slot; player: Player; jersey: number }) {
  const col = colorFor(player.position);
  const tag = archetype(player);
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 w-[58px] sm:w-[68px] select-none"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <div className="border-2 border-foreground bg-background shadow-[2px_2px_0_var(--color-foreground)]">
        <div
          className="text-[10px] font-bold tracking-wider text-center py-0.5"
          style={{ background: col.bg, color: col.fg }}
        >
          {slot.slot}
        </div>
        <div className="px-1 py-1 text-center min-h-[34px] flex items-center justify-center">
          <div className="display text-[15px] sm:text-[17px] leading-none break-words">
            {lastName(player.name)}
          </div>
        </div>
        <div className="border-t border-border flex items-center justify-between text-[10px] px-1 py-0.5 bg-surface">
          <span>{player.nationality ?? '·'}</span>
          <span className="font-mono">{jersey}</span>
        </div>
      </div>
      {tag && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-accent-foreground border-2 border-foreground flex items-center justify-center text-[10px] font-bold">
          {tag}
        </div>
      )}
    </div>
  );
}

export function PitchSVG() {
  return (
    <svg viewBox="0 0 100 150" className="absolute inset-0 w-full h-full pointer-events-none">
      <rect x="1" y="1" width="98" height="148" fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" />
      <line x1="1" y1="75" x2="99" y2="75" stroke="var(--color-pitch-line)" strokeWidth="0.4" />
      <circle cx="50" cy="75" r="9" fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" />
      <circle cx="50" cy="75" r="0.6" fill="var(--color-pitch-line)" />
      <rect x="30" y="1" width="40" height="14" fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" />
      <rect x="40" y="1" width="20" height="5" fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" />
      <rect x="30" y="135" width="40" height="14" fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" />
      <rect x="40" y="144" width="20" height="5" fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.4" />
    </svg>
  );
}

export function Pitch({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pitch-bg w-full aspect-[2/3] max-w-md mx-auto overflow-hidden border-2 border-foreground">
      <PitchSVG />
      {children}
    </div>
  );
}
