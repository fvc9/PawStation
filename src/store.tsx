import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Dog = { id: string; name: string; breed: string; age: number; size: 'chico' | 'mediano' | 'grande'; personality: 'tranquilo' | 'juguetón' | 'ansioso'; photo: string };
export type Station = { id: string; status: 'online' | 'offline' | 'searching'; battery: number; wifi: 'good' | 'weak' | 'none' };
export type ContentType = 'audio' | 'video' | 'music' | 'aroma' | 'reward';
export type ContentItem = { id: string; type: ContentType; title: string; duration: number; createdAt: string; favorite: boolean };
export type ButtonConfig = { id: string; color: string; label: string; actions: ContentItem[]; cooldownSec: number; activeHours: { from: string; to: string }; dailyRewardLimit: number };
export type BarkIntensity = 'baja' | 'media' | 'alta';
export type BarkEvent = { id: string; timestamp: string; durationSec: number; intensity: BarkIntensity; seen: boolean; autoResponseId?: string };
export type ActivityEvent = { id: string; timestamp: string; buttonId: string; triggered: ContentItem[]; clipUrl: string; seen: boolean; type?: 'boton' | 'ladrido'; durationSec?: number; intensity?: BarkIntensity; autoResponseId?: string };
export type BarkConfig = { enabled: boolean; thresholdSec: number; sensitivity: BarkIntensity; cooldownMin: number; quietHours: boolean; push: boolean; sound: boolean; vibration: boolean; autoResponse: boolean; autoResponseId: string; dailyLimit: number };
export type Toast = { id: number; title: string; message: string; tone?: 'success' | 'warning' | 'error' };
type AppData = { dog: Dog; station: Station; content: ContentItem[]; buttons: ButtonConfig[]; events: ActivityEvent[]; rewardCount: number; onboarded: boolean; barkConfig: BarkConfig; };

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
    { id: 'b1', color: '#D9642E', label: 'Compañía', actions: [initialContent[0], initialContent[5], initialContent[10]], cooldownSec: 120, activeHours: { from: '08:00', to: '21:00' }, dailyRewardLimit: 6 },
    { id: 'b2', color: '#2F8F83', label: 'Calma', actions: [initialContent[2], initialContent[7]], cooldownSec: 180, activeHours: { from: '08:00', to: '22:00' }, dailyRewardLimit: 0 },
    { id: 'b3', color: '#ECB948', label: 'Juego', actions: [initialContent[1]], cooldownSec: 90, activeHours: { from: '09:00', to: '20:00' }, dailyRewardLimit: 2 },
  ],
  events: initialEvents, rewardCount: 3, onboarded: false, barkConfig: { enabled: true, thresholdSec: 120, sensitivity: 'media', cooldownMin: 10, quietHours: true, push: true, sound: true, vibration: true, autoResponse: false, autoResponseId: 'm1', dailyLimit: 3 },
};

type Store = AppData & {
  toast: Toast | null; setDog: (dog: Dog) => void; setStation: (patch: Partial<Station>) => void; completeOnboarding: () => void;
  addContent: (item: ContentItem) => void; updateContent: (id: string, patch: Partial<ContentItem>) => void; deleteContent: (id: string) => void;
  updateButton: (id: string, patch: Partial<ButtonConfig>) => void; simulatePress: (buttonId: string) => void; markSeen: (id: string) => void;
  notify: (title: string, message: string, tone?: Toast['tone']) => void; clearToast: () => void; reset: () => void; updateBarkConfig: (patch: Partial<BarkConfig>) => void; simulateBark: (durationSec: number) => void;
};
const PawContext = createContext<Store | null>(null);
const STORAGE_KEY = 'pawstation-demo-v2';
export function evaluarLadridos(readings: Array<{ timestamp: number; durationSec: number; intensity: BarkIntensity }>, config: BarkConfig, lastAlertAt = 0, autoResponsesToday = 0, now = Date.now()) {
  if (!config.enabled || !readings.length) return { notify: false, autoRespond: false };
  const latest = readings[readings.length - 1];
  const sensitivityRank = { baja: 1, media: 2, alta: 3 };
  if (sensitivityRank[latest.intensity] < sensitivityRank[config.sensitivity]) return { notify: false, autoRespond: false };
  const continuous = readings.reduce((sum, r) => sum + r.durationSec, 0);
  const inQuiet = config.quietHours && (new Date(now).getHours() >= 22 || new Date(now).getHours() < 7);
  const cooldown = now - lastAlertAt < config.cooldownMin * 60000;
  const notify = continuous >= config.thresholdSec && !inQuiet && !cooldown;
  return { notify, autoRespond: notify && config.autoResponse && autoResponsesToday < config.dailyLimit };
}
function load(): AppData {
  try { const saved = localStorage.getItem(STORAGE_KEY); if (!saved) return defaults; const parsed = JSON.parse(saved); return { ...defaults, ...parsed, barkConfig: { ...defaults.barkConfig, ...(parsed.barkConfig || {}) }, events: (parsed.events || []).map((e: ActivityEvent) => ({ type: 'boton', ...e })) }; } catch { return defaults; }
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
    updateBarkConfig: patch => setData(d => ({ ...d, barkConfig: { ...d.barkConfig, ...patch } })),
    simulateBark: durationSec => setData(d => {
      const intensity: BarkIntensity = durationSec >= 120 ? 'alta' : durationSec >= 60 ? 'media' : 'baja';
      const now = Date.now();
      const today = new Date().toDateString();
      const todayBarks = d.events.filter(e => e.type === 'ladrido' && new Date(e.timestamp).toDateString() === today);
      const last = todayBarks[0];
      const evaluated = evaluarLadridos([{ timestamp: now, durationSec, intensity }], d.barkConfig, last ? new Date(last.timestamp).getTime() : 0, todayBarks.filter(e => e.autoResponseId).length, now);
      const event: ActivityEvent = { id: crypto.randomUUID(), timestamp: new Date(now).toISOString(), buttonId: 'bark', triggered: [], clipUrl: '', seen: false, type: 'ladrido', durationSec, intensity, autoResponseId: evaluated.autoRespond ? d.barkConfig.autoResponseId : undefined };
      window.setTimeout(() => notify(evaluated.notify ? `🐕 ${d.dog.name} lleva ${Math.round(durationSec / 60)} min ladrando` : 'Ladridos registrados', evaluated.notify ? (evaluated.autoRespond ? 'Iniciamos una respuesta calmante automática.' : 'Puedes hablarle o poner música desde la notificación.') : 'El evento quedó guardado en Actividad.', evaluated.notify ? 'warning' : 'success'), 0);
      return { ...d, events: [event, ...d.events] };
    }),
    markSeen: id => setData(d => ({ ...d, events: d.events.map(e => e.id === id ? { ...e, seen: true } : e) })),
    notify, clearToast: () => setToast(null),
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ } setData(defaults); setToast(null); },
  }), [data, toast]);
  return <PawContext.Provider value={value}>{children}</PawContext.Provider>;
}
export function usePaw() { const value = useContext(PawContext); if (!value) throw new Error('usePaw must be used inside PawProvider'); return value; }
