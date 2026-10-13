import { describe, expect, it } from 'vitest';
import { defaults, generateSchedule, suggestedEvents, liturgy } from './schedule';

describe('November 2026 distribution', () => {
  it('gives each of 12 servers one Sunday off and four active Sundays', () => {
    const config = defaults(2026, 10), result = generateSchedule(2026, 10, config);
    for (const p of config.people) {
      expect(result.days.filter(d => d.weekday === 0 && d.off.some(x => x.id === p.id))).toHaveLength(1);
      expect(result.days.filter(d => d.weekday === 0 && d.masses.some(m => m.people.some(x => x.id === p.id)))).toHaveLength(4);
    }
  });
  it('includes everyone in Sunday solemnities and weekday holidays', () => {
    const config = defaults(2026, 10), result = generateSchedule(2026, 10, config);
    result.days.filter(d => d.event?.type === 'solemnity' && d.weekday === 0 || d.event?.type === 'holiday' && d.weekday !== 0).forEach(d => expect(new Set(d.masses.flatMap(m => m.people.map(p => p.id))).size).toBe(12));
  });
  it('includes every person at least once per scheduled weekday week', () => {
    const config = defaults(2026, 10), result = generateSchedule(2026, 10, config);
    for (const week of new Set(result.days.filter(d => d.weekday !== 0).map(d => d.week))) {
      const ids = new Set(result.days.filter(d => d.weekday !== 0 && d.week === week).flatMap(d => d.masses.flatMap(m => m.people.map(p => p.id))));
      expect(ids.size).toBe(12);
    }
  });
  it('honors blocked dates and service times and reports conflicts', () => {
    const config = defaults(2026, 10);
    config.people = config.people.map((p, i) => i === 0 ? { ...p, dates: [1, 3, 5], blocked: ['sun07', 'sun19'] } : p);
    const result = generateSchedule(2026, 10, config);
    for (const d of result.days) for (const m of d.masses) if ([1, 3, 5].includes(d.day) || ['sun07', 'sun19'].includes(m.id)) expect(m.people.some(p => p.id === 'person-0')).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
  it('warns when fixed capacity cannot fit everyone', () => {
    const config = defaults(2026, 10); config.capacity = 1;
    expect(generateSchedule(2026, 10, config).warnings.some(w => w.includes('no mínimo'))).toBe(true);
  });
  it('assigns all to every solemnity mass when enabled', () => {
    const config = defaults(2026, 10); config.allSolemnity = true;
    const result = generateSchedule(2026, 10, config);
    result.days.filter(d => d.weekday === 0 && d.event?.type === 'solemnity').forEach(d => d.masses.forEach(m => expect(m.people).toHaveLength(12)));
  });
  it('rotates the distribution', () => {
    const config = defaults(2026, 10), first = generateSchedule(2026, 10, config);
    config.rotation++;
    expect(generateSchedule(2026, 10, config).days[0]?.masses[0]?.people.map(p => p.id)).not.toEqual(first.days[0]?.masses[0]?.people.map(p => p.id));
  });
  it('has correct November dates and Advent change', () => {
    const events = suggestedEvents(2026, 10);
    expect(events.find(e => e.name === 'Todos os Santos')?.day).toBe(1);
    expect(events.find(e => e.name === 'Cristo Rei do Universo')?.day).toBe(22);
    expect(liturgy(2026, 10, 29).season).toBe('Advento');
  });
});