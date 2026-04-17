#!/usr/bin/env node

import { readFileSync, writeFileSync, cpSync, existsSync, readdirSync, mkdirSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATE_DIR = resolve(__dirname, "..", "template");

const USAGE = `Usage: npm create consolidate@latest <directory-name>
   or: npx create-consolidate <directory-name>`;

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

async function promptProjectName() {
  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question("Journal directory name: ")).trim();
    return answer;
  } finally {
    rl.close();
  }
}

function isDirEmpty(path) {
  return readdirSync(path).length === 0;
}

function replaceInFile(path, replacements) {
  let content = readFileSync(path, "utf8");
  for (const [from, to] of Object.entries(replacements)) {
    content = content.split(from).join(to);
  }
  writeFileSync(path, content);
}

function initGit(dir) {
  const git = (args) => spawnSync("git", args, { cwd: dir, stdio: "ignore" });
  const check = spawnSync("git", ["--version"], { stdio: "ignore" });
  if (check.status !== 0) {
    console.warn("⚠  git not found — skipping git init. Run it manually later.");
    return false;
  }
  if (git(["init", "-q"]).status !== 0) return false;
  git(["add", "."]);
  const commit = spawnSync(
    "git",
    ["commit", "-q", "-m", "init: skills and project base files"],
    { cwd: dir, stdio: "inherit" }
  );
  return commit.status === 0;
}

async function main() {
  let target = process.argv[2];
  if (!target) {
    target = await promptProjectName();
    if (!target) die(`Directory name is required.\n\n${USAGE}`);
  }
  if (target.startsWith("-")) die(`Invalid argument: ${target}\n\n${USAGE}`);

  const destPath = resolve(process.cwd(), target);
  const projectName = basename(destPath);

  if (existsSync(destPath) && !isDirEmpty(destPath)) {
    die(`Directory ${destPath} already exists and is not empty. Aborting.`);
  }

  if (!existsSync(TEMPLATE_DIR)) {
    die(`Template not found at ${TEMPLATE_DIR}. Corrupted install?`);
  }

  mkdirSync(destPath, { recursive: true });
  cpSync(TEMPLATE_DIR, destPath, { recursive: true });

  const gitignoreSrc = join(destPath, "_gitignore");
  if (existsSync(gitignoreSrc)) {
    renameSync(gitignoreSrc, join(destPath, ".gitignore"));
  }

  for (const file of ["package.json", "README.md"]) {
    const p = join(destPath, file);
    if (existsSync(p)) replaceInFile(p, { "{{projectName}}": projectName });
  }

  for (const sub of ["daily", "weekly", "monthly"]) {
    mkdirSync(join(destPath, "entries", sub), { recursive: true });
  }

  const gitOk = initGit(destPath);

  console.log("");
  console.log(`✓ Created ${projectName}/`);
  console.log("✓ Claude Code skills installed in .claude/skills/");
  if (gitOk) console.log("✓ Git repo initialized");
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${target}`);
  console.log("  # edit ABOUT.md to tell Claude who you are");
  console.log("  claude   # open Claude Code");
  console.log("  /new-entry");
  console.log("");
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
