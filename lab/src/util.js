import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

export function sha256File(file) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}

export function deepClone(obj) {
  return structuredClone(obj);
}

export function parseModeList(text) {
  if (!text || text === 'all') return null;
  const out = new Set();
  for (const token0 of String(text).split(',')) {
    const token = token0.trim();
    if (!token) continue;
    const m = token.match(/^(-?\d+)\s*-\s*(-?\d+)$/);
    if (m) {
      let a = Number(m[1]), b = Number(m[2]);
      const step = a <= b ? 1 : -1;
      for (let v = a; ; v += step) {
        out.add(v);
        if (v === b) break;
      }
    } else if (/^-?\d+$/.test(token)) {
      out.add(Number(token));
    } else {
      throw new Error(`Некорректный список modes: ${token}`);
    }
  }
  return out;
}

export function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq >= 0) options[arg.slice(2, eq)] = arg.slice(eq + 1);
      else options[arg.slice(2)] = true;
    } else positional.push(arg);
  }
  return { positional, options };
}

export function fmtNum(v) {
  if (typeof v !== 'number') return String(v);
  if (!Number.isFinite(v)) return String(v);
  const a = Math.abs(v);
  if ((a > 0 && a < 1e-4) || a >= 1e7) return v.toExponential(6);
  return String(Number(v.toFixed(9)));
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function sanitizeFileName(name) {
  return String(name).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_').slice(0, 120);
}

export function nowIso() {
  return new Date().toISOString();
}
