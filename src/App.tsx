import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { aplicarTema, generarPaleta } from './theme';
import {
  Activity, Bell, Bluetooth, Bone, Camera, Check, ChevronLeft, ChevronRight, CircleUserRound, Clock3, CloudRain,
  Dog, Edit3, Film, Gauge, Heart, HelpCircle, Home, ImagePlus, Leaf, Library, LockKeyhole, Menu, Mic2, Music2,
  Pause, Play, Plus, Power, Radio, RefreshCw, RotateCcw, Settings, ShieldCheck, Signal, SlidersHorizontal, Sparkles,
  Star, Trash2, TriangleAlert, Volume2, Wifi, WifiOff, X, Zap,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePaw, type ContentItem, type ContentType, type Dog as DogModel } from './store';

type Screen = 'home' | 'content' | 'activity' | 'settings' | 'live' | 'buttons' | 'stats' | 'notifications';
type IconType = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
const typeLabels: Record<ContentType, string> = { audio: 'Audios', video: 'Videos', music: 'Música', aroma: 'Aromas', reward: 'Recompensas' };

function Button({ children, icon: Icon, variant = 'primary', className = '', ...props }: {
  children?: ReactNode; icon?: IconType; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon' | 'nav'; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-paw-orange text-paw-ink shadow-sm hover:bg-paw-orange-dark',
    secondary: 'bg-orange-50 text-paw-orange-dark border border-orange-200 hover:bg-orange-100',
    ghost: 'bg-transparent text-paw-ink hover:bg-stone-100',
    danger: 'bg-red-50 text-paw-error hover:bg-red-100',
    icon: 'bg-white text-paw-ink border border-stone-200 hover:bg-stone-50',
    nav: 'bg-transparent text-paw-muted',
  };
  return <button className={`min-h-12 rounded-2xl px-4 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[.98] disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>
    {Icon && <Icon size={19} strokeWidth={2.2} />}{children}
  </button>;
}
function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`rounded-card bg-white shadow-soft ${onClick ? 'cursor-pointer transition-transform active:scale-[.99]' : ''} ${className}`}>{children}</div>;
}
function Title({ children, size = 'lg', className = '' }: { children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl', xl: 'text-[28px] leading-8' };
  return <div className={`font-extrabold text-paw-ink ${sizes[size]} ${className}`}>{children}</div>;
}
function Input({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span><input className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition ${error ? 'border-paw-error' : 'border-stone-200 focus:border-paw-orange'}`} {...props} />{error && <span className="mt-1 block text-xs font-bold text-paw-error">{error}</span>}</label>;
}
function Select({ label, children, ...props }: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span><select className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-paw-orange" {...props}>{children}</select></label>;
}
function Toggle({ active, onChange, label }: { active: boolean; onChange: () => void; label: string }) {
  return <button aria-pressed={active} aria-label={label} onClick={onChange} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${active ? 'bg-paw-green' : 'bg-stone-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-1' : '-translate-x-5'}`} /></button>;
}
function Chip({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-extrabold transition ${active ? 'bg-paw-ink text-white' : 'border border-stone-200 bg-white text-paw-muted'}`}>{children}</button>;
}
function TopBar({ title, onBack, action }: { title: string; onBack?: () => void; action?: ReactNode }) {
  return <div className="sticky top-0 z-20 flex h-16 items-center justify-between bg-paw-cream/95 px-5 backdrop-blur">
    <div className="flex min-w-0 items-center gap-2">{onBack && <Button variant="ghost" icon={ChevronLeft} className="w-12 px-0" onClick={onBack} aria-label="Volver" />}<Title size="lg" className="truncate">{title}</Title></div>{action}
  </div>;
}
function EmptyState({ icon: Icon = Dog, title, text }: { icon?: IconType; title: string; text: string }) {
  return <Card className="p-8 text-center"><Icon className="mx-auto mb-3 text-paw-orange" size={40} /><Title size="md">{title}</Title><p className="mt-1 text-sm text-paw-muted">{text}</p></Card>;
}

const slides = [
  { icon: Dog, title: 'Tu perro nunca está solo', text: 'Tu voz, música y cariño llegan a casa cuando Luna más los necesita.' },
  { icon: Radio, title: 'Él te llama, tú respondes', text: 'Luna presiona su botón y tú recibes una señal. Así de simple.' },
  { icon: Bell, title: 'Solo te avisamos lo importante', text: 'Menos preocupación. Alertas relevantes y momentos que vale la pena ver.' },
];
function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const SlideIcon = slides[step].icon;
  return <div className="flex min-h-[844px] flex-col bg-paw-cream p-6">
    <div className="flex justify-between"><div className="flex items-center gap-2 font-extrabold text-paw-orange"><span className="grid h-9 w-9 place-items-center rounded-2xl bg-paw-orange text-white">P</span>PawStation</div><Button variant="ghost" onClick={onDone}>Omitir</Button></div>
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="relative mb-10 grid h-64 w-64 place-items-center rounded-[4rem] bg-orange-100">
        <div className="absolute -right-3 top-8 h-14 w-14 rounded-full bg-emerald-100" /><div className="absolute -left-2 bottom-8 h-9 w-9 rounded-full bg-yellow-100" />
        <SlideIcon size={112} strokeWidth={1.4} className="text-paw-orange" />
      </div>
      <Title size="xl">{slides[step].title}</Title><p className="mt-4 max-w-[310px] text-base leading-6 text-paw-muted">{slides[step].text}</p>
    </div>
    <div className="mb-5 flex justify-center gap-2">{slides.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-paw-orange' : 'w-2 bg-stone-300'}`} />)}</div>
    <Button onClick={() => step < 2 ? setStep(step + 1) : onDone()}>{step < 2 ? 'Siguiente' : 'Comenzar'}<ChevronRight size={18} /></Button>
  </div>;
}

