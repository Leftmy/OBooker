export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 72;
}