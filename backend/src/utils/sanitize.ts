/** Strip HTML tags from a string — used before storing plain-text search content */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Truncate a string to a maximum length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/** Normalise email to lowercase and trim whitespace */
export function normaliseEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Normalise username to lowercase and trim whitespace */
export function normaliseUsername(username: string): string {
  return username.toLowerCase().trim();
}
