// Catálogo de slugs y constantes 11Pulse. Sin imágenes oficiales.

export const AVATARS: { id: string; emoji: string; label: string }[] = [
  { id: 'av-01', emoji: '⚽', label: 'Balón' },
  { id: 'av-02', emoji: '🥅', label: 'Portería' },
  { id: 'av-03', emoji: '🧤', label: 'Guantes' },
  { id: 'av-04', emoji: '🎯', label: 'Diana' },
  { id: 'av-05', emoji: '🔥', label: 'Fuego' },
  { id: 'av-06', emoji: '⚡', label: 'Rayo' },
  { id: 'av-07', emoji: '👟', label: 'Bota' },
  { id: 'av-08', emoji: '🦁', label: 'León' },
  { id: 'av-09', emoji: '🐉', label: 'Dragón' },
  { id: 'av-10', emoji: '🦅', label: 'Águila' },
  { id: 'av-11', emoji: '🐂', label: 'Toro' },
  { id: 'av-12', emoji: '🐺', label: 'Lobo' },
  { id: 'av-13', emoji: '🦈', label: 'Tiburón' },
  { id: 'av-14', emoji: '👑', label: 'Corona' },
  { id: 'av-15', emoji: '🏆', label: 'Copa' },
  { id: 'av-16', emoji: '⭐', label: 'Estrella' },
  { id: 'av-17', emoji: '💎', label: 'Diamante' },
  { id: 'av-18', emoji: '🎺', label: 'Trompeta' },
  { id: 'av-19', emoji: '🥁', label: 'Tambor' },
  { id: 'av-20', emoji: '🎨', label: 'Paleta' },
  { id: 'av-21', emoji: '🛸', label: 'OVNI' },
  { id: 'av-22', emoji: '🚀', label: 'Cohete' },
  { id: 'av-23', emoji: '🌋', label: 'Volcán' },
  { id: 'av-24', emoji: '🪐', label: 'Planeta' },
];

export const CRESTS: { id: string; emoji: string; label: string }[] = [
  { id: 'cr-01', emoji: '🦁', label: 'León' },
  { id: 'cr-02', emoji: '🦅', label: 'Águila' },
  { id: 'cr-03', emoji: '🐺', label: 'Lobo' },
  { id: 'cr-04', emoji: '🐂', label: 'Toro' },
  { id: 'cr-05', emoji: '🦈', label: 'Tiburón' },
  { id: 'cr-06', emoji: '🐉', label: 'Dragón' },
  { id: 'cr-07', emoji: '⚡', label: 'Rayo' },
  { id: 'cr-08', emoji: '🔥', label: 'Fuego' },
  { id: 'cr-09', emoji: '⚓', label: 'Ancla' },
  { id: 'cr-10', emoji: '⚔️', label: 'Espadas' },
  { id: 'cr-11', emoji: '🌋', label: 'Volcán' },
  { id: 'cr-12', emoji: '💀', label: 'Calavera' },
];

export type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
export const FORMATIONS: Formation[] = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'];

// Slot definitions: { slot: 'GK'|'CB1'..., position, x%, y% } — top is goal of opponent (0%), bottom = own goal (100%)
export type Slot = { slot: string; position: 'GK'|'DF'|'MF'|'FW'; x: number; y: number };

export const FORMATION_LAYOUTS: Record<Formation, Slot[]> = {
  '4-3-3': [
    { slot: 'GK',  position: 'GK', x: 50, y: 92 },
    { slot: 'LB',  position: 'DF', x: 15, y: 72 },
    { slot: 'CB1', position: 'DF', x: 38, y: 75 },
    { slot: 'CB2', position: 'DF', x: 62, y: 75 },
    { slot: 'RB',  position: 'DF', x: 85, y: 72 },
    { slot: 'CM1', position: 'MF', x: 28, y: 50 },
    { slot: 'CM2', position: 'MF', x: 50, y: 52 },
    { slot: 'CM3', position: 'MF', x: 72, y: 50 },
    { slot: 'LW',  position: 'FW', x: 18, y: 22 },
    { slot: 'ST',  position: 'FW', x: 50, y: 16 },
    { slot: 'RW',  position: 'FW', x: 82, y: 22 },
  ],
  '4-4-2': [
    { slot: 'GK',  position: 'GK', x: 50, y: 92 },
    { slot: 'LB',  position: 'DF', x: 15, y: 72 },
    { slot: 'CB1', position: 'DF', x: 38, y: 75 },
    { slot: 'CB2', position: 'DF', x: 62, y: 75 },
    { slot: 'RB',  position: 'DF', x: 85, y: 72 },
    { slot: 'LM',  position: 'MF', x: 15, y: 48 },
    { slot: 'CM1', position: 'MF', x: 38, y: 50 },
    { slot: 'CM2', position: 'MF', x: 62, y: 50 },
    { slot: 'RM',  position: 'MF', x: 85, y: 48 },
    { slot: 'ST1', position: 'FW', x: 38, y: 18 },
    { slot: 'ST2', position: 'FW', x: 62, y: 18 },
  ],
  '3-5-2': [
    { slot: 'GK',  position: 'GK', x: 50, y: 92 },
    { slot: 'CB1', position: 'DF', x: 28, y: 75 },
    { slot: 'CB2', position: 'DF', x: 50, y: 78 },
    { slot: 'CB3', position: 'DF', x: 72, y: 75 },
    { slot: 'LWB', position: 'MF', x: 12, y: 52 },
    { slot: 'CM1', position: 'MF', x: 35, y: 50 },
    { slot: 'CM2', position: 'MF', x: 50, y: 55 },
    { slot: 'CM3', position: 'MF', x: 65, y: 50 },
    { slot: 'RWB', position: 'MF', x: 88, y: 52 },
    { slot: 'ST1', position: 'FW', x: 38, y: 18 },
    { slot: 'ST2', position: 'FW', x: 62, y: 18 },
  ],
  '4-2-3-1': [
    { slot: 'GK',  position: 'GK', x: 50, y: 92 },
    { slot: 'LB',  position: 'DF', x: 15, y: 72 },
    { slot: 'CB1', position: 'DF', x: 38, y: 75 },
    { slot: 'CB2', position: 'DF', x: 62, y: 75 },
    { slot: 'RB',  position: 'DF', x: 85, y: 72 },
    { slot: 'CDM1',position: 'MF', x: 38, y: 58 },
    { slot: 'CDM2',position: 'MF', x: 62, y: 58 },
    { slot: 'LAM', position: 'MF', x: 18, y: 32 },
    { slot: 'CAM', position: 'MF', x: 50, y: 35 },
    { slot: 'RAM', position: 'MF', x: 82, y: 32 },
    { slot: 'ST',  position: 'FW', x: 50, y: 14 },
  ],
};

export function getAvatar(id: string | null | undefined) {
  return AVATARS.find(a => a.id === id) ?? AVATARS[0];
}
export function getCrest(id: string | null | undefined) {
  return CRESTS.find(c => c.id === id) ?? CRESTS[0];
}

// Base62 short code
const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export function genCode(len = 7): string {
  let s = '';
  for (let i = 0; i < len; i++) s += BASE62[Math.floor(Math.random() * 62)];
  return s;
}
export function genLeagueCode(): string {
  const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += ABC[Math.floor(Math.random() * ABC.length)];
  return s;
}

export function lastName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1].toUpperCase();
}
