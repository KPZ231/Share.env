export type PasswordRuleKey = "length" | "upper" | "lower" | "number" | "special";

export const PASSWORD_RULES: { key: PasswordRuleKey; test: (v: string) => boolean }[] = [
  { key: "length", test: (v) => v.length >= 12 },
  { key: "upper", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", test: (v) => /[a-z]/.test(v) },
  { key: "number", test: (v) => /[0-9]/.test(v) },
  { key: "special", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function passwordRuleResults(password: string) {
  return PASSWORD_RULES.map((rule) => ({ key: rule.key, passed: rule.test(password) }));
}

export function isPasswordValid(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailValid(email: string) {
  return email.length <= 254 && EMAIL_RE.test(email);
}
