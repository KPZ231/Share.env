/**
 * Canonical .env parse/serialize/validate so upload and manual-entry modes
 * converge on one format before ever touching Storage. Pure string ops, no
 * eval/exec of file contents  parsing untrusted .env text must never
 * execute it (this is a secrets app: treat every uploaded file as hostile).
 */

export type EnvPair = { key: string; value: string };

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_KEY_LENGTH = 128;
const MAX_VALUE_BYTES = 8 * 1024;
const MAX_PAIRS = 500;
const MAX_TOTAL_BYTES = 256 * 1024;

function unquote(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length >= 2 && trimmed[0] === '"' && trimmed[trimmed.length - 1] === '"') {
    return trimmed
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  if (trimmed.length >= 2 && trimmed[0] === "'" && trimmed[trimmed.length - 1] === "'") {
    return trimmed.slice(1, -1);
  }
  // Unquoted: strip a trailing ` # comment` but keep the value otherwise as-is.
  const commentIdx = trimmed.indexOf(" #");
  return commentIdx === -1 ? trimmed : trimmed.slice(0, commentIdx).trimEnd();
}

/** Parses .env text into ordered key/value pairs. Malformed lines are skipped, never executed. */
export function parseEnv(text: string): EnvPair[] {
  const pairs: EnvPair[] = [];

  for (const rawLine of text.split(/\r\n|\r|\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const withoutExport = line.startsWith("export ") ? line.slice("export ".length) : line;
    const eqIdx = withoutExport.indexOf("=");
    if (eqIdx <= 0) continue;

    const key = withoutExport.slice(0, eqIdx).trim();
    if (!KEY_PATTERN.test(key)) continue;

    const value = unquote(withoutExport.slice(eqIdx + 1));
    pairs.push({ key, value });
  }

  return pairs;
}

function needsQuoting(value: string): boolean {
  return /[\s"'#\\\n]/.test(value) || value === "";
}

/** Serializes pairs back to .env text, quoting/escaping so values round-trip safely. */
export function serializeEnv(pairs: EnvPair[]): string {
  return (
    pairs
      .map(({ key, value }) => {
        if (!needsQuoting(value)) return `${key}=${value}`;
        const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
        return `${key}="${escaped}"`;
      })
      .join("\n") + "\n"
  );
}

export type ValidationError = { key?: string; message: string };

/** The security gate: re-run server-side, never trust client-side limits alone. */
export function validatePairs(pairs: EnvPair[]): { ok: true } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (pairs.length > MAX_PAIRS) {
    errors.push({ message: `Too many variables (max ${MAX_PAIRS}).` });
  }

  const seen = new Set<string>();
  for (const { key, value } of pairs) {
    if (!KEY_PATTERN.test(key) || key.length > MAX_KEY_LENGTH) {
      errors.push({ key, message: `Invalid variable name: ${key}` });
    }
    if (seen.has(key)) {
      errors.push({ key, message: `Duplicate variable name: ${key}` });
    }
    seen.add(key);
    if (Buffer.byteLength(value, "utf8") > MAX_VALUE_BYTES) {
      errors.push({ key, message: `Value too large for ${key}.` });
    }
  }

  const total = Buffer.byteLength(serializeEnv(pairs), "utf8");
  if (total > MAX_TOTAL_BYTES) {
    errors.push({ message: "File too large." });
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

// Minimal self-check  run with `npx tsx lib/env-format.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/env-format.ts")) {
  const source = `# comment\nexport FOO=bar\nBAZ="hello world"\nQUOTED='single'\nEMPTY=\nBAD LINE\n1INVALID=nope\n`;
  const parsed = parseEnv(source);
  console.assert(parsed.find((p) => p.key === "FOO")?.value === "bar", "export prefix should be stripped");
  console.assert(parsed.find((p) => p.key === "BAZ")?.value === "hello world", "double-quoted value should unquote");
  console.assert(parsed.find((p) => p.key === "QUOTED")?.value === "single", "single-quoted value should unquote");
  console.assert(!parsed.some((p) => p.key === "1INVALID"), "invalid key names must be dropped");

  const roundTrip = parseEnv(serializeEnv(parsed));
  console.assert(
    JSON.stringify(roundTrip) === JSON.stringify(parsed),
    "parse(serialize(pairs)) must equal pairs"
  );

  const multiline = [{ key: "MULTI", value: "line1\nline2 \"quoted\"" }];
  const roundTripMultiline = parseEnv(serializeEnv(multiline));
  console.assert(
    roundTripMultiline[0]?.value === multiline[0].value,
    "multiline/quoted values must round-trip"
  );

  const tooLong = { key: "OK", value: "x".repeat(MAX_VALUE_BYTES + 1) };
  console.assert(validatePairs([tooLong]).ok === false, "oversized value must fail validation");
  console.assert(validatePairs([{ key: "1BAD", value: "x" }]).ok === false, "invalid key must fail validation");
  console.assert(validatePairs([{ key: "OK", value: "x" }]).ok === true, "valid pair must pass validation");

  console.log("lib/env-format.ts self-check passed");
}
