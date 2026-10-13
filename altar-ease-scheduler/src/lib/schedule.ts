export type Person = { id: string; name: string; blocked: string[]; dates: number[] };
export type Service = { id: string; weekday: number; time: string };
export type Event = { day: number; name: string; type: 'holiday' | 'solemnity'; times: string[]; enabled: boolean };
export type Settings = { people: Person[]; services: Service[]; capacity: number; allSolemnity: boolean; events: Event[]; rotation: number };
export type Mass = { id: string; time: string; people: Person[] };
export type ScheduleDay = { day: number; weekday: number; week: string; masses: Mass[]; off: Person[]; event: Event | undefined; optional: boolean; color: string; season: string };
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const defaultServices: Service[] = [{ id: 'tue19', weekday: 2, time: '19:00' }, { id: 'thu19', weekday: 4, time: '19:00' }, { id: 'sun07', weekday: 0, time: '07:00' }, { id: 'sun09', weekday: 0, time: '09:00' }, { id: 'sun19', weekday: 0, time: '19:00' }];
export const defaultPeople: Person[] = ['Ana Clara', 'Arthur', 'Beatriz', 'Davi', 'Gabriel', 'Helena', 'Isabela', 'João Pedro', 'Laura', 'Lucas', 'Maria Eduarda', 'Miguel'].map((name, i) => ({ id: `person-${i}`, name, blocked: [], dates: [] }));
export function easter(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1, 12);
}
const shifted = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n, 12);
export function advent(year: number) { const christmas = new Date(year, 11, 25, 12); return shifted(christmas, -(christmas.getDay() || 7) - 21); }
export const isSolemnity = (event: Event | undefined) => event?.type === 'solemnity' || Boolean(event && /Santa Maria|Aparecida|Natal do Senhor/.test(event.name));
export function liturgy(year: number, month: number, day: number) {
  const date = new Date(year, month, day, 12), pascha = easter(year), ad = advent(year);
  const epiphany = new Date(year, 0, 2, 12);
  const epiphanySunday = shifted(epiphany, (7 - epiphany.getDay()) % 7);
  const baptism = shifted(epiphanySunday, epiphanySunday.getDate() >= 7 ? 1 : 7);
  if (month === 11 && day >= 25 || month === 0 && date <= baptism) return { season: 'Tempo do Natal', color: 'white' };
  if (date >= ad && date < new Date(year, 11, 25)) return { season: 'Advento', color: 'violet' };
  if (date >= shifted(pascha, -46) && date < pascha) return { season: 'Quaresma', color: 'violet' };
  if (date >= pascha && date <= shifted(pascha, 49)) return { season: 'Tempo Pascal', color: 'white' };
  return { season: 'Tempo Comum', color: 'green' };
}
export function suggestedEvents(year: number, month: number): Event[] {
  const events: Event[] = [];
  const add = (date: Date, name: string, type: Event['type']) => { if (date.getMonth() === month && date.getFullYear() === year) events.push({ day: date.getDate(), name, type, times: ['19:00'], enabled: true }); };
  const fixed: [number, number, string, Event['type']][] = [[0, 1, 'Santa Maria, Mãe de Deus • Confraternização Universal', 'holiday'], [3, 21, 'Tiradentes', 'holiday'], [4, 1, 'Dia do Trabalho', 'holiday'], [8, 7, 'Independência do Brasil', 'holiday'], [9, 12, 'Nossa Senhora Aparecida', 'holiday'], [10, 2, 'Finados', 'holiday'], [10, 15, 'Proclamação da República', 'holiday'], [10, 20, 'Dia da Consciência Negra', 'holiday'], [11, 8, 'Imaculada Conceição', 'solemnity'], [11, 25, 'Natal do Senhor', 'holiday']];
  fixed.forEach(([m, day, name, type]) => add(new Date(year, m, day, 12), name, type));
  const assumption = new Date(year, 7, 15, 12); add(shifted(assumption, (7 - assumption.getDay()) % 7), 'Assunção de Nossa Senhora', 'solemnity');
  const pascha = easter(year);
  add(shifted(pascha, -2), 'Paixão do Senhor', 'holiday'); add(pascha, 'Páscoa do Senhor', 'solemnity'); add(shifted(pascha, 42), 'Ascensão do Senhor', 'solemnity'); add(shifted(pascha, 49), 'Pentecostes', 'solemnity'); add(shifted(pascha, 56), 'Santíssima Trindade', 'solemnity'); add(shifted(pascha, 60), 'Corpus Christi • conferir feriado local', 'solemnity');
  const allSaints = new Date(year, 10, 1, 12); add(shifted(allSaints, (7 - allSaints.getDay()) % 7), 'Todos os Santos', 'solemnity');
  add(shifted(advent(year), -7), 'Cristo Rei do Universo', 'solemnity');
  return events.sort((a, b) => a.day - b.day);
}
export const defaults = (year: number, month: number): Settings => ({ people: defaultPeople, services: defaultServices, capacity: 0, allSolemnity: false, events: suggestedEvents(year, month), rotation: 0 });
export function generateSchedule(year: number, month: number, config: Settings) {
  const days: ScheduleDay[] = [], warnings = new Set<string>(), counts: Record<string, number> = {};
  const people = [...config.people];
  people.forEach(p => counts[p.id] = 0);
  const ordered = [...people.slice(config.rotation % (people.length || 1)), ...people.slice(0, config.rotation % (people.length || 1))];
  const can = (p: Person, day: ScheduleDay, mass: Mass) => !p.dates.includes(day.day) && !p.blocked.includes(mass.id) && !p.blocked.includes(`time:${mass.time}`);
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
    const date = new Date(year, month, day, 12), weekday = date.getDay(), event = config.events.find(e => e.enabled && e.day === day);
    const services = config.services.filter(s => s.weekday === weekday);
    const masses: Mass[] = (services.length ? services.filter(s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)).map(s => ({ id: s.id, time: s.time, people: [] })) : event ? event.times.filter(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)).map(time => ({ id: `event-${day}-${time}`, time, people: [] })) : []).sort((a, b) => a.time.localeCompare(b.time));
    if (!masses.length) { if (event || services.length) warnings.add(`${day}/${month + 1}: informe pelo menos um horário válido (ex.: 19:00).`); continue; }
    const monday = shifted(date, -(weekday === 0 ? 6 : weekday - 1));
    const lit = liturgy(year, month, day);
    days.push({ day, weekday, week: `${monday.getMonth()}-${monday.getDate()}`, masses, off: [], event, optional: weekday !== 0 && event?.type === 'solemnity', color: isSolemnity(event) ? event?.name.includes('Pentecostes') ? 'red' : 'white' : lit.color, season: lit.season });
  }
  const give = (p: Person, mass: Mass) => { if (!mass.people.some(x => x.id === p.id)) { mass.people.push(p); counts[p.id] = (counts[p.id] ?? 0) + 1; } };
  const distributeAll = (day: ScheduleDay, participants: Person[], all = false) => {
    for (const p of participants) {
      const available = day.masses.filter(m => can(p, day, m));
      if (!available.length) { if (!day.optional) warnings.add(`${p.name}: indisponível em ${day.day}/${month + 1}. Confira a regra deste dia.`); continue; }
      if (all) { available.forEach(m => give(p, m)); if (available.length !== day.masses.length) warnings.add(`${p.name}: uma restrição impede servir em todas as missas de ${day.day}/${month + 1}.`); }
      else { const target = [...available].sort((a, b) => a.people.length - b.people.length)[0]; if (target) give(p, target); }
    }
  };
  const sundays = days.filter(d => d.weekday === 0), normalSundays = sundays.filter(d => !isSolemnity(d.event));
  ordered.forEach((p, i) => {
    const unavailable = sundays.filter(d => !d.masses.some(m => can(p, d, m)));
    const options = normalSundays.filter(d => !d.masses.some(m => can(p, d, m)));
    const off = options[0] ?? normalSundays[i % (normalSundays.length || 1)];
    if (off) off.off.push(p); else warnings.add('Não há domingo livre de solenidade para distribuir uma folga por coroinha.');
    if (unavailable.length > 1) warnings.add(`${p.name}: indisponível em ${unavailable.length} domingos; não é possível manter apenas uma folga.`);
  });
  sundays.forEach(d => distributeAll(d, ordered.filter(p => !d.off.some(o => o.id === p.id)), config.allSolemnity && isSolemnity(d.event)));
  const weekKeys = [...new Set(days.filter(d => d.weekday !== 0).map(d => d.week))];
  weekKeys.forEach(week => {
    const weekdays = days.filter(d => d.week === week && d.weekday !== 0);
    weekdays.filter(d => d.event?.type === 'holiday').forEach(d => distributeAll(d, ordered));
    weekdays.filter(d => d.optional).forEach(d => { distributeAll(d, ordered); warnings.add(`${d.day}/${month + 1} · ${d.event?.name}: participação livre, vai quem puder.`); });
    const regular = weekdays.filter(d => !d.event), slots = regular.flatMap(d => d.masses.map(m => ({ day: d, mass: m })));
    const missing = ordered.filter(p => !weekdays.some(d => d.masses.some(m => m.people.some(x => x.id === p.id))));
    if (!slots.length) { missing.forEach(p => warnings.add(`${p.name}: sem celebração disponível na semana de ${weekdays[0]?.day}/${month + 1}.`)); return; }
    const cap = config.capacity || Math.ceil(people.length / slots.length);
    if (config.capacity && cap * slots.length < missing.length) warnings.add(`Semana de ${weekdays[0]?.day}/${month + 1}: use no mínimo ${Math.ceil(missing.length / slots.length)} coroinhas por celebração.`);
    const placements = new Map<string, number>();
    const attempt = (p: Person, seen: Set<number>): boolean => {
      const available = slots.map((s, index) => ({ ...s, index })).filter(s => can(p, s.day, s.mass)).sort((a, b) => a.mass.people.length - b.mass.people.length);
      for (const s of available) {
        if (seen.has(s.index)) continue;
        seen.add(s.index);
        if (s.mass.people.length < cap) { s.mass.people.push(p); placements.set(p.id, s.index); return true; }
        for (const other of [...s.mass.people]) {
          if (attempt(other, seen)) { s.mass.people = s.mass.people.filter(x => x.id !== other.id); s.mass.people.push(p); placements.set(p.id, s.index); return true; }
        }
      }
      return false;
    };
    missing.sort((a, b) => slots.filter(s => can(a, s.day, s.mass)).length - slots.filter(s => can(b, s.day, s.mass)).length || (counts[a.id] ?? 0) - (counts[b.id] ?? 0)).forEach(p => { if (!attempt(p, new Set())) warnings.add(`${p.name}: não foi possível escalar na semana de ${weekdays[0]?.day}/${month + 1}. Revise as restrições ou o número por missa.`); });
    placements.forEach((_, id) => counts[id] = (counts[id] ?? 0) + 1);
    slots.forEach(s => {
      const eligible = ordered.filter(p => can(p, s.day, s.mass) && !s.mass.people.some(x => x.id === p.id)).sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
      eligible.slice(0, Math.max(0, cap - s.mass.people.length)).forEach(p => give(p, s.mass));
    });
  });
  return { days, warnings: [...warnings], counts };
}
export function scheduleText(year: number, month: number, days: ScheduleDay[], personId = '') {
  const rows = [`*ESCALA DOS COROINHAS — ${(MONTHS[month] ?? "").toUpperCase()} ${year}*`, ''];
  for (const d of days) {
    const masses = d.masses.filter(m => !personId || m.people.some(p => p.id === personId)), off = d.off.filter(p => !personId || p.id === personId);
    if (!masses.length && !off.length) continue;
    rows.push(`*${String(d.day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')} · ${WEEKDAYS[d.weekday]}*${d.event ? ` — ${d.event.name}` : ''}`);
    masses.forEach(m => rows.push(`${m.time} — ${m.people.filter(p => !personId || p.id === personId).map(p => p.name).join(', ') || 'Sem coroinhas disponíveis'}`));
    if (off.length) rows.push(`Folga (banco ou outra comunidade): ${off.map(p => p.name).join(', ')}`);
    if (d.optional) rows.push('Participação livre: vai quem puder.');
    rows.push('');
  }
  rows.push('Confira as datas especiais com o calendário da paróquia.');
  return rows.join('\n');
}