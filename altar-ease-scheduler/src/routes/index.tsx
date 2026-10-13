import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState, Fragment } from 'react';
import { CalendarDays, Settings2, ChartNoAxesColumnIncreasing, Users, Church, ChevronLeft, ChevronRight, RotateCw, Copy, Check, Leaf, ShieldCheck, Clock3, Coffee, Plus, Trash2, SlidersHorizontal, CalendarCheck2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import chapel from '@/assets/chapel.jpg';
import { defaults, generateSchedule, liturgy, suggestedEvents, scheduleText, MONTHS, WEEKDAYS, type Settings, type Person, type ScheduleDay, type Event } from '@/lib/schedule';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Servir · Escala dos coroinhas' },
    { name: 'description', content: 'Organize a escala mensal dos coroinhas, respeite disponibilidades e compartilhe com a pastoral pelo WhatsApp.' },
    { property: 'og:title', content: 'Servir · Escala dos coroinhas' },
    { property: 'og:description', content: 'Uma escala organizada para servir juntos. Celebrações, rodízio e resumo por coroinha.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});
const STORAGE = 'servir-escala-v1';
const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('');
const formatTime = (time: string) => time.endsWith(':00') ? `${Number(time.split(':')[0])}h` : time.replace(':', 'h');

function Index() {
  const [tab, setTab] = useState('Escala');
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(10);
  const [config, setConfig] = useState<Settings>(() => defaults(2026, 10));
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [personId, setPersonId] = useState('');
  const [toast, setToast] = useState('');
  const [fallback, setFallback] = useState('');
  const [expandedPerson, setExpandedPerson] = useState('');
  const [newName, setNewName] = useState('');
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.version === 1 && Array.isArray(saved.config?.people) && Array.isArray(saved.config?.services) && Array.isArray(saved.config?.events)) { setYear(saved.year); setMonth(saved.month); setConfig(saved.config); }
      }
    } catch { setStorageError(true); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE, JSON.stringify({ version: 1, year, month, config })); setStorageError(false); } catch { setStorageError(true); }
  }, [config, year, month, ready]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 3500); return () => clearTimeout(id); }, [toast]);
  const result = useMemo(() => generateSchedule(year, month, config), [year, month, config]);
  const visible = result.days.filter(d => (filter !== 'Domingos' || d.weekday === 0) && (filter !== 'Durante a semana' || d.weekday !== 0) && (!personId || d.off.some(p => p.id === personId) || d.masses.some(m => m.people.some(p => p.id === personId))));
  const seasons = [...new Set(Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => liturgy(year, month, i + 1).season))];
  const totalMasses = result.days.reduce((sum, d) => sum + d.masses.length, 0);
  const sundayCount = result.days.filter(d => d.weekday === 0).length;
  const update = (patch: Partial<Settings>) => setConfig(c => ({ ...c, ...patch }));
  const updatePerson = (id: string, patch: Partial<Person>) => setConfig(c => ({ ...c, people: c.people.map(p => p.id === id ? { ...p, ...patch } : p) }));
  const changeMonth = (amount: number) => {
    const date = new Date(year, month + amount, 1); const y = date.getFullYear(), m = date.getMonth();
    setYear(y); setMonth(m); update({ events: suggestedEvents(y, m), people: config.people.map(p => ({ ...p, dates: [] })) });
    setToast('Mês alterado. Indisponibilidades por data foram limpas.');
  };
  const copy = async (id = personId) => {
    const text = scheduleText(year, month, result.days, id);
    try { await navigator.clipboard.writeText(text); setToast(id ? 'Escala individual copiada para o WhatsApp!' : 'Escala copiada para o WhatsApp!'); } catch { setFallback(text); }
  };
  const addPerson = () => {
    if (!newName.trim()) return;
    update({ people: [...config.people, { id: crypto.randomUUID(), name: newName.trim(), blocked: [], dates: [] }] }); setNewName('');
  };
  const editEvent = (index: number, patch: Partial<Event>) => update({ events: config.events.map((e, i) => i === index ? { ...e, ...patch } : e) });
  return <>
    <header className="app-header"><div className="header-inner">
      <div className="brand"><div className="brand-symbol"><Church size={25} strokeWidth={1.5} /></div><div className="min-w-0"><div className="brand-name">servir<span className="text-primary">.</span></div><div className="brand-sub">PASTORAL DOS COROINHAS</div></div></div>
      <div className="storage-note"><ShieldCheck size={15} /><span>{storageError ? 'Não foi possível salvar' : 'Salvo neste aparelho'}</span></div>
    </div></header>
    <main className="workspace">
      <section className="welcome"><img src={chapel} alt="Altar de uma igreja com uma cruz e paramentos verdes" width={1536} height={512} /><div className="welcome-copy"><p>Juntos, a serviço do altar</p><h1>Um mês de fé e dedicação.</h1><span>Cada celebração, um encontro. Cada coroinha, uma presença.</span></div></section>
      <nav className="tab-row" aria-label="Abas da escala">{[{ name: 'Configurar', icon: Settings2 }, { name: 'Escala', icon: CalendarDays }, { name: 'Resumo', icon: ChartNoAxesColumnIncreasing }].map(({ name, icon: Icon }) => <Button key={name} variant="ghost" className="tab-button" data-active={tab === name} aria-current={tab === name ? 'page' : undefined} onClick={() => setTab(name)}><Icon size={16} />{name}{name === 'Escala' && <span className="tab-count">{totalMasses}</span>}</Button>)}</nav>
      <section className="section-heading"><div className="min-w-0"><div className="month-picker"><h2>{MONTHS[month]} <span className="year">{year}</span></h2><div className="month-arrows"><Button variant="ghost" size="icon" aria-label="Mês anterior" title="Mês anterior" onClick={() => changeMonth(-1)}><ChevronLeft /></Button><Button variant="ghost" size="icon" aria-label="Próximo mês" title="Próximo mês" onClick={() => changeMonth(1)}><ChevronRight /></Button></div></div><div className="heading-caption">{tab === 'Escala' ? 'A escala da nossa comunidade' : tab === 'Configurar' ? 'Coroinhas, celebrações e disponibilidades' : 'A participação de cada coroinha neste mês'}</div></div><div className="actions"><Button variant="outline" onClick={() => { update({ rotation: config.rotation + 1 }); setToast('Rodízio atualizado!'); }}><RotateCw />Girar rodízio</Button><Button onClick={() => copy()}><Copy />Copiar para WhatsApp</Button></div></section>
      {storageError && <div className="warning-box">Seu navegador não permitiu salvar os dados. Mantenha esta página aberta para não perder as alterações.</div>}
      {!config.people.length && <div className="warning-box">Adicione pelo menos um coroinha em Configurar para montar a escala.</div>}
      {tab !== 'Configurar' && <div className="stats-grid">
        <Stat label="Coroinhas" value={config.people.length} description="a serviço da comunidade" icon={Users} />
        <Stat label="Celebrações" value={totalMasses} description="ao longo do mês" icon={Church} />
        <Stat label="Domingos" value={sundayCount} description={`${Math.max(0, sundayCount - 1)} domingos por coroinha`} icon={CalendarDays} />
        <Stat label="Datas especiais" value={config.events.filter(e => e.enabled).length} description="solenidades e feriados" icon={CalendarCheck2} />
      </div>}
      {tab !== 'Configurar' && <div className="liturgy-banner"><div className="liturgy-title"><Leaf size={16} /><span><strong>{seasons.join(' → ')}</strong><span className="hidden sm:inline"> · {(MONTHS[month] ?? "").toLowerCase()} de {year}</span></span></div><span className="liturgy-note">Confira as datas com a sua paróquia.</span></div>}
      {tab !== 'Configurar' && result.warnings.length > 0 && <details className="warning-box"><summary><span className="inline-flex items-center gap-2"><AlertTriangle size={14} />{result.warnings.length} {result.warnings.length === 1 ? 'observação para conferir' : 'observações para conferir'}</span></summary><ul>{result.warnings.map(w => <li key={w}>{w}</li>)}</ul></details>}
      {tab === 'Escala' && <div className="view-enter"><div className="filters"><div className="filter-group">{['Todos', 'Domingos', 'Durante a semana'].map(f => <Button key={f} variant="ghost" className="filter-button" data-active={filter === f} onClick={() => setFilter(f)}>{f}</Button>)}</div><select aria-label="Filtrar por coroinha" className="person-select" value={personId} onChange={e => setPersonId(e.target.value)}><option value="">Todos os coroinhas</option>{config.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        {visible.map((d, index) => <Fragment key={d.day}>{(index === 0 || visible[index - 1]?.week !== d.week) && <div className="week-label">Semana {new Set(result.days.slice(0, result.days.indexOf(d) + 1).map(day => day.week)).size}<span>·</span>{String(d.day).padStart(2, '0')} a {String(Math.max(...result.days.filter(x => x.week === d.week).map(x => x.day))).padStart(2, '0')} de {(MONTHS[month] ?? "").toLowerCase()}</div>}<DayCard day={d} personId={personId} /></Fragment>)}
        {!visible.length && <div className="empty-state">Nenhuma celebração para esta seleção.</div>}
      </div>}
      {tab === 'Configurar' && <div className="config-grid view-enter"><div>
        <section className="form-section"><h3>Os nossos coroinhas <span className="text-muted-foreground text-sm font-normal">({config.people.length})</span></h3><p className="section-subtitle">Nomes de exemplo. Substitua pelos coroinhas da sua comunidade.</p>
          {config.people.map(p => <Fragment key={p.id}><div className="person-row"><div className="person-info"><span className="avatar">{initials(p.name)}</span><div className="min-w-0 w-full"><input className="field" aria-label={`Nome de ${p.name}`} value={p.name} onChange={e => updatePerson(p.id, { name: e.target.value })} />{(p.blocked.length > 0 || p.dates.length > 0) && <span className="text-[10px] text-warning">{p.blocked.length + p.dates.length} restrições</span>}</div></div><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Disponibilidade de ${p.name}`} title="Disponibilidade" onClick={() => setExpandedPerson(expandedPerson === p.id ? '' : p.id)}><SlidersHorizontal /></Button><Button variant="ghost" size="icon" aria-label={`Excluir ${p.name}`} title="Excluir coroinha" onClick={() => { update({ people: config.people.filter(x => x.id !== p.id) }); if (personId === p.id) setPersonId(''); }}><Trash2 size={14} /></Button></div></div>
            {expandedPerson === p.id && <div className="restriction-panel"><strong>Horários em que não pode servir</strong>{config.services.map(s => <label className="check-label" key={s.id}><input type="checkbox" checked={p.blocked.includes(s.id)} onChange={e => updatePerson(p.id, { blocked: e.target.checked ? [...p.blocked, s.id] : p.blocked.filter(x => x !== s.id) })} />{WEEKDAYS[s.weekday]} · {formatTime(s.time)}</label>)}<label className="form-field mt-3">Horários extras bloqueados<input className="field" placeholder="Ex.: 07:00, 19:00" value={p.blocked.filter(x => x.startsWith('time:')).map(x => x.slice(5)).join(', ')} onChange={e => updatePerson(p.id, { blocked: [...p.blocked.filter(x => !x.startsWith('time:')), ...e.target.value.split(',').map(x => x.trim()).filter(Boolean).map(x => `time:${x}`)] })} /></label><strong className="block mt-4">Dias em que não pode servir · {MONTHS[month]}</strong><div className="date-picker">{Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1).map(day => <Button key={day} variant="outline" data-blocked={p.dates.includes(day)} aria-label={`${p.dates.includes(day) ? 'Liberar' : 'Bloquear'} dia ${day} para ${p.name}`} aria-pressed={p.dates.includes(day)} onClick={() => updatePerson(p.id, { dates: p.dates.includes(day) ? p.dates.filter(x => x !== day) : [...p.dates, day] })}>{day}</Button>)}</div></div>}
          </Fragment>)}
          <form className="flex gap-2 mt-4" onSubmit={e => { e.preventDefault(); addPerson(); }}><input className="field" aria-label="Nome do novo coroinha" placeholder="Nome do coroinha" value={newName} onChange={e => setNewName(e.target.value)} /><Button type="submit" disabled={!newName.trim()}><Plus />Adicionar</Button></form>
        </section>
        <section className="form-section"><h3>Regras da distribuição</h3><div className="form-field mt-4"><label htmlFor="capacity">Coroinhas por celebração durante a semana</label><select id="capacity" className="field" value={config.capacity} onChange={e => update({ capacity: Number(e.target.value) })}><option value={0}>Automático · todos servem na semana</option>{Array.from({ length: Math.max(config.people.length, 12) }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} por celebração</option>)}</select></div><label className="check-label mt-4"><input type="checkbox" checked={config.allSolemnity} onChange={e => update({ allSolemnity: e.target.checked })} />Em solenidades de domingo, todos em todas as missas</label><p className="text-xs text-muted-foreground leading-relaxed">Domingos: uma folga por coroinha. Feriados na semana: todos servem. Solenidades em dias úteis: vai quem puder.</p></section>
      </div><div>
        <section className="form-section"><h3>Celebrações da semana</h3><p className="section-subtitle">Dias e horários habituais da sua paróquia.</p>{config.services.map(s => <div className="service-row" key={s.id}><select className="field" aria-label={`Dia da celebração ${s.id}`} value={s.weekday} onChange={e => update({ services: config.services.map(x => x.id === s.id ? { ...x, weekday: Number(e.target.value) } : x) })}>{WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}</select><input type="time" className="field" aria-label={`Horário da celebração ${s.id}`} value={s.time} onChange={e => update({ services: config.services.map(x => x.id === s.id ? { ...x, time: e.target.value } : x) })} /><Button variant="ghost" size="icon" aria-label={`Excluir celebração ${WEEKDAYS[s.weekday]} ${s.time}`} title="Excluir celebração" onClick={() => update({ services: config.services.filter(x => x.id !== s.id) })}><Trash2 /></Button></div>)}<Button variant="outline" className="mt-3" onClick={() => update({ services: [...config.services, { id: crypto.randomUUID(), weekday: 0, time: '19:00' }] })}><Plus />Adicionar celebração</Button></section>
        <section className="form-section"><h3>Datas especiais</h3><p className="section-subtitle">Sugestões para {(MONTHS[month] ?? "").toLowerCase()}. Confira o calendário da paróquia, inclusive transferências e feriados locais.</p>{config.events.map((event, index) => <div className="event-row" key={index}><div className="event-main"><input type="checkbox" aria-label={`Ativar ${event.name}`} checked={event.enabled} onChange={e => editEvent(index, { enabled: e.target.checked })} /><div><div className="event-title"><strong>{String(event.day).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}</strong> · {event.name || 'Nova data especial'}</div><span className="text-[10px] text-muted-foreground">{event.type === 'holiday' ? 'Feriado' : 'Solenidade'}</span></div></div><div className="grid grid-cols-[56px_minmax(0,1fr)_32px] gap-2 mt-2"><input type="number" min={1} max={new Date(year, month + 1, 0).getDate()} className="field" aria-label={`Dia de ${event.name}`} value={event.day} onChange={e => editEvent(index, { day: Math.min(new Date(year, month + 1, 0).getDate(), Math.max(1, Number(e.target.value))) })} /><input className="field" aria-label={`Nome da data especial ${index + 1}`} value={event.name} onChange={e => editEvent(index, { name: e.target.value })} /><Button variant="ghost" size="icon" aria-label={`Excluir ${event.name}`} title="Excluir data" onClick={() => update({ events: config.events.filter((_, i) => i !== index) })}><Trash2 /></Button></div><div className="event-time"><select className="field" aria-label={`Tipo de ${event.name}`} value={event.type} onChange={e => editEvent(index, { type: e.target.value as Event['type'] })}><option value="holiday">Feriado</option><option value="solemnity">Solenidade</option></select><input className="field" aria-label={`Horários extras de ${event.name}`} placeholder="19:00, 20:00" value={event.times.join(', ')} onChange={e => editEvent(index, { times: e.target.value.split(',').map(x => x.trim()) })} /></div><div className="text-[10px] text-muted-foreground mt-1">Horários extras: usados quando não há celebração habitual no dia.</div></div>)}<Button variant="outline" className="mt-3" onClick={() => update({ events: [...config.events, { day: 1, name: '', type: 'solemnity', enabled: true, times: ['19:00'] }] })}><Plus />Adicionar data especial</Button></section>
      </div></div>}
      {tab === 'Resumo' && <div className="view-enter"><div className="table-wrap"><table className="summary-table"><thead><tr><th>Coroinha</th><th>Semana</th><th>Domingos</th><th>Folgas</th><th>Total</th><th><Copy size={13} className="mx-auto" /></th></tr></thead><tbody>{config.people.map(p => { const weekdays = result.days.filter(d => d.weekday !== 0).reduce((sum, d) => sum + d.masses.filter(m => m.people.some(x => x.id === p.id)).length, 0), sundays = result.days.filter(d => d.weekday === 0 && d.masses.some(m => m.people.some(x => x.id === p.id))).length, off = result.days.filter(d => d.off.some(x => x.id === p.id)).length; return <tr key={p.id}><td><span className="person-info"><span className="avatar">{initials(p.name)}</span>{p.name}</span></td><td>{weekdays}</td><td>{sundays}<span className="text-muted-foreground">/{sundayCount}</span></td><td>{off}</td><td><strong className="text-primary">{result.counts[p.id] || 0}</strong></td><td><Button variant="ghost" size="icon" aria-label={`Copiar escala de ${p.name}`} title={`Copiar escala de ${p.name}`} onClick={() => copy(p.id)}><Copy /></Button></td></tr>; })}</tbody></table></div><div className="flex items-center gap-2 text-xs text-muted-foreground mt-4"><Check size={14} className="text-primary" />{result.warnings.length ? 'Há observações na distribuição. Confira os avisos acima.' : 'Distribuição concluída. Todos os coroinhas estão contemplados.'}</div></div>}
      <footer className="footer"><div className="footer-brand"><Church size={14} /><span>servir. <span className="hidden sm:inline">· Feito para servir juntos.</span></span></div><span>Seus dados ficam apenas neste navegador.</span></footer>
    </main>
    {toast && <div role="status" className="toast">{toast}</div>}
    {fallback && <div className="copy-fallback"><div role="dialog" aria-modal="true" aria-label="Copiar escala" className="copy-dialog"><div className="flex justify-between items-center mb-3"><h3 className="font-bold">Copiar escala</h3><Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setFallback('')}><X /></Button></div><p className="text-sm text-muted-foreground mb-3">A cópia automática não está disponível. Selecione o texto abaixo e copie para o WhatsApp.</p><textarea className="field" readOnly value={fallback} onFocus={e => e.target.select()} /><Button className="mt-3" onClick={() => setFallback('')}>Concluir</Button></div></div>}
  </>;
}
function Stat({ label, value, description, icon: Icon }: { label: string; value: number; description: string; icon: typeof Users }) { return <div className="stat"><div className="min-w-0"><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-description">{description}</div></div><div className="stat-icon"><Icon size={20} strokeWidth={1.6} /></div></div>; }
function DayCard({ day: d, personId }: { day: ScheduleDay; personId: string }) {
  const masses = d.masses.filter(m => !personId || m.people.some(p => p.id === personId)), off = d.off.filter(p => !personId || p.id === personId);
  return <article className="day-card"><div className={`day-heading ${d.weekday === 0 ? 'is-sunday' : ''}`}><div className="day-heading-main"><span className="date-number">{String(d.day).padStart(2, '0')}</span><div className="min-w-0"><div className="day-name flex items-center gap-2">{WEEKDAYS[d.weekday]}<span className="dot" data-color={d.color} title={d.event?.type === 'solemnity' ? d.event.name : d.season} /></div>{d.event && <div className="day-event">{d.event.name}</div>}</div></div><span className="day-badge">{d.event?.type === 'solemnity' ? 'Solenidade' : d.event?.type === 'holiday' ? 'Feriado' : d.weekday === 0 ? 'Missa dominical' : 'Missa da semana'}</span></div>
    {masses.length > 0 && <div className={`masses ${masses.length === 1 ? 'single' : ''}`}>{masses.map((m, i) => <div className="mass" key={`${m.id}-${i}`}><div className="mass-time"><Clock3 />{formatTime(m.time)}<span className="mass-count">{m.people.length} {m.people.length === 1 ? 'coroinha' : 'coroinhas'}</span></div><div className="names">{m.people.filter(p => !personId || p.id === personId).map(p => <span className="name-chip" key={p.id}>{p.name}</span>)}{!m.people.length && <span className="text-xs text-muted-foreground">Sem coroinhas disponíveis</span>}</div></div>)}</div>}
    {off.length > 0 && <div className="folga"><Coffee /><div><strong>Folga</strong> <span>(banco ou outra comunidade)</span><span className="mx-1">·</span>{off.map(p => p.name).join(', ')}</div></div>}
    {d.optional && <div className="folga"><Leaf /><span>Participação livre · vai quem puder.</span></div>}
  </article>;
}
