import { CSRF_COOKIE } from './securityShared';

export function getCsrfTokenFromCookie() {
  if (typeof document === 'undefined') return '';
  const cookies = document.cookie.split(';').map(part => part.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${CSRF_COOKIE}=`)) {
      return decodeURIComponent(cookie.slice(CSRF_COOKIE.length + 1));
    }
  }
  return '';
}
