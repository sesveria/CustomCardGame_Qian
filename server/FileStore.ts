import fs from 'node:fs'; import path from 'node:path';
export class FileStore {
  private locks = new Map<string, Promise<void>>(); private baseDir: string;
  constructor(baseDir: string) { this.baseDir = baseDir; fs.mkdirSync(baseDir, { recursive: true }); }
  readJSON<T>(filepath: string): T | null { const full = path.join(this.baseDir, filepath); try { return JSON.parse(fs.readFileSync(full, 'utf-8')) as T; } catch { return null; } }
  async writeJSON<T>(filepath: string, data: T): Promise<void> { const full = path.join(this.baseDir, filepath); fs.mkdirSync(path.dirname(full), { recursive: true }); const prev = this.locks.get(filepath) ?? Promise.resolve(); const next = prev.then(() => { const tmp = full + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8'); fs.renameSync(tmp, full); }); this.locks.set(filepath, next); await next; }
  listJSON(dir: string): string[] { const full = path.join(this.baseDir, dir); try { return fs.readdirSync(full).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')); } catch { return []; } }
}
