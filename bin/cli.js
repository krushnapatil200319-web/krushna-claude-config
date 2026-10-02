#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const TEMPLATE = path.join(__dirname, "..", "template");
const MEMORY_OWNER = "memory";
const EXCLUDE_LINES = [".claude/", "CLAUDE.md"];
const USAGE = "Usage: npx krushna-claude-config [--force]\n       npx krushna-claude-config uninstall";

const args = process.argv.slice(2);
const command = args.includes("uninstall") ? "uninstall" : "install";
const force = args.includes("--force");
const unknown = args.filter((a) => a !== "uninstall" && a !== "--force");
if (unknown.length || (command === "uninstall" && force)) {
  console.error("Unknown option: " + (unknown.join(" ") || "--force") + "\n" + USAGE);
  process.exit(1);
}

// Windows paths differ only by case between shells ("c:\" vs "C:\")
const normalize = (p) => path.resolve(p).replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const samePath = (a, b) => (process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b);

const cwd = normalize(process.cwd());
const home = normalize(os.homedir());

// Claude Code keys a project by its git repo: every subfolder and worktree shares the main checkout's memory.
// Outside a git repo it uses the folder Claude is started in.
function findRoots() {
  let out;
  try {
    out = execFileSync("git", ["rev-parse", "--show-toplevel", "--git-common-dir", "--git-path", "info/exclude"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, LC_ALL: "C" },
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      console.warn("git is not installed: treating this folder as the project.");
      return { projectRoot: cwd, memoryRoot: cwd, exclude: null };
    }
    const stderr = String(err.stderr || err.message).trim();
    if (/not a git repository \(or any (of the )?parent/i.test(stderr)) return { projectRoot: cwd, memoryRoot: cwd, exclude: null };
    console.error("Could not read the git repo here:\n" + stderr);
    process.exit(1);
  }
  const [top, common, exclude] = out.split(/\r?\n/);
  if (!top || !common || !exclude) {
    console.error("Could not read the git repo here: git rev-parse returned:\n" + out);
    process.exit(1);
  }
  const projectRoot = normalize(top);
  const commonDir = path.resolve(cwd, common);
  // A linked worktree's common dir is <main checkout>/.git; a submodule's is not, so it keeps its own root
  const memoryRoot = path.basename(commonDir) === ".git" ? normalize(path.dirname(commonDir)) : projectRoot;
  return { projectRoot, memoryRoot, exclude: path.resolve(cwd, exclude) };
}

const { projectRoot, memoryRoot, exclude } = findRoots();
if (samePath(projectRoot, home) || samePath(projectRoot, path.parse(projectRoot).root)) {
  console.error("Refusing to run in your home or root folder. cd into a project first.");
  process.exit(1);
}

// Claude Code's folder for this project: every non-alphanumeric character becomes "-"
const projectDir = path.join(home, ".claude", "projects", memoryRoot.replace(/[^a-zA-Z0-9]/g, "-"));
const memoryDest = path.join(projectDir, "memory");
const manifestPath = path.join(projectDir, "krushna-claude-config.json");

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function readManifest() {
  if (!fs.existsSync(manifestPath)) return { files: {}, excludeAdded: [] };
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function writeManifest(manifest) {
  fs.mkdirSync(projectDir, { recursive: true });
  const tmp = manifestPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2));
  fs.renameSync(tmp, manifestPath);
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

// Template file -> where it goes, and which checkout owns it (memory is shared by all checkouts)
function plan() {
  const projectTemplate = path.join(TEMPLATE, "project");
  const memoryTemplate = path.join(TEMPLATE, "memory");
  const toProject = listFiles(projectTemplate).map((from) => {
    const rel = path.relative(projectTemplate, from).split(path.sep);
    if (rel[0] === "dot-claude") rel[0] = ".claude";
    return { from, to: path.join(projectRoot, ...rel), owner: projectRoot };
  });
  const toMemory = listFiles(memoryTemplate).map((from) => ({
    from,
    to: path.join(memoryDest, path.relative(memoryTemplate, from)),
    owner: MEMORY_OWNER,
  }));
  return [...toProject, ...toMemory];
}

function install() {
  const manifest = readManifest();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const kept = [];

  console.log("Setting up: " + projectRoot);
  if (!samePath(cwd, projectRoot)) console.log("(you ran this from a subfolder; installing at the repo root)");
  for (const { from, to, owner } of plan()) {
    const entry = manifest.files[to];
    const exists = fs.existsSync(to);
    const ours = exists && entry && sha256(to) === entry.hash;
    const same = exists && sha256(to) === sha256(from);

    if (exists && same) {
      console.log("  = up to date: " + to);
      continue;
    }
    if (exists && !ours && !force) {
      kept.push(to);
      console.log("  - exists, skipped: " + to);
      continue;
    }

    let backup = entry ? entry.backup : null;
    if (exists && !ours) {
      const bak = to + ".bak-" + stamp;
      fs.copyFileSync(to, bak);
      if (!backup) backup = bak;
      console.log("  ! backed up: " + bak);
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    manifest.files[to] = { hash: sha256(to), backup, owner };
    writeManifest(manifest);
    console.log("  + " + to);
  }

  if (exclude) {
    fs.mkdirSync(path.dirname(exclude), { recursive: true });
    const current = fs.existsSync(exclude) ? fs.readFileSync(exclude, "utf8").split(/\r?\n/) : [];
    const add = EXCLUDE_LINES.filter((line) => !current.includes(line));
    if (add.length) {
      const prefix = current.length && current[current.length - 1] !== "" ? "\n" : "";
      fs.appendFileSync(exclude, prefix + add.join("\n") + "\n");
      manifest.excludeAdded = [...new Set([...(manifest.excludeAdded || []), ...add])];
    }
    writeManifest(manifest);
    console.log("\nHidden from git via " + exclude + " (files git already tracks stay tracked).");
  } else {
    writeManifest(manifest);
    console.log("\nNot a git repo: .claude/ and CLAUDE.md were NOT hidden from git.");
  }

  if (kept.length) console.log("\n" + kept.length + " existing file(s) left as they were. Re-run with --force to replace them (originals are backed up).");
  console.log("\nDone. Start Claude Code here with: claude\nRemove later with: npx krushna-claude-config uninstall");
}

function removeEmptyDirs(dir, stopAt) {
  while (dir.startsWith(stopAt) && dir !== stopAt && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

function uninstall() {
  const manifest = readManifest();
  const entries = Object.entries(manifest.files);
  const mine = entries.filter(([, e]) => e.owner !== MEMORY_OWNER && samePath(e.owner, projectRoot));
  const otherCheckouts = [...new Set(entries.filter(([, e]) => e.owner !== MEMORY_OWNER && !samePath(e.owner, projectRoot)).map(([, e]) => e.owner))];
  if (!entries.length || (!mine.length && otherCheckouts.length)) {
    console.log("Nothing installed by krushna-claude-config in " + projectRoot);
    return;
  }
  // Memory is shared with other worktrees of this repo, so it goes only with the last checkout
  const memory = otherCheckouts.length ? [] : entries.filter(([, e]) => e.owner === MEMORY_OWNER);
  const modified = [];

  console.log("Removing from: " + projectRoot);
  for (const [file, { hash, backup, owner }] of [...mine, ...memory]) {
    if (fs.existsSync(file) && sha256(file) !== hash) {
      modified.push(file);
      console.log("  ~ you changed it, kept: " + file);
    } else {
      if (fs.existsSync(file)) fs.unlinkSync(file);
      if (backup && fs.existsSync(backup)) {
        fs.renameSync(backup, file);
        console.log("  < restored your original: " + file);
      } else {
        console.log("  x " + file);
      }
    }
    if (modified.includes(file) && backup && fs.existsSync(backup)) console.log("    your original is still at: " + backup);
    removeEmptyDirs(path.dirname(file), owner === MEMORY_OWNER ? projectDir : owner);
    delete manifest.files[file];
    writeManifest(manifest);
  }

  if (otherCheckouts.length) {
    console.log("\nKept the shared memory and git exclude lines: still used by " + otherCheckouts.join(", "));
  } else {
    // The exclude file is shared by every worktree, so our lines go only with the last checkout
    if (exclude && fs.existsSync(exclude) && (manifest.excludeAdded || []).length) {
      const lines = fs.readFileSync(exclude, "utf8").split(/\r?\n/);
      fs.writeFileSync(exclude, lines.filter((line) => !manifest.excludeAdded.includes(line)).join("\n"));
      console.log("\nRemoved our lines from " + exclude);
    }
    fs.unlinkSync(manifestPath);
  }
  console.log(modified.length ? "\nDone. " + modified.length + " file(s) you edited were kept." : "\nDone.");
}

if (command === "uninstall") uninstall();
else install();
