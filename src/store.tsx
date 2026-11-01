import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Dog = { id: string; name: string; breed: string; age: number; size: 'chico' | 'mediano' | 'grande'; personality: 'tranquilo' | 'juguetón' | 'ansioso'; photo: string };
export type Station = { id: string; status: 'online' | 'offline' | 'searching'; battery: number; wifi: 'good' | 'weak' | 'none' };
export type ContentType = 'audio' | 'video' | 'music' | 'aroma' | 'reward';
export type ContentItem = { id: string; type: ContentType; title: string; duration: number; createdAt: string; favorite: boolean };
export type ButtonConfig = { id: string; color: string; label: string; actions: ContentItem[]; cooldownSec: number; activeHours: { from: string; to: string }; dailyRewardLimit: number };
export type ActivityEvent = { id: string; timestamp: string; buttonId: string; triggered: ContentItem[]; clipUrl: string; seen: boolean };
export type Toast = { id: number; title: string; message: string; tone?: 'success' | 'warning' | 'error' };
type AppData = { dog: Dog; station: Station; content: ContentItem[]; buttons: ButtonConfig[]; events: ActivityEvent[]; rewardCount: number; onboarded: boolean };

const now = Date.now();
const mk = (id: string, type: ContentType, title: string, duration = 0): ContentItem => ({ id, type, title, duration, createdAt: new Date(now - Number(id.replace(/\D/g, '') || 1) * 864000).toISOString(), favorite: id === 'a1' });
const initialContent = [
  mk('a1', 'audio', 'Buen chico', 8), mk('a2', 'audio', 'Ya voy llegando', 11), mk('a3', 'audio', 'Quédate tranquilo', 14),
  mk('v1', 'video', 'Saludo de Federico', 22), mk('v2', 'video', 'Jugando en el parque', 28),
  mk('m1', 'music', 'Calma', 600), mk('m2', 'music', 'Siesta', 900), mk('m3', 'music', 'Lluvia suave', 1200),
  mk('r1', 'aroma', 'Mi ropa', 300), mk('r2', 'aroma', 'Lavanda suave', 300),
  mk('p1', 'reward', 'Premio pequeño'), mk('p2', 'reward', 'Premio favorito'),
];
const initialEvents: ActivityEvent[] = Array.from({ length: 15 }, (_, i) => ({
  id: `e${i + 1}`, timestamp: new Date(now - (i * 43 + 10) * 60000).toISOString(), buttonId: i % 3 === 0 ? 'b2' : 'b1',
  triggered: i % 3 === 0 ? [initialContent[5]] : [initialContent[0], initialContent[10]], clipUrl: '', seen: i > 2,
}));
const defaults: AppData = {
  dog: { id: 'dog1', name: 'Luna', breed: 'Mestiza', age: 3, size: 'mediano', personality: 'juguetón', photo: '' },
  station: { id: 'PAW-2841', status: 'online', battery: 78, wifi: 'good' }, content: initialContent,
  buttons: [
    { id: 'b1', color: '#E5484D', label: 'Compañía', actions: [initialContent[0], initialContent[5], initialContent[10]], cooldownSec: 120, activeHours: { from: '08:00', to: '21:00' }, dailyRewardLimit: 6 },
    { id: 'b2', color: '#3FA796', label: 'Calma', actions: [initialContent[2], initialContent[7]], cooldownSec: 180, activeHours: { from: '08:00', to: '22:00' }, dailyRewardLimit: 0 },
    { id: 'b3', color: '#F5B031', label: 'Juego', actions: [initialContent[1]], cooldownSec: 90, activeHours: { from: '09:00', to: '20:00' }, dailyRewardLimit: 2 },
  ],
  events: initialEvents, rewardCount: 3, onboarded: false,
};

type Store = AppData & {
  toast: Toast | null; setDog: (dog: Dog) => void; setStation: (patch: Partial<Station>) => void; completeOnboarding: () => void;
  addContent: (item: ContentItem) => void; updateContent: (id: string, patch: Partial<ContentItem>) => void; deleteContent: (id: string) => void;
  updateButton: (id: string, patch: Partial<ButtonConfig>) => void; simulatePress: (buttonId: string) => void; markSeen: (id: string) => void;
  notify: (title: string, message: string, tone?: Toast['tone']) => void; clearToast: () => void; reset: () => void;
};
const PawContext = createContext<Store | null>(null);
const STORAGE_KEY = 'pawstation-demo-v2';
function load(): AppData {
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? { ...defaults, ...JSON.parse(saved) } : defaults; } catch { return defaults; }
}

export function PawProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);
  const [toast, setToast] = useState<Toast | null>(null);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* usable without storage */ } }, [data]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 4200); return () => window.clearTimeout(timer); }, [toast]);
  const notify = (title: string, message: string, tone: Toast['tone'] = 'success') => setToast({ id: Date.now(), title, message, tone });
  const value = useMemo<Store>(() => ({
    ...data, toast,
    setDog: dog => setData(d => ({ ...d, dog })), setStation: patch => setData(d => ({ ...d, station: { ...d.station, ...patch } })),
    completeOnboarding: () => setData(d => ({ ...d, onboarded: true })), addContent: item => setData(d => ({ ...d, content: [item, ...d.content] })),
    updateContent: (id, patch) => setData(d => ({ ...d, content: d.content.map(item => item.id === id ? { ...item, ...patch } : item) })),
    deleteContent: id => setData(d => ({ ...d, content: d.content.filter(item => item.id !== id) })),
    updateButton: (id, patch) => setData(d => ({ ...d, buttons: d.buttons.map(button => button.id === id ? { ...button, ...patch } : button) })),
    simulatePress: buttonId => setData(d => {
      const button = d.buttons.find(b => b.id === buttonId);
      if (!button) return d;
      if (d.station.status !== 'online') { notify('Estación sin conexión', 'No pudimos recibir la presión. Revisa tu estación.', 'error'); return d; }
      const last = d.events.find(e => e.buttonId === buttonId);
      if (last && Date.now() - new Date(last.timestamp).getTime() < button.cooldownSec * 1000) { notify('Luna volvió a presionar', `Esperaremos ${button.cooldownSec / 60} min para evitar repeticiones.`, 'warning'); return d; }
      const hour = new Date().toTimeString().slice(0, 5);
      if (hour < button.activeHours.from || hour > button.activeHours.to) { notify('Fuera del horario activo', 'Registramos la presión sin activar contenido.', 'warning'); return d; }
      let rewardCount = d.rewardCount;
      const triggered = button.actions.filter(action => {
        if (action.type !== 'reward') return true;
        if (rewardCount >= button.dailyRewardLimit) { window.setTimeout(() => notify('Límite de premios alcanzado', 'Acompañamos a Luna sin entregar otro premio.', 'warning'), 0); return false; }
        rewardCount += 1; return true;
      });
      const event: ActivityEvent = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), buttonId, triggered, clipUrl: '', seen: false };
      window.setTimeout(() => notify(`🐾 ${d.dog.name} te llamó`, `Activamos ${triggered.map(a => a.title).join(', ') || 'el modo calma'}.`), 0);
      return { ...d, events: [event, ...d.events], rewardCount };
    }),
    markSeen: id => setData(d => ({ ...d, events: d.events.map(e => e.id === id ? { ...e, seen: true } : e) })),
    notify, clearToast: () => setToast(null),
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ } setData(defaults); setToast(null); },
  }), [data, toast]);
  return <PawContext.Provider value={value}>{children}</PawContext.Provider>;
}
export function usePaw() { const value = useContext(PawContext); if (!value) throw new Error('usePaw must be used inside PawProvider'); return value; }
