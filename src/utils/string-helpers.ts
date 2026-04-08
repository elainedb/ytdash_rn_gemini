export function isPalindrome(input: string): boolean {
  const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized === normalized.split('').reverse().join('');
}

export function countWords(input: string): number {
  if (!input.trim()) return 0;
  return input.trim().split(/\s+/).length;
}

export function reverseWords(input: string): string {
  if (!input.trim()) return '';
  return input.trim().split(/\s+/).reverse().join(' ');
}

export function capitalizeWords(input: string): string {
  return input.replace(/\b\w/g, char => char.toUpperCase());
}

export function removeVowels(input: string): string {
  return input.replace(/[aeiouAEIOU]/g, '');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
