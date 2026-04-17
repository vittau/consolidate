#!/usr/bin/env node
// Print pending consolidation work for the journal.
//
// Output sections (stable for SKILL.md parsing):
//   ## Daily entries missing keywords
//   ## Complete ISO weeks missing summary
//   ## Complete months missing summary
//
// Directory layout (hierarchical):
//   entries/daily/<YYYY-MM>/<YYYY-MM-DD>.md
//   entries/weekly/<YYYY-MM>/<YYYY-Www>.md   (month = month of the ISO week's Thursday)
//   entries/monthly/<YYYY>/<YYYY-MM>.md

import fs from 'node:fs';
import path from 'node:path';

const PROJECT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
process.chdir(PROJECT);

for (const d of ['entries/daily', 'entries/weekly', 'entries/monthly']) {
  fs.mkdirSync(d, { recursive: true });
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEK_RE = /^(\d{4})-W(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;
const YEAR_RE = /^(\d{4})$/;
const KW_RE = /^keywords:\s*\[/m;

function parseISODate(s) {
  const m = DATE_RE.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

// Today as a Date whose UTC components equal the local calendar date.
// Comparisons stay consistent because daily filenames (written in local
// time via `date +%Y-%m-%d`) are parsed through parseISODate with the
// same convention.
function todayAsCalendarDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function isoWeekOf(date) {
  const d = new Date(date.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNr + 3);
  const year = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayNr = (jan4.getUTCDay() + 6) % 7;
  jan4.setUTCDate(jan4.getUTCDate() - jan4DayNr + 3);
  const week = 1 + Math.round((d - jan4) / (7 * 86400000));
  return { year, week };
}

function fromISOWeek(year, week, day) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayNr = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNr);
  const target = new Date(week1Monday);
  target.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7 + (day - 1));
  return target;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function fmtYearMonth(y, m) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

// Recursively list .md files under `root` that sit inside a subdirectory
// whose name matches `dirRe`, and whose basename matches `nameRe`.
// Files that violate either rule emit a warning and are skipped.
function listMd(root, dirRe, nameRe) {
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const kept = [];
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!dirRe.test(entry.name)) {
        console.warn(`warn: ignoring ${full} (non-canonical subdirectory for ${root})`);
        continue;
      }
      const files = fs.readdirSync(full).filter((f) => f.endsWith('.md')).sort();
      for (const f of files) {
        const name = path.basename(f, '.md');
        if (nameRe.test(name)) {
          kept.push(path.join(full, f));
        } else {
          console.warn(`warn: ignoring ${path.join(full, f)} (non-canonical name for ${root})`);
        }
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      console.warn(`warn: ignoring ${full} (expected inside a subdirectory of ${root})`);
    }
  }
  kept.sort();
  return kept;
}

const today = todayAsCalendarDate();

const dailyFiles = listMd('entries/daily', MONTH_RE, DATE_RE);
const weeklyFiles = listMd('entries/weekly', MONTH_RE, WEEK_RE);
listMd('entries/monthly', YEAR_RE, MONTH_RE); // validate only; rebuilt from weekly below

const missingKeywords = [];
for (const p of dailyFiles) {
  if (!KW_RE.test(fs.readFileSync(p, 'utf8'))) missingKeywords.push(p);
}

const weekSet = new Set();
for (const p of dailyFiles) {
  const d = parseISODate(path.basename(p, '.md'));
  if (!d) continue;
  const { year, week } = isoWeekOf(d);
  weekSet.add(year * 100 + week);
}

const pendingWeeks = [];
for (const packed of [...weekSet].sort((a, b) => a - b)) {
  const y = Math.floor(packed / 100);
  const w = packed % 100;
  const sunday = fromISOWeek(y, w, 7);
  if (sunday < today) {
    const tag = `${y}-W${String(w).padStart(2, '0')}`;
    const thu = fromISOWeek(y, w, 4);
    const subdir = fmtYearMonth(thu.getUTCFullYear(), thu.getUTCMonth() + 1);
    const target = `entries/weekly/${subdir}/${tag}.md`;
    if (!fs.existsSync(target)) {
      pendingWeeks.push([tag, fmtDate(sunday)]);
    }
  }
}

const monthSet = new Set();
for (const p of weeklyFiles) {
  const m = WEEK_RE.exec(path.basename(p, '.md'));
  if (!m) continue;
  const thu = fromISOWeek(+m[1], +m[2], 4);
  monthSet.add(thu.getUTCFullYear() * 100 + (thu.getUTCMonth() + 1));
}

const pendingMonths = [];
for (const packed of [...monthSet].sort((a, b) => a - b)) {
  const y = Math.floor(packed / 100);
  const mo = packed % 100;
  const nextFirst = new Date(
    Date.UTC(y + (mo === 12 ? 1 : 0), mo === 12 ? 0 : mo, 1),
  );
  if (nextFirst <= today) {
    const tag = fmtYearMonth(y, mo);
    const target = `entries/monthly/${y}/${tag}.md`;
    if (!fs.existsSync(target)) {
      pendingMonths.push(tag);
    }
  }
}

function section(title, items, fmt = (x) => x) {
  console.log(`## ${title}`);
  if (items.length) {
    for (const it of items) console.log(`- ${fmt(it)}`);
  } else {
    console.log('(none)');
  }
  console.log();
}

section('Daily entries missing keywords', missingKeywords);
section(
  'Complete ISO weeks missing summary',
  pendingWeeks,
  (t) => `${t[0]} (ended ${t[1]})`,
);
section('Complete months missing summary', pendingMonths);
