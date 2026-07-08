#!/usr/bin/env node
// envshare CLI  login, list, clone, pull. Zero dependencies: stdlib only
// (global fetch, node:readline, node:child_process for `git`/opening a
// browser, raw ANSI codes for color instead of a chalk-style dependency).
// ponytail: manual argv parsing instead of util.parseArgs, four subcommands
// don't need a flag parser.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import readline from "node:readline";

const CONFIG_DIR = join(homedir(), ".envshare");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const API_URL = process.env.ENVSHARE_API_URL || "http://localhost:3000";

// Disabled automatically when stdout isn't a TTY (piped/redirected output)
// or NO_COLOR is set, same convention most CLIs follow.
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const c = {
  bold: paint("1"),
  dim: paint("2"),
  red: paint("31"),
  green: paint("32"),
  yellow: paint("33"),
  cyan: paint("36"),
};
const symbols = { ok: c.green("✔"), err: c.red("✖"), arrow: c.cyan("→") };

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  try {
    chmodSync(CONFIG_PATH, 0o600); // no-op on Windows, best-effort elsewhere
  } catch {}
}

function requireToken() {
  const config = loadConfig();
  if (!config?.token) fail("Not logged in. Run `envshare login` first.");
  return config.token;
}

async function api(path, { method = "GET", token, body, headers = {} } = {}) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function prompt(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // ponytail: readline has no native masked input; mute the output stream
      // while the question line renders instead of pulling in a dependency.
      const write = rl._writeToOutput.bind(rl);
      rl._writeToOutput = (s) => write(s.includes(question) || s === "\r\n" ? s : "");
    }
    rl.question(c.bold(question), (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

function openBrowser(url) {
  // Only ever open http(s) URLs, and never with shell:true  the URL comes
  // from our own API response, but validating the scheme + avoiding a shell
  // means a compromised/misconfigured server still can't inject a command.
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;

  try {
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", parsed.toString()], { shell: false, stdio: "ignore", detached: true }).unref();
    } else {
      const cmd = process.platform === "darwin" ? "open" : "xdg-open";
      spawn(cmd, [parsed.toString()], { shell: false, stdio: "ignore", detached: true }).unref();
    }
  } catch {
    // best effort  the printed URL below is the real fallback
  }
}

async function login() {
  const start = await api("/api/cli/device/start", { method: "POST" });
  if (!start.ok) return fail("Could not start login.");
  const { device_code, user_code, verification_url, expires_in } = await start.json();

  console.log(`${symbols.arrow} Confirm this code in your browser: ${c.bold(c.cyan(user_code))}`);
  console.log(c.dim(`  Opening ${verification_url}...`));
  openBrowser(verification_url);

  const deadline = Date.now() + expires_in * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await api("/api/cli/device/poll", { method: "POST", body: { device_code } });
    if (poll.status === 410) return fail("Login expired, run `envshare login` again.");
    if (!poll.ok) continue;
    const data = await poll.json();
    if (data.status === "approved") {
      saveConfig({ token: data.token, apiUrl: API_URL });
      return console.log(`${symbols.ok} Logged in.`);
    }
    if (data.status === "denied") return fail("Login was denied.");
  }
  fail("Login timed out.");
}

async function logout() {
  const config = loadConfig();
  if (config?.token) await api("/api/cli/token", { method: "DELETE", token: config.token });
  saveConfig({});
  console.log(`${symbols.ok} Logged out.`);
}

async function fetchEnvironments(token) {
  const res = await api("/api/cli/environments", { token });
  if (!res.ok) fail("Could not list environments.");
  return (await res.json()).environments;
}

/** Matches by id (exact), "workspace/name" (exact, case-insensitive), or bare name (case-insensitive, must be unique). */
function findEnvironment(environments, query) {
  const byId = environments.find((e) => e.id === query);
  if (byId) return byId;

  const q = query.toLowerCase();
  const bySlug = environments.find((e) => `${e.workspaceName}/${e.name}`.toLowerCase() === q);
  if (bySlug) return bySlug;

  const byName = environments.filter((e) => e.name.toLowerCase() === q);
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) {
    fail(
      `"${query}" matches multiple environments, use "workspace/name" instead:\n` +
        byName.map((e) => `  ${e.workspaceName}/${e.name}  (${e.id})`).join("\n")
    );
  }
  return null;
}

const LEVEL_LABEL = { none: "open", password_2fa: "password + 2FA", password_2fa_key: "password + 2FA + key" };

async function list() {
  const token = requireToken();
  const environments = await fetchEnvironments(token);
  if (environments.length === 0) return console.log(c.dim("No environments visible to your account."));

  const nameCol = Math.max(...environments.map((e) => `${e.workspaceName}/${e.name}`.length), 4);
  console.log(c.dim(`  ${"ENVIRONMENT".padEnd(nameCol)}  PROTECTION`));
  for (const env of environments) {
    const slug = `${env.workspaceName}/${env.name}`.padEnd(nameCol);
    const level = env.protectionLevel === "none" ? c.dim(LEVEL_LABEL[env.protectionLevel]) : c.yellow(LEVEL_LABEL[env.protectionLevel]);
    console.log(`  ${c.bold(slug)}  ${level}`);
    console.log(c.dim(`  ${" ".repeat(nameCol)}  ${env.id}`));
  }
}

