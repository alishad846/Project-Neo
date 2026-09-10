import { z } from "zod";
export const PASSWORD_MIN = 8;
export interface PasswordChecks { length: boolean; lower: boolean; upper: boolean; digit: boolean; symbol: boolean; }
export function checkPassword(pw: string): PasswordChecks {
  return {
    length: pw.length >= PASSWORD_MIN,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}
export function isPasswordValid(pw: string): boolean {
  const c = checkPassword(pw);
  return c.length && c.lower && c.upper && c.digit;
}
export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  const c = checkPassword(pw);
  let s = [c.lower, c.upper, c.digit, c.symbol].filter(Boolean).length; // 0..4 classes
  if (c.length && pw.length >= 12) s = Math.min(4, s + 1);
  if (!c.length) s = Math.min(s, 1);                                    // too short caps at Weak/Fair
  return Math.max(0, Math.min(4, s)) as 0 | 1 | 2 | 3 | 4;
}
export const PASSWORD_MESSAGE =
  "Password needs 8+ characters with an uppercase letter, a lowercase letter, and a number.";
export const passwordSchema = z.string().refine(isPasswordValid, { message: PASSWORD_MESSAGE });
