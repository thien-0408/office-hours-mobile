/** One-shot message handed from one auth screen to Login (after register / reset). */
let notice: string | null = null;

export function setAuthNotice(message: string | null): void {
  notice = message;
}

export function consumeAuthNotice(): string | null {
  const m = notice;
  notice = null;
  return m;
}