/** Prompts for whatever credentials `protectionLevel` needs and returns an unlock token, or null if the env needs none. */
async function unlock(token, envId, protectionLevel) {
  if (protectionLevel === "none") return null;

  const password = await prompt("Password: ", { hidden: true });
  const body = { password };
  if (protectionLevel === "password_2fa" || protectionLevel === "password_2fa_key") {
    body.totp_code = await prompt("2FA code (authenticator app; passkeys aren't supported here): ");
  }
  if (protectionLevel === "password_2fa_key") {
    body.access_key = await prompt("Access key: ", { hidden: true });
  }

  const res = await api(`/api/cli/environments/${envId}/unlock`, { method: "POST", token, body });
  if (!res.ok) fail((await res.json()).error ?? "Could not unlock environment.");
  return (await res.json()).unlock_token;
}

async function downloadEnvFile(token, envId, protectionLevel, targetDir) {
  const unlockToken = await unlock(token, envId, protectionLevel);
  const res = await api(`/api/cli/environments/${envId}/download`, {
    token,
    headers: unlockToken ? { "x-unlock-token": unlockToken } : {},
  });
  if (!res.ok) fail((await res.json()).error ?? "Could not download .env.");
  const envPath = join(targetDir, ".env");
  writeFileSync(envPath, await res.text(), { mode: 0o600 });
  try {
    chmodSync(envPath, 0o600); // mode on writeFileSync is masked by umask; re-apply explicitly (no-op on Windows)
  } catch {}
  console.log(`${symbols.ok} Wrote ${c.bold(envPath)}`);
}

async function clone(query) {
  if (!query) fail("Usage: envshare clone <name-or-id>");
  const token = requireToken();

  const environments = await fetchEnvironments(token);
  const env = findEnvironment(environments, query);
  if (!env) fail(`No environment matches "${query}". Run \`envshare list\` to see what you have access to.`);
  if (!env.githubOwner || !env.githubRepo) fail("This environment has no linked GitHub repo.");
  // GitHub owner/repo names are limited to alphanumerics, dots, dashes and
  // underscores  reject anything else before it reaches a shell command or
  // a path.join, so a malicious/corrupted value can't inject a git argument
  // or escape process.cwd() via "..".
  const SAFE_NAME = /^[A-Za-z0-9._-]+$/;
  if (!SAFE_NAME.test(env.githubOwner) || !SAFE_NAME.test(env.githubRepo)) {
    fail("This environment's linked repo name looks invalid, refusing to clone.");
  }

  const sshUrl = `git@github.com:${env.githubOwner}/${env.githubRepo}.git`;
  const httpsUrl = `https://github.com/${env.githubOwner}/${env.githubRepo}.git`;

  console.log(`${symbols.arrow} Cloning ${c.bold(sshUrl)}`);
  let cloneResult = spawnSync("git", ["clone", sshUrl], { stdio: "inherit" });
  if (cloneResult.status !== 0) {
    // No SSH key set up is the common case  fall back to HTTPS (git will
    // prompt for a GitHub login/PAT itself) instead of just failing. Clean up
    // the half-created directory git leaves behind first, or the retry
    // fails with "already exists and is not an empty directory".
    const partialDir = join(process.cwd(), env.githubRepo);
    if (existsSync(partialDir)) rmSync(partialDir, { recursive: true, force: true });

    console.log(c.dim(`SSH clone failed, retrying over HTTPS: ${httpsUrl}...`));
    cloneResult = spawnSync("git", ["clone", httpsUrl], { stdio: "inherit" });
  }
  if (cloneResult.status !== 0) fail("git clone failed over both SSH and HTTPS.");

  const targetDir = join(process.cwd(), env.githubRepo);
  writeFileSync(join(targetDir, ".envshare"), JSON.stringify({ environmentId: env.id }, null, 2));
  await downloadEnvFile(token, env.id, env.protectionLevel, targetDir);
}

async function pull() {
  const token = requireToken();
  const environments = await fetchEnvironments(token);

  const markerPath = join(process.cwd(), ".envshare");
  let env;
  if (existsSync(markerPath)) {
    const { environmentId } = JSON.parse(readFileSync(markerPath, "utf8"));
    env = environments.find((e) => e.id === environmentId);
  } else {
    const query = await prompt("Environment name or ID: ");
    env = findEnvironment(environments, query);
    if (env) writeFileSync(markerPath, JSON.stringify({ environmentId: env.id }, null, 2));
  }
  if (!env) fail("Environment not found or you don't have access to it.");

  await downloadEnvFile(token, env.id, env.protectionLevel, process.cwd());
}

function fail(message) {
  console.error(`${symbols.err} ${message}`);
  process.exit(1);
}

const [, , command, ...args] = process.argv;
const commands = { login, logout, list, clone: () => clone(args[0]), pull };

if (!commands[command]) {
  console.log(`Usage: ${c.bold("envshare")} <login|logout|list|clone <name-or-id>|pull>`);
  process.exit(command ? 1 : 0);
}
await commands[command]();
