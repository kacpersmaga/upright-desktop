// Lokalna baza SQLite (wbudowany moduł node:sqlite – bez natywnych zależności).
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_SETTINGS, type Calibration, type MinuteSample, type Settings } from '../shared/types';

export class Store {
  private db: DatabaseSync;

  constructor(file: string) {
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS minutes (
        ts INTEGER PRIMARY KEY,
        present REAL, posture REAL, good_ratio REAL, fatigue REAL,
        blink_rate REAL, perclos REAL, long_blinks REAL, yawns INTEGER, issues TEXT
      );
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL, type TEXT NOT NULL, detail TEXT
      );
      CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
      CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
  }

  private getKv<T>(key: string): T | null {
    const row = this.db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? (JSON.parse(row.value) as T) : null;
  }

  private setKv(key: string, value: unknown): void {
    this.db.prepare('INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value));
  }

  getSettings(): Settings {
    return { ...DEFAULT_SETTINGS, ...(this.getKv<Partial<Settings>>('settings') ?? {}) };
  }

  saveSettings(s: Settings): void {
    this.setKv('settings', s);
  }

  getCalibration(): Calibration | null {
    return this.getKv<Calibration>('calibration');
  }

  saveCalibration(c: Calibration): void {
    this.setKv('calibration', c);
  }

  getMeta<T>(key: string): T | null {
    return this.getKv<T>(`meta:${key}`);
  }

  setMeta(key: string, value: unknown): void {
    this.setKv(`meta:${key}`, value);
  }

  saveMinute(s: MinuteSample): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO minutes(ts, present, posture, good_ratio, fatigue, blink_rate, perclos, long_blinks, yawns, issues)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(s.ts, s.present, s.posture, s.goodRatio, s.fatigue, s.blinkRate, s.perclos, s.longBlinks, s.yawns, JSON.stringify(s.issues));
  }

  minutesSince(ts: number): MinuteSample[] {
    const rows = this.db.prepare('SELECT * FROM minutes WHERE ts >= ? ORDER BY ts').all(ts) as Record<string, unknown>[];
    return rows.map((r) => ({
      ts: r.ts as number,
      present: r.present as number,
      posture: r.posture as number | null,
      goodRatio: r.good_ratio as number | null,
      fatigue: r.fatigue as number | null,
      blinkRate: r.blink_rate as number | null,
      perclos: r.perclos as number | null,
      longBlinks: r.long_blinks as number | null,
      yawns: (r.yawns as number) ?? 0,
      issues: JSON.parse((r.issues as string) || '{}'),
    }));
  }

  addEvent(type: string, detail?: string, ts = Date.now()): void {
    this.db.prepare('INSERT INTO events(ts, type, detail) VALUES(?, ?, ?)').run(ts, type, detail ?? null);
  }

  countEvents(type: string, since: number, until = Number.MAX_SAFE_INTEGER): number {
    const r = this.db.prepare('SELECT COUNT(*) AS n FROM events WHERE type = ? AND ts >= ? AND ts < ?').get(type, since, until) as { n: number };
    return r.n;
  }

  /** Czasy zdarzeń danego typu od `since` (np. przerwy i alerty na wykres dnia). */
  eventTimes(type: string, since: number): number[] {
    return (this.db.prepare('SELECT ts FROM events WHERE type = ? AND ts >= ? ORDER BY ts').all(type, since) as { ts: number }[]).map((r) => r.ts);
  }

  /** „Usuń moje dane”: historia, zdarzenia i kalibracja. Ustawienia zostają. */
  wipe(): void {
    this.db.exec(`DELETE FROM minutes; DELETE FROM events; DELETE FROM kv WHERE key <> 'settings';`);
  }
}