function ProfileSetup({ onNext }: { onNext: () => void }) {
  const store = usePaw();
  const [dog, setDog] = useState<DogModel>(store.dog);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!dog.name.trim()) e.name = 'Cuéntanos cómo se llama';
    if (!dog.breed.trim()) e.breed = 'Ingresa su raza o “mestizo”';
    if (dog.age < 1 || dog.age > 25) e.age = 'Ingresa una edad entre 1 y 25';
    setErrors(e); if (!Object.keys(e).length) { store.setDog(dog); onNext(); }
  };
  return <div className="min-h-[844px] bg-paw-cream px-5 pb-8">
    <TopBar title="Cuéntanos sobre tu perro" />
    <div className="mx-auto mb-7 grid h-28 w-28 place-items-center rounded-full bg-orange-100 text-paw-orange"><Dog size={58} /><button className="absolute ml-20 mt-20 grid h-10 w-10 place-items-center rounded-full bg-paw-orange text-white shadow"><ImagePlus size={18} /></button></div>
    <p className="mb-6 text-center text-sm text-paw-muted">Personalizaremos la experiencia para que se sienta como en casa.</p>
    <div className="space-y-4">
      <Input label="Nombre" value={dog.name} error={errors.name} onChange={e => setDog({ ...dog, name: e.target.value })} />
      <Input label="Raza" value={dog.breed} error={errors.breed} onChange={e => setDog({ ...dog, breed: e.target.value })} />
      <Input label="Edad" type="number" value={dog.age} error={errors.age} onChange={e => setDog({ ...dog, age: Number(e.target.value) })} />
      <Select label="Tamaño" value={dog.size} onChange={e => setDog({ ...dog, size: e.target.value as DogModel['size'] })}><option value="chico">Chico</option><option value="mediano">Mediano</option><option value="grande">Grande</option></Select>
      <Select label="Personalidad" value={dog.personality} onChange={e => setDog({ ...dog, personality: e.target.value as DogModel['personality'] })}><option value="tranquilo">Tranquilo</option><option value="juguetón">Juguetón</option><option value="ansioso">Ansioso</option></Select>
      <Button className="mt-3 w-full" onClick={submit}>Continuar</Button>
    </div>
  </div>;
}

function Pairing({ onDone }: { onDone: () => void }) {
  const store = usePaw();
  const [step, setStep] = useState(0);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(false);
  const labels = ['Enciende tu estación', 'Busca PawStation', 'Conecta el dispositivo', 'Prueba el botón', 'Revisa la cámara'];
  const icons = [Power, Bluetooth, Wifi, Radio, Camera];
  const CurrentIcon = icons[step];
  const next = () => { if (step === 1 && !searching) { setSearching(true); window.setTimeout(() => setSearching(false), 1200); return; } if (step < 4) setStep(step + 1); else { store.setStation({ status: 'online' }); store.completeOnboarding(); onDone(); } };
  return <div className="min-h-[844px] bg-paw-cream px-5 pb-8">
    <TopBar title="Vincula tu estación" />
    <div className="mb-8 flex items-center gap-1">{labels.map((_, i) => <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-paw-orange' : 'bg-stone-200'}`} />)}</div>
    <div className="text-center"><span className="text-xs font-extrabold uppercase tracking-widest text-paw-orange">Paso {step + 1} de 5</span><Title size="xl" className="mt-2">{labels[step]}</Title></div>
    <div className="mx-auto my-9 grid h-56 w-56 place-items-center rounded-full bg-white shadow-soft"><CurrentIcon size={88} strokeWidth={1.4} className={`${searching ? 'live-dot' : ''} text-paw-green`} /></div>
    {step === 0 && <p className="text-center text-sm leading-6 text-paw-muted">Conecta PawStation a la corriente y mantén presionado el botón lateral hasta ver una luz naranja.</p>}
    {step === 1 && <Card className="p-4">{searching ? <div className="flex items-center gap-3"><RefreshCw className="animate-spin text-paw-orange" /><div><b>Buscando cerca...</b><p className="text-xs text-paw-muted">Wi-Fi y Bluetooth activados</p></div></div> : <button onClick={next} className="flex min-h-14 w-full items-center gap-3 text-left"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50"><Radio className="text-paw-green" /></span><span className="flex-1"><b>PawStation PAW-2841</b><small className="block text-paw-muted">Señal excelente</small></span><ChevronRight /></button>}</Card>}
    {step === 2 && <Card className="p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50"><Check className="text-paw-success" /></span><div><b>¡Encontramos tu estación!</b><p className="text-xs text-paw-muted">Lista para conectarse a Casa Federico</p></div></div></Card>}
    {step === 3 && <Card className="p-5 text-center"><Radio className="mx-auto mb-2 text-paw-orange live-dot" size={34} /><b>Esperando una presión...</b><p className="mt-1 text-xs text-paw-muted">Presiona el botón físico o simúlalo ahora.</p><Button variant="secondary" className="mt-4 w-full" onClick={next}>Simular presión</Button></Card>}
    {step === 4 && <div className="overflow-hidden rounded-card bg-paw-ink"><div className="grid h-40 place-items-center bg-gradient-to-br from-slate-700 to-slate-900"><Dog size={64} className="text-white/70" /></div><div className="flex items-center justify-between p-3 text-white"><span className="flex items-center gap-2 text-xs font-bold"><span className="live-dot h-2 w-2 rounded-full bg-red-500" />EN VIVO</span><span className="text-xs">Cámara lista</span></div></div>}
    {error && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-sm font-bold text-paw-error"><TriangleAlert size={18} />No pudimos conectar. <button className="underline" onClick={() => setError(false)}>Reintentar</button></div>}
    <div className="mt-8 space-y-2"><Button className="w-full" onClick={next}>{step === 4 ? 'Ir a Inicio' : step === 1 && !searching ? 'Buscar dispositivos' : 'Continuar'}</Button>{step === 2 && <Button variant="ghost" className="w-full" onClick={() => setError(true)}>Probar estado de error</Button>}</div>
  </div>;
}

function Header({ onNotifications }: { onNotifications: () => void }) {
  const { dog, station, events } = usePaw();
  return <div className="flex items-center justify-between px-5 pb-4 pt-5"><div><p className="text-sm text-paw-muted">Hola, Federico</p><Title size="lg">¿Cómo está {dog.name}?</Title><div className="mt-1 flex items-center gap-2 text-xs font-bold"><span className={`h-2 w-2 rounded-full ${station.status === 'online' ? 'bg-paw-success' : 'bg-paw-error'}`} />{station.status === 'online' ? 'Estación en línea' : 'Sin conexión'} · {station.battery}% · <Signal size={13} /> {station.wifi === 'good' ? 'Buena señal' : 'Señal débil'}</div></div><Button variant="icon" className="relative w-12 px-0" icon={Bell} onClick={onNotifications} aria-label="Notificaciones">{events.some(e => !e.seen) && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-paw-error" />}</Button></div>;
}
function HomeScreen({ go }: { go: (s: Screen) => void }) {
  const store = usePaw();
  const latest = store.events[0];
  const todayEvents = store.events.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString());
  const quick = (type: ContentType, text: string) => { store.notify('Enviado a la estación', `${text} para ${store.dog.name}.`); if (type === 'reward' && store.rewardCount >= 6) store.notify('Límite de premios alcanzado', 'Hoy ya entregamos el máximo recomendado.', 'warning'); };
  return <div className="screen-enter pb-24"><Header onNotifications={() => go('notifications')} />
    <div className="space-y-4 px-5">
      {store.station.status === 'offline' && <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-3 text-sm"><WifiOff className="text-paw-error" /><div className="flex-1"><b>Estación desconectada</b><p className="text-xs text-paw-muted">Te avisaremos cuando vuelva.</p></div><Button variant="ghost" className="px-2">Revisar</Button></div>}
      <Card className="overflow-hidden">
        <div className="relative grid h-48 place-items-center bg-gradient-to-br from-[#77695D] to-[#342F2B]">
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-extrabold text-white"><span className="live-dot h-2 w-2 rounded-full bg-red-500" /> EN VIVO</div>
          <div className="relative"><Dog size={88} className="text-white/80" strokeWidth={1.4} /><span className="absolute -right-5 top-0 text-3xl text-white/25">♥</span></div>
          <div className="absolute bottom-3 left-4 text-white"><b>{store.dog.name} está descansando</b><p className="text-xs text-white/75">Sala · ahora</p></div>
        </div>
        <div className="p-3"><Button className="w-full" icon={Camera} onClick={() => go('live')}>Ver en vivo</Button></div>
      </Card>
      <Card className="p-4"><div className="flex items-center gap-2"><Mic2 className="text-paw-secondary"/><Title>Ladridos hoy</Title></div><b className="mt-2 block text-2xl">{todayEvents.filter(e => e.type === "ladrido").length}</b><p className="text-xs text-paw-muted">Eventos registrados hoy</p></Card><div className="flex items-center justify-between pt-2"><Title>Acciones rápidas</Title><span className="text-xs text-paw-muted">1 toque</span></div>
      <div className="grid grid-cols-3 gap-2">
        {[['audio', Mic2, 'Enviar mi voz'], ['music', Music2, 'Poner música'], ['reward', Bone, 'Dar premio']].map(([type, Icon, label]) => <button key={String(type)} onClick={() => quick(type as ContentType, String(label))} className="min-h-28 rounded-card bg-white p-3 text-left shadow-soft transition-transform active:scale-95"><span className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-paw-orange"><Icon size={21} /></span><b className="text-xs leading-tight">{label as string}</b></button>)}
      </div>
      <div className="flex items-center justify-between pt-2"><Title>Resumen de hoy</Title><button onClick={() => go('stats')} className="text-sm font-extrabold text-paw-orange-dark">Ver semana</button></div>
      <Card className="grid grid-cols-2 gap-px overflow-hidden bg-stone-100">
        {[['Presiones', todayEvents.length, Radio], ['Premios', store.rewardCount, Bone], ['Música', '34 min', Music2], ['Hora activa', '10–11 a.m.', Clock3]].map(([label, val, Icon]) => <div key={String(label)} className="bg-white p-4"><Icon size={18} className="mb-2 text-paw-green" /><b className="text-xl">{val as ReactNode}</b><p className="text-xs text-paw-muted">{label as string}</p></div>)}
      </Card>
      <Title>Último momento</Title>
      {latest ? <Card className="p-4" onClick={() => go('activity')}><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50"><Radio className="text-paw-orange" /></span><div className="min-w-0 flex-1"><b>{store.dog.name} te llamó a las {new Date(latest.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</b><p className="mt-1 truncate text-xs text-paw-muted">{latest.triggered.map(i => i.title).join(' · ')}</p></div><ChevronRight size={18} /></div></Card> : <EmptyState title="Todo tranquilo" text="Las interacciones de Luna aparecerán aquí." />}
    </div>
  </div>;
}

function Recorder({ onClose }: { onClose: () => void }) {
  const { addContent, notify } = usePaw();
  const [recording, setRecording] = useState(false); const [seconds, setSeconds] = useState(0); const [preview, setPreview] = useState(false); const [name, setName] = useState('Nuevo mensaje para Luna');
  useEffect(() => { if (!recording) return; const id = window.setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(id); }, [recording]);
  const save = () => { addContent({ id: crypto.randomUUID(), type: 'audio', title: name, duration: Math.max(seconds, 3), createdAt: new Date().toISOString(), favorite: false }); notify('Audio guardado', 'Ya puedes asignarlo a un botón.'); onClose(); };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 sm:p-4"><div className="w-full max-w-[390px] rounded-t-[2rem] bg-white p-5 shadow-2xl screen-enter sm:rounded-[2rem]">
    <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-200" /><div className="flex items-center justify-between"><Title>Graba tu voz</Title><Button variant="ghost" icon={X} className="w-12 px-0" onClick={onClose} aria-label="Cerrar" /></div>
    <p className="mt-1 text-sm text-paw-muted">Háblale como si estuviera a tu lado.</p>
    <div className="my-7 flex h-20 items-center justify-center gap-1 rounded-2xl bg-orange-50 px-6">{Array.from({ length: 25 }, (_, i) => <span key={i} className={`wave-bar w-1 rounded-full bg-paw-orange ${recording ? '' : '[animation-play-state:paused]'}`} style={{ animationDelay: `${i * 35}ms`, height: recording ? undefined : '20%' }} />)}</div>
    <div className="text-center text-[28px] font-extrabold tabular-nums">00:{String(seconds).padStart(2, '0')}</div>
    <button onClick={() => setRecording(!recording)} className={`mx-auto my-5 grid h-20 w-20 place-items-center rounded-full border-8 border-orange-100 text-white shadow ${recording ? 'bg-paw-error' : 'bg-paw-orange'}`}>{recording ? <Pause /> : <Mic2 />}</button>
    {seconds > 0 && <><Input label="Nombre del audio" value={name} onChange={e => setName(e.target.value)} /><div className="mt-4 flex gap-2"><Button variant="secondary" className="flex-1" icon={preview ? Pause : Play} onClick={() => setPreview(!preview)}>{preview ? 'Pausar' : 'Escuchar'}</Button><Button className="flex-1" onClick={save}>Guardar</Button></div></>}
  </div></div>;
}
function ContentScreen({ go }: { go: (s: Screen) => void }) {
  const store = usePaw(); const [tab, setTab] = useState<ContentType>('audio'); const [playing, setPlaying] = useState(''); const [record, setRecord] = useState(false); const [volume, setVolume] = useState(65); const [intensity, setIntensity] = useState('media'); const [rewardQty, setRewardQty] = useState(1); const [limit, setLimit] = useState(6);
  const items = store.content.filter(i => i.type === tab);
  const addDemo = () => { const title = tab === 'video' ? 'Nuevo clip' : tab === 'aroma' ? 'Aroma suave' : 'Nuevo contenido'; store.addContent({ id: crypto.randomUUID(), type: tab, title, duration: 20, createdAt: new Date().toISOString(), favorite: false }); store.notify('Contenido añadido', `${title} está listo.`); };
  return <div className="screen-enter pb-24"><TopBar title="Contenido" action={<Button variant="ghost" icon={SlidersHorizontal} className="w-12 px-0" onClick={() => go('buttons')} aria-label="Configurar botones" />} />
    <div className="hide-scrollbar flex gap-2 overflow-x-auto px-5 pb-4">{(Object.keys(typeLabels) as ContentType[]).map(t => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{typeLabels[t]}</Chip>)}</div>
    <div className="space-y-3 px-5">
      <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-white p-5"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-paw-orange text-white">{tab === 'audio' ? <Mic2 /> : tab === 'video' ? <Film /> : tab === 'music' ? <Music2 /> : tab === 'aroma' ? <Leaf /> : <Bone />}</span><div className="flex-1"><Title>{tab === 'audio' ? 'Tu voz siempre cerca' : typeLabels[tab]}</Title><p className="text-xs text-paw-muted">{items.length} elementos disponibles</p></div></div></Card>
      {tab === 'audio' && <Button className="w-full" icon={Mic2} onClick={() => setRecord(true)}>Grabar mi voz</Button>}
      {tab === 'video' && <Button className="w-full" icon={Plus} onClick={addDemo}>Subir clip corto</Button>}
      {items.length === 0 ? <EmptyState title={`Aún no hay ${typeLabels[tab].toLowerCase()}`} text="Agrega el primero y asígnalo a un botón." /> : items.map(item => <Card key={item.id} className="p-3"><div className="flex items-center gap-2"><button onClick={() => setPlaying(playing === item.id ? '' : item.id)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-paw-orange" aria-label={playing === item.id ? 'Pausar' : 'Reproducir'}>{playing === item.id ? <Pause size={20} /> : <Play size={20} />}</button><div className="min-w-0 flex-1"><b className="block truncate">{item.title}</b><p className="text-xs text-paw-muted">{item.duration ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}` : 'Por activación'} · {item.favorite ? 'Favorito' : 'Disponible'}</p></div>{tab === 'audio' && <Button variant="ghost" icon={Edit3} className="w-10 px-0" onClick={() => { const title = window.prompt('Nuevo nombre', item.title)?.trim(); if (title) store.updateContent(item.id, { title }); }} aria-label="Renombrar" />}<Button variant="ghost" icon={Star} className={`w-10 px-0 ${item.favorite ? 'text-paw-warning' : ''}`} onClick={() => store.updateContent(item.id, { favorite: !item.favorite })} aria-label="Favorito" /><Button variant="ghost" icon={Trash2} className="w-10 px-0 text-paw-error" onClick={() => store.deleteContent(item.id)} aria-label="Eliminar" /></div></Card>)}
      {tab === 'music' && <Card className="p-4"><div className="mb-3 flex justify-between text-sm font-bold"><span>Volumen de estación</span><span>{volume}%</span></div><input aria-label="Volumen" type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-full accent-paw-orange" /></Card>}
      {tab === 'aroma' && <Card className="p-4"><Title size="md">Intensidad y duración</Title><div className="my-3 flex gap-2">{['baja', 'media', 'alta'].map(v => <Chip key={v} active={intensity === v} onClick={() => setIntensity(v)}>{v}</Chip>)}</div><Select label="Duración"><option>5 minutos</option><option>10 minutos</option><option>15 minutos</option></Select></Card>}
      {tab === 'reward' && <Card className="p-4"><div className="flex items-center justify-between"><div><b>Premios por activación</b><p className="text-xs text-paw-muted">Mantén porciones pequeñas</p></div><div className="flex items-center gap-2"><Button variant="icon" className="h-10 min-h-10 w-10 px-0" onClick={() => setRewardQty(Math.max(1, rewardQty - 1))}>−</Button><b>{rewardQty}</b><Button variant="icon" className="h-10 min-h-10 w-10 px-0" onClick={() => setRewardQty(Math.min(3, rewardQty + 1))}>+</Button></div></div><div className="mt-5 flex justify-between text-sm font-bold"><span>Máximo diario</span><span>{limit}</span></div><input type="range" aria-label="Máximo diario" min="1" max="12" value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-full accent-paw-orange" /><p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900"><b>Uso responsable:</b> los premios no reemplazan su alimentación.</p></Card>}
    </div>{record && <Recorder onClose={() => setRecord(false)} />}
  </div>;
}

function ActivityScreen({ go }: { go: (s: Screen) => void }) {
  const store = usePaw(); const [filter, setFilter] = useState('todos'); const [selected, setSelected] = useState<string | null>(null); const [favorite, setFavorite] = useState(false);
  const selectedEvent = store.events.find(e => e.id === selected);
  const events = store.events.filter(e => filter === 'todos' || (filter === 'ladrido' ? e.type === 'ladrido' : e.type !== 'ladrido' && e.triggered.some(i => i.type === filter)));
  if (selectedEvent) return <div className="screen-enter pb-24"><TopBar title="Detalle del momento" onBack={() => setSelected(null)} /><div className="space-y-4 px-5"><div className="relative grid h-56 place-items-center overflow-hidden rounded-card bg-gradient-to-br from-slate-700 to-slate-950"><Dog size={76} className="text-white/65" /><button className="absolute grid h-14 w-14 place-items-center rounded-full bg-white/90 text-paw-ink"><Play /></button><span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white">Clip · 10 s</span></div><Card className="p-4"><p className="text-xs font-bold text-paw-orange">{new Date(selectedEvent.timestamp).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', weekday: 'long' })}</p><Title className="mt-1">{store.dog.name} presionó su botón</Title><p className="mt-2 text-sm text-paw-muted">La estación respondió con:</p><div className="mt-3 space-y-2">{selectedEvent.triggered.map(i => <div key={i.id} className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3"><Check className="text-paw-success" size={18} /><span className="text-sm font-bold">{i.title}</span></div>)}</div></Card><Button className="w-full" icon={Mic2} onClick={() => go('live')}>Responder con mi voz</Button><Button variant="secondary" className="w-full" icon={Star} onClick={() => { setFavorite(!favorite); store.notify(favorite ? 'Quitado de favoritos' : 'Momento guardado', favorite ? 'Ya no aparecerá como favorito.' : 'Lo encontrarás fácilmente después.'); }}>{favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}</Button></div></div>;
  return <div className="screen-enter pb-24"><TopBar title="Actividad" action={<Button variant="ghost" icon={Gauge} className="w-12 px-0" onClick={() => go('stats')} aria-label="Estadísticas" />} /><div className="hide-scrollbar flex gap-2 overflow-x-auto px-5 pb-4">{[['todos','Todo'],['audio','Voz'],['music','Música'],['reward','Premios'],['ladrido','Ladridos']].map(([v,l]) => <Chip key={v} active={filter === v} onClick={() => setFilter(v)}>{l}</Chip>)}</div><div className="space-y-3 px-5">
    <div className="flex items-center justify-between"><Title>Hoy</Title><span className="text-xs text-paw-muted">{events.length} momentos</span></div>
    {events.length === 0 ? <EmptyState icon={Activity} title="Sin actividad" text="Prueba otro filtro o simula una presión." /> : events.map((event, i) => <button key={event.id} onClick={() => { setSelected(event.id); store.markSeen(event.id); }} className="relative flex min-h-24 w-full gap-3 rounded-card bg-white p-4 text-left shadow-soft"><span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${event.seen ? 'bg-stone-300' : 'bg-paw-orange'}`} /><div className="flex-1"><div className="flex justify-between"><b>{new Date(event.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</b>{i === 0 && <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-extrabold text-paw-orange-dark">RECIENTE</span>}</div><p className="mt-1 text-sm">{event.type === 'ladrido' ? `${store.dog.name} estuvo ladrando` : `${store.dog.name} presionó el botón ${store.buttons.find(b => b.id === event.buttonId)?.label.toLowerCase()}`}</p><p className="mt-1 truncate text-xs text-paw-muted">{event.type === 'ladrido' ? `Duración: ${event.durationSec}s · Intensidad ${event.intensity}` : `→ ${event.triggered.map(i => i.title).join(' · ')}`}</p></div><ChevronRight size={18} className="self-center" /></button>)}
  </div></div>;
}

function LiveScreen({ back }: { back: () => void }) {
  const store = usePaw(); const [talking, setTalking] = useState(false); const [volume, setVolume] = useState(70);
  const send = (label: string) => store.notify('Enviado a la estación', `${label} llegó a ${store.dog.name}.`);
  return <div className="relative min-h-[844px] bg-[#17191C] text-white screen-enter"><div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-[#384149] to-[#17191C]"><Dog size={154} strokeWidth={1.1} className="text-white/45" /></div><div className="relative z-10 flex min-h-[844px] flex-col p-5"><div className="flex items-center justify-between"><Button variant="ghost" icon={ChevronLeft} className="w-12 bg-black/20 px-0 text-white" onClick={back} aria-label="Volver" /><div className="rounded-full bg-black/35 px-3 py-2 text-xs font-extrabold"><span className="live-dot mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />EN VIVO</div><Button variant="ghost" icon={Menu} className="w-12 bg-black/20 px-0 text-white" aria-label="Menú" /></div><div className="mt-auto"><div className="mb-4 rounded-2xl bg-black/40 p-3 backdrop-blur"><div className="flex items-center gap-3"><Volume2 /><input type="range" aria-label="Volumen en vivo" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} className="flex-1 accent-paw-orange" /><b className="text-xs">{volume}%</b></div></div><div className="mb-4 grid grid-cols-4 gap-2">{[[Mic2,'Audio'],[Music2,'Música'],[Leaf,'Aroma'],[Bone,'Premio']].map(([Icon, label]) => <button key={String(label)} onClick={() => send(String(label))} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-white/15 text-xs font-bold backdrop-blur"><Icon size={22} />{label as string}</button>)}</div><button onPointerDown={() => setTalking(true)} onPointerUp={() => { setTalking(false); send('Tu voz'); }} onPointerLeave={() => setTalking(false)} className={`flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl font-extrabold transition ${talking ? 'scale-[.98] bg-paw-error' : 'bg-paw-orange'}`}><Mic2 />{talking ? 'Hablando… suelta para enviar' : 'Mantén presionado para hablar'}</button></div></div></div>;
}

function ButtonConfigScreen({ back }: { back: () => void }) {
  const store = usePaw(); const [selected, setSelected] = useState(store.buttons[0].id); const [calm, setCalm] = useState(true); const button = store.buttons.find(b => b.id === selected)!;
  const toggleAction = (item: ContentItem) => { const exists = button.actions.some(a => a.id === item.id); store.updateButton(button.id, { actions: exists ? button.actions.filter(a => a.id !== item.id) : [...button.actions, item] }); };
  return <div className="screen-enter pb-8"><TopBar title="Configurar botones" onBack={back} /><div className="space-y-4 px-5">
    <div className="flex justify-center gap-5 py-4">{store.buttons.map((b, i) => <button key={b.id} onClick={() => setSelected(b.id)} aria-label={`Botón ${i + 1}`} className={`grid h-20 w-20 place-items-center rounded-full border-8 border-white font-extrabold text-white shadow-lg transition ${selected === b.id ? 'scale-110 ring-4 ring-orange-200' : ''}`} style={{ backgroundColor: b.color }}>{i + 1}</button>)}</div>
    <Input label="Nombre del botón" value={button.label} onChange={e => store.updateButton(button.id, { label: e.target.value })} />
    <Card className="p-4"><Title size="md">Secuencia al presionar</Title><p className="mb-3 text-xs text-paw-muted">Toca para agregar o quitar. Se ejecutan en orden.</p><div className="space-y-2">{store.content.slice(0, 8).map(item => { const active = button.actions.some(a => a.id === item.id); return <button key={item.id} onClick={() => toggleAction(item)} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm font-bold ${active ? 'border-paw-orange bg-orange-50' : 'border-stone-200'}`}><span className={`grid h-6 w-6 place-items-center rounded-full ${active ? 'bg-paw-orange text-white' : 'bg-stone-100'}`}>{active ? <Check size={14} /> : <Plus size={14} />}</span><span className="flex-1">{item.title}</span><small className="text-paw-muted">{typeLabels[item.type]}</small></button>})}</div></Card>
    <Card className="space-y-4 p-4"><Input label="Espera entre activaciones (seg)" type="number" value={button.cooldownSec} onChange={e => store.updateButton(button.id, { cooldownSec: Number(e.target.value) })} /><div className="grid grid-cols-2 gap-3"><Input label="Activo desde" type="time" value={button.activeHours.from} onChange={e => store.updateButton(button.id, { activeHours: { ...button.activeHours, from: e.target.value } })} /><Input label="Hasta" type="time" value={button.activeHours.to} onChange={e => store.updateButton(button.id, { activeHours: { ...button.activeHours, to: e.target.value } })} /></div><Input label="Límite diario de premios" type="number" value={button.dailyRewardLimit} onChange={e => store.updateButton(button.id, { dailyRewardLimit: Number(e.target.value) })} /><div className="flex items-center justify-between"><div><b className="text-sm">Modo Calma</b><p className="text-xs text-paw-muted">Pausa premios si hay muchas presiones</p></div><Toggle active={calm} onChange={() => setCalm(!calm)} label="Modo calma" /></div></Card>
    <Card className="overflow-hidden bg-emerald-50 p-4"><div className="flex items-center gap-4"><Dog size={62} className="text-paw-green" /><div><b>Vista previa para {store.dog.name}</b><p className="text-xs text-paw-muted">{button.actions.map(a => a.title).join(' → ') || 'Sin acciones asignadas'}</p></div></div></Card>
    <Button className="w-full" onClick={() => store.notify('Configuración guardada', 'El botón ya está listo para Luna.')}>Guardar configuración</Button>
  </div></div>;
}

const chartData = [{ d: 'Lun', n: 3, calm: 7 }, { d: 'Mar', n: 5, calm: 8 }, { d: 'Mié', n: 2, calm: 8 }, { d: 'Jue', n: 4, calm: 7 }, { d: 'Vie', n: 6, calm: 6 }, { d: 'Sáb', n: 1, calm: 9 }, { d: 'Dom', n: 2, calm: 9 }];
function StatsScreen({ back }: { back: () => void }) {
  return <div className="screen-enter pb-8"><TopBar title="Esta semana" onBack={back} /><div className="space-y-4 px-5"><Card className="bg-paw-orange p-5 text-paw-ink"><p className="text-sm font-bold text-white/80">Resumen semanal</p><div className="mt-1 text-2xl font-extrabold text-white">Luna te llamó 23 veces</div><p className="mt-2 text-sm text-white/85">Pasó 18% más tiempo tranquila que la semana anterior.</p></Card><Card className="p-4"><Title>Interacciones por día</Title><div className="mt-4 h-210px h-[210px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee7df" /><XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={11} /><YAxis hide /><Tooltip /><Bar dataKey="n" fill="var(--paw-primary)" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer></div></Card><Card className="p-4"><Title>Tendencia de bienestar</Title><p className="text-xs text-paw-muted">Índice de calma estimado por actividad</p><div className="mt-4 h-[190px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee7df" /><XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={11} /><YAxis domain={[0, 10]} hide /><Tooltip /><Line type="monotone" dataKey="calm" stroke="var(--paw-accent)" strokeWidth={3} dot={{ fill: 'var(--paw-accent)', r: 4 }} /></LineChart></ResponsiveContainer></div></Card><div className="grid grid-cols-2 gap-3"><Card className="p-4"><Clock3 className="mb-2 text-paw-orange" /><b>10–11 a.m.</b><p className="text-xs text-paw-muted">Hora pico</p></Card><Card className="p-4"><Heart className="mb-2 text-paw-green" /><b>Buen chico</b><p className="text-xs text-paw-muted">Contenido favorito</p></Card></div></div></div>;
}

function NotificationsScreen({ back }: { back: () => void }) {
  const store = usePaw(); const [types, setTypes] = useState({ press: true, offline: true, summary: false, camera: true }); const [quiet, setQuiet] = useState(true); const [group, setGroup] = useState(true);
  return <div className="screen-enter pb-8"><TopBar title="Notificaciones" onBack={back} /><div className="space-y-4 px-5"><div className="rounded-[2rem] bg-[#22252A] p-4 text-white shadow-xl"><div className="mb-4 flex justify-between text-xs"><b>10:42</b><span>●●● 5G</span></div><div className="rounded-2xl bg-white/15 p-3 backdrop-blur"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-paw-orange font-extrabold">P</span><div className="flex-1"><div className="flex justify-between text-xs"><b>PawStation</b><span className="text-white/60">ahora</span></div><p className="mt-1 text-sm font-bold">🐾 {store.dog.name} presionó el botón</p><p className="text-xs text-white/70">Reprodujimos tu voz “Buen chico”</p></div></div></div></div><Card className="divide-y divide-stone-100 px-4"><Title className="py-4">Qué quieres recibir</Title>{[['press','Cuando Luna me llama'],['offline','Estación sin conexión'],['camera','Movimiento inusual'],['summary','Resumen diario']].map(([key,label]) => <div key={key} className="flex min-h-16 items-center justify-between"><span className="text-sm font-bold">{label}</span><Toggle active={types[key as keyof typeof types]} onChange={() => setTypes({ ...types, [key]: !types[key as keyof typeof types] })} label={label} /></div>)}</Card><Card className="divide-y divide-stone-100 px-4">{[['Horas de silencio','10:00 p.m. – 7:00 a.m.',quiet,setQuiet],['Agrupar notificaciones','Reduce avisos repetidos',group,setGroup]].map(([title,sub,val,setter]) => <div key={String(title)} className="flex min-h-20 items-center justify-between"><div><b className="text-sm">{title as string}</b><p className="text-xs text-paw-muted">{sub as string}</p></div><Toggle active={val as boolean} onChange={() => (setter as (v:boolean)=>void)(!(val as boolean))} label={title as string} /></div>)}</Card></div></div>;
}


function PersonalizeCard() {
 const [prefs,setPrefs]=useState(()=>{try{return JSON.parse(localStorage.getItem('pawstation_ui')||'{}')}catch{return {}}});
 const update=(patch:Record<string,unknown>)=>{const next={...prefs,...patch};setPrefs(next);try{localStorage.setItem('pawstation_ui',JSON.stringify({...next,version:1}))}catch{};aplicarTema(String(next.primary||'#ECB948'),String(next.theme||'Miel'));document.documentElement.style.setProperty('--paw-background',next.theme==='Noche cálida'?'#352D24':'#FFF0C9');document.documentElement.style.setProperty('--paw-surface',next.theme==='Noche cálida'?'#493D30':'#FFF8E3');document.documentElement.style.setProperty('--paw-text',next.theme==='Noche cálida'?'#FFF0C9':'#3B2A0A');document.documentElement.style.fontSize=next.largeText?'18px':'16px';};
 const presets=[['Miel','#ECB948'],['Atardecer','#D9642E'],['Menta','#2F8F83'],['Noche cálida','#B98B55']];
 return <Card className="p-4"><div className="mb-3 flex items-center gap-2"><SlidersHorizontal className="text-paw-orange"/><Title>Personalizar app</Title></div><p className="mb-3 text-xs text-paw-muted">Tema, accesibilidad y visibilidad de la pantalla principal.</p><div className="grid grid-cols-2 gap-2">{presets.map(([name,color])=><button key={name} onClick={()=>update({theme:name,primary:color})} className={`min-h-12 rounded-xl border p-2 text-xs font-extrabold ${prefs.theme===name?'border-paw-orange bg-paw-soft':'border-paw-border'}`}><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{background:color}}/>{name}</button>)}</div><label className="mt-3 block text-xs font-bold">Color principal</label><div className="mt-1 flex gap-2"><input aria-label="Color principal" type="color" value={prefs.primary||'#ECB948'} onChange={e=>update({primary:e.target.value,theme:'Personalizado'})} className="h-11 w-14 rounded-lg"/><input aria-label="Código hexadecimal" value={prefs.primary||'#ECB948'} onChange={e=>/^#[0-9a-fA-F]{6}$/.test(e.target.value)&&update({primary:e.target.value,theme:'Personalizado'})} className="h-11 flex-1 rounded-xl border border-paw-border bg-paw-surface px-3 text-sm"/></div><div className="mt-3 flex gap-2"><button onClick={()=>update({buttonStyle:'rounded'})} className="min-h-10 flex-1 rounded-xl border border-paw-border text-xs">Redondeados</button><button onClick={()=>update({buttonStyle:'square'})} className="min-h-10 flex-1 border border-paw-border text-xs">Cuadrados</button></div><label className="mt-3 flex min-h-12 items-center justify-between text-sm">Texto grande<input type="checkbox" checked={!!prefs.largeText} onChange={e=>{update({largeText:e.target.checked});document.documentElement.style.fontSize=e.target.checked?'18px':'16px'}}/></label><p className="mt-2 rounded-xl bg-paw-soft p-3 text-sm">Vista previa · Luna está en casa <button className="ml-2 rounded-xl px-3 py-2 font-bold" style={{background:prefs.primary||'#ECB948',color:generarPaleta(prefs.primary||'#ECB948').onPrimary}}>Ver</button></p><button onClick={()=>{setPrefs({});try{localStorage.removeItem('pawstation_ui')}catch{};aplicarTema('#ECB948','Miel');document.documentElement.style.fontSize='16px'}} className="mt-2 min-h-10 text-xs font-bold text-paw-secondary">Restablecer valores originales</button></Card>;
}
function BarkSettings() {
 const store=usePaw(); const c=store.barkConfig;
 const patch=(p:Partial<typeof c>)=>store.updateBarkConfig(p);
 return <Card className="p-4"><div className="flex items-center justify-between"><div><Title>Notificaciones de ladridos</Title><p className="text-xs text-paw-muted">Detección simulada por micrófono</p></div><Toggle active={c.enabled} onChange={()=>patch({enabled:!c.enabled})} label="Notificaciones de ladridos"/></div><div className="mt-3 space-y-3 border-t border-paw-border pt-3"><label className="block text-xs font-bold">Avisar tras<select value={c.thresholdSec} onChange={e=>patch({thresholdSec:Number(e.target.value)})} className="mt-1 h-11 w-full rounded-xl border border-paw-border bg-paw-surface px-3"><option value={30}>30 segundos</option><option value={60}>1 minuto</option><option value={120}>2 minutos</option><option value={300}>5 minutos</option></select></label><label className="block text-xs font-bold">Sensibilidad<select value={c.sensitivity} onChange={e=>patch({sensitivity:e.target.value as typeof c.sensitivity})} className="mt-1 h-11 w-full rounded-xl border border-paw-border bg-paw-surface px-3"><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></label><label className="block text-xs font-bold">Pausa entre avisos<select value={c.cooldownMin} onChange={e=>patch({cooldownMin:Number(e.target.value)})} className="mt-1 h-11 w-full rounded-xl border border-paw-border bg-paw-surface px-3"><option value={10}>10 minutos</option><option value={20}>20 minutos</option><option value={30}>30 minutos</option></select></label>{[['quietHours','Horas de silencio'],['push','Notificación push'],['sound','Sonido'],['vibration','Vibración'],['autoResponse','Respuesta automática']].map(([key,label])=><div key={key} className="flex min-h-11 items-center justify-between text-sm"><span>{label}</span><Toggle active={!!c[key as keyof typeof c]} onChange={()=>patch({[key]:!c[key as keyof typeof c]} as Partial<typeof c>)} label={label}/></div>)}<label className="block text-xs font-bold">Límite diario de respuestas automáticas<input type="number" min={0} max={10} value={c.dailyLimit} onChange={e=>patch({dailyLimit:Math.max(0,Number(e.target.value))})} className="mt-1 h-11 w-full rounded-xl border border-paw-border bg-paw-surface px-3"/></label></div></Card>;
}

function SettingsScreen({ go }: { go: (s: Screen) => void }) {
  const store = usePaw(); const [camera, setCamera] = useState(true); const [eventsOnly, setEventsOnly] = useState(true);
  const sections = [
    { title: 'Tu PawStation', rows: [[Radio, 'Dispositivo', `${store.station.battery}% · Firmware 2.4.1`, () => store.notify('Todo al día', 'Tu estación funciona correctamente.')], [SlidersHorizontal, 'Configurar botones', '3 botones activos', () => go('buttons')], [Bell, 'Notificaciones', 'Alertas por excepción', () => go('notifications')]] },
    { title: 'Personas y ayuda', rows: [[CircleUserRound, 'Contactos de confianza', 'Ana · vecina', () => store.notify('Contactos', 'Ana puede recibir alertas importantes.')], [HelpCircle, 'Ayuda', 'Guías y soporte', () => store.notify('Estamos para ayudarte', 'La demo de soporte está lista.')]] },
  ] as const;
  return <div className="screen-enter pb-24"><TopBar title="Ajustes" /><div className="space-y-5 px-5"><PersonalizeCard /><BarkSettings /><Card className="flex items-center gap-4 p-4"><span className="grid h-16 w-16 place-items-center rounded-full bg-orange-100"><Dog className="text-paw-orange" /></span><div className="flex-1"><Title>{store.dog.name}</Title><p className="text-sm text-paw-muted">{store.dog.breed} · {store.dog.age} años</p></div><Edit3 size={18} /></Card><Card className="p-4"><div className="mb-4 flex items-center gap-3"><ShieldCheck className="text-paw-green" /><div><b>Privacidad de cámara</b><p className="text-xs text-paw-muted">Cifrado de extremo a extremo</p></div></div><div className="flex min-h-14 items-center justify-between border-t border-stone-100"><span className="text-sm font-bold">Cámara activa</span><Toggle active={camera} onChange={() => setCamera(!camera)} label="Cámara activa" /></div><div className="flex min-h-14 items-center justify-between border-t border-stone-100"><span className="text-sm font-bold">Solo graba eventos</span><Toggle active={eventsOnly} onChange={() => setEventsOnly(!eventsOnly)} label="Solo graba eventos" /></div></Card>{sections.map(section => <div key={section.title}><p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-paw-muted">{section.title}</p><Card className="divide-y divide-stone-100 px-2">{section.rows.map(([Icon,label,sub,click]) => <button key={label} onClick={click} className="flex min-h-18 w-full items-center gap-3 px-2 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-50"><Icon size={19} /></span><span className="flex-1"><b className="block text-sm">{label}</b><small className="text-paw-muted">{sub}</small></span><ChevronRight size={17} /></button>)}</Card></div>)}<Button variant="danger" className="w-full" icon={Power} onClick={() => { store.setStation({ status: 'offline' }); store.notify('Estación desvinculada', 'Puedes volver a vincularla cuando quieras.', 'warning'); }}>Desvincular estación</Button></div></div>;
}

function Simulator({ onClose }: { onClose: () => void }) {
  const store = usePaw();
  const action = (label: string, fn: () => void) => { fn(); if (!['Simular botón 1','Simular botón 2','Simular botón 3'].includes(label)) store.notify(label, 'La simulación actualizó el estado de la demo.', label.includes('desconectada') || label.includes('agotada') ? 'warning' : 'success'); };
  const options: [string, IconType, () => void][] = [
    ['Simular ladridos persistentes', Mic2, () => store.simulateBark(120)], ['Simular ladridos cortos', Mic2, () => store.simulateBark(20)], ['Simular botón 1', Radio, () => store.simulatePress('b1')], ['Simular botón 2', Radio, () => store.simulatePress('b2')], ['Simular botón 3', Radio, () => store.simulatePress('b3')],
    ['Perro frente a la cámara', Camera, () => store.notify('Luna está frente a la cámara', 'Parece tranquila y está mirando la estación.')],
    ['Batería baja', TriangleAlert, () => store.setStation({ battery: 12 })], ['Estación desconectada', WifiOff, () => store.setStation({ status: 'offline', wifi: 'none' })],
    ['Wi-Fi débil', Signal, () => store.setStation({ wifi: 'weak' })], ['Recompensa agotada', Bone, () => store.notify('Recompensa agotada', 'Recarga el depósito cuando llegues a casa.', 'warning')],
  ];
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"><div className="w-full max-w-[390px] rounded-t-[2rem] bg-white p-5 shadow-2xl screen-enter"><div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-200" /><div className="mb-4 flex items-center justify-between"><div><Title>Panel simulador</Title><p className="text-xs text-paw-muted">Prueba sin hardware físico</p></div><Button variant="ghost" icon={X} className="w-12 px-0" onClick={onClose} aria-label="Cerrar" /></div><div className="grid grid-cols-2 gap-2">{options.map(([label,Icon,fn]) => <button key={label} onClick={() => action(label, fn)} className="flex min-h-20 items-center gap-3 rounded-2xl border border-stone-200 p-3 text-left text-xs font-bold hover:bg-stone-50"><Icon size={20} className="shrink-0 text-paw-orange" />{label}</button>)}</div><Button variant="danger" className="mt-3 w-full" icon={RotateCcw} onClick={() => { store.reset(); onClose(); }}>Reiniciar demo</Button></div></div>;
}

function ToastBanner() {
  const { toast, clearToast, notify, dog } = usePaw();
  if (!toast) return null;
  const bark = toast.title.includes('lleva') && toast.title.includes('ladrando');
  return <div role="status" className="fixed left-1/2 top-4 z-[70] w-[calc(100%-2rem)] max-w-[358px] -translate-x-1/2 rounded-2xl bg-paw-ink p-4 text-left text-white shadow-2xl screen-enter"><div className="flex items-start gap-3"><span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${toast.tone === 'error' ? 'bg-paw-error' : toast.tone === 'warning' ? 'bg-paw-warning' : 'bg-paw-success'}`} /><span className="flex-1"><b className="block text-sm">{toast.title}</b><small className="mt-1 block text-white/80">{toast.message}</small></span><button aria-label="Cerrar" onClick={clearToast}><X size={16} /></button></div>{bark && <div className="mt-3 grid grid-cols-3 gap-2"><button className="min-h-10 rounded-xl bg-paw-primary px-2 text-xs font-bold text-paw-ink" onClick={()=>notify('Hablándole a Luna',`Tu voz se está enviando a ${dog.name}.`)}>Hablarle</button><button className="min-h-10 rounded-xl bg-paw-primary px-2 text-xs font-bold text-paw-ink" onClick={()=>notify('Música calmante','Reproduciendo música para Luna.')}>Poner música</button><button className="min-h-10 rounded-xl bg-paw-primary px-2 text-xs font-bold text-paw-ink" onClick={()=>notify('Vista en vivo','La cámara está lista para abrirse desde Inicio.')}>Ver en vivo</button></div>}</div>;
}
function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const tabs: [Screen, IconType, string][] = [['home', Home, 'Inicio'], ['content', Library, 'Contenido'], ['activity', Activity, 'Actividad'], ['settings', Settings, 'Ajustes']];
  return <div className="absolute bottom-0 left-0 right-0 z-30 grid h-20 grid-cols-4 border-t border-stone-200 bg-white/95 px-2 pb-2 backdrop-blur">{tabs.map(([value,Icon,label]) => <Button key={value} variant="nav" onClick={() => go(value)} className={`h-full flex-col gap-1 rounded-none px-1 text-[11px] ${screen === value ? 'text-paw-orange' : ''}`}><Icon size={21} fill={screen === value ? 'currentColor' : 'none'} />{label}</Button>)}</div>;
}

function Shell() {
  const [ui, setUi] = useState(() => { try { return JSON.parse(localStorage.getItem('pawstation_ui') || '{}'); } catch { return {}; } });
  const [screen, setScreen] = useState<Screen>('home'); const [simulator, setSimulator] = useState(false);
  const main = ['home','content','activity','settings'].includes(screen);
  useEffect(() => { aplicarTema(ui.primary || '#ECB948', ui.theme || 'Miel'); document.documentElement.style.setProperty('--paw-background', ui.theme === 'Noche cálida' ? '#352D24' : '#FFF0C9'); document.documentElement.style.setProperty('--paw-surface', ui.theme === 'Noche cálida' ? '#493D30' : '#FFF8E3'); document.documentElement.style.setProperty('--paw-text', ui.theme === 'Noche cálida' ? '#FFF0C9' : '#3B2A0A'); document.documentElement.style.fontSize = ui.largeText ? '18px' : '16px'; try { localStorage.setItem('pawstation_ui', JSON.stringify({ ...ui, version: 1 })); } catch {} }, [ui]);
  return <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-paw-cream shadow-2xl sm:my-4 sm:h-[844px] sm:min-h-0 sm:rounded-[2.4rem]"><div className="h-full overflow-y-auto hide-scrollbar">
    {screen === 'home' && <HomeScreen go={setScreen} />}{screen === 'content' && <ContentScreen go={setScreen} />}{screen === 'activity' && <ActivityScreen go={setScreen} />}{screen === 'settings' && <SettingsScreen go={setScreen} />}{screen === 'live' && <LiveScreen back={() => setScreen('home')} />}{screen === 'buttons' && <ButtonConfigScreen back={() => setScreen('content')} />}{screen === 'stats' && <StatsScreen back={() => setScreen('home')} />}{screen === 'notifications' && <NotificationsScreen back={() => setScreen('home')} />}
  </div>{main && <BottomNav screen={screen} go={setScreen} />}{main && <button onClick={() => setSimulator(true)} aria-label="Abrir simulador" className="absolute bottom-24 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-paw-ink text-paw-warning shadow-xl transition-transform hover:scale-105"><Zap size={20} fill="currentColor" /></button>}{simulator && <Simulator onClose={() => setSimulator(false)} />}<ToastBanner /></div>;
}

export default function App() {
  const store = usePaw();
  const [phase, setPhase] = useState<'onboarding' | 'profile' | 'pair' | 'app'>(store.onboarded ? 'app' : 'onboarding');
  return <main className="min-h-screen sm:py-2">{phase === 'onboarding' && <div className="mx-auto max-w-[390px] overflow-hidden bg-paw-cream sm:rounded-[2.4rem] sm:shadow-2xl"><Onboarding onDone={() => setPhase('profile')} /></div>}{phase === 'profile' && <div className="mx-auto max-w-[390px] overflow-hidden bg-paw-cream sm:rounded-[2.4rem] sm:shadow-2xl"><ProfileSetup onNext={() => setPhase('pair')} /></div>}{phase === 'pair' && <div className="mx-auto max-w-[390px] overflow-hidden bg-paw-cream sm:rounded-[2.4rem] sm:shadow-2xl"><Pairing onDone={() => setPhase('app')} /></div>}{phase === 'app' && <Shell />}</main>;
}
