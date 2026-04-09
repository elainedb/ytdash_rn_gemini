export const isPalindrome = (input: string): boolean => {
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return cleaned === cleaned.split('').reverse().join('');
};

export const countWords = (input: string): number => {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

export const reverseWords = (input: string): string => {
  return input.split(/\s+/).reverse().join(' ');
};

export const capitalizeWords = (input: string): string => {
  return input.split(/\s+/).map(word => {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

export const removeVowels = (input: string): string => {
  return input.replace(/[aeiouAEIOU]/g, '');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
