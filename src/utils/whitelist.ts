const DEFAULT_WHITELIST = [
  'elaine.batista1105@gmail.com',
  'edbpmc@gmail.com'
];

/**
 * Checks if a given email is whitelisted.
 * Supports comma-separated override whitelists passed in via launch arguments.
 */
export function isEmailWhitelisted(email: string, authorizedEmailsExtra: string | null): boolean {
  if (!email) return false;
  
  const trimmedEmail = email.trim().toLowerCase();
  
  let whitelist = DEFAULT_WHITELIST;
  
  if (authorizedEmailsExtra) {
    whitelist = authorizedEmailsExtra
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean);
  }
  
  return whitelist.includes(trimmedEmail);
}
