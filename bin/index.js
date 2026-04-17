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

const USAGE = `Uso: npm create consolidate@latest <nome-do-diretorio>
   ou: npx create-consolidate <nome-do-diretorio>`;

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

async function promptProjectName() {
  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question("Nome do diretório do journal: ")).trim();
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
    console.warn("⚠  git não encontrado — pulando git init. Rode manualmente depois.");
    return false;
  }
  if (git(["init", "-q"]).status !== 0) return false;
  git(["add", "."]);
  const commit = spawnSync(
    "git",
    ["commit", "-q", "-m", "init: skills e arquivos base do projeto"],
    { cwd: dir, stdio: "inherit" }
  );
  return commit.status === 0;
}

async function main() {
  let target = process.argv[2];
  if (!target) {
    target = await promptProjectName();
    if (!target) die(`Nome do diretório é obrigatório.\n\n${USAGE}`);
  }
  if (target.startsWith("-")) die(`Argumento inválido: ${target}\n\n${USAGE}`);

  const destPath = resolve(process.cwd(), target);
  const projectName = basename(destPath);

  if (existsSync(destPath) && !isDirEmpty(destPath)) {
    die(`Diretório ${destPath} já existe e não está vazio. Abortando.`);
  }

  if (!existsSync(TEMPLATE_DIR)) {
    die(`Template não encontrado em ${TEMPLATE_DIR}. Instalação corrompida?`);
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
  console.log(`✓ Criado ${projectName}/`);
  console.log("✓ Skills do Claude Code instaladas em .claude/skills/");
  if (gitOk) console.log("✓ Repo git inicializado");
  console.log("");
  console.log("Próximos passos:");
  console.log(`  cd ${target}`);
  console.log("  claude   # abrir o Claude Code");
  console.log("  /new-entry");
  console.log("");
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
