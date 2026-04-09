import {
  isPalindrome,
  countWords,
  reverseWords,
  capitalizeWords,
  removeVowels,
  isValidEmail,
} from '../string-helpers';

describe('String Helpers', () => {
  describe('isPalindrome', () => {
    it('should return true for valid palindromes', () => {
      expect(isPalindrome('A man, a plan, a canal: Panama')).toBe(true);
      expect(isPalindrome('racecar')).toBe(true);
      expect(isPalindrome('12321')).toBe(true);
    });

    it('should return false for invalid palindromes', () => {
      expect(isPalindrome('hello')).toBe(false);
      expect(isPalindrome('openai')).toBe(false);
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('hello world')).toBe(2);
      expect(countWords('  extra   spaces  ')).toBe(2);
      expect(countWords('')).toBe(0);
    });
  });

  describe('reverseWords', () => {
    it('should reverse the words in a string', () => {
      expect(reverseWords('hello world')).toBe('world hello');
      expect(reverseWords('a b c')).toBe('c b a');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('javaScript is FUN')).toBe('Javascript Is Fun');
    });
  });

  describe('removeVowels', () => {
    it('should remove all vowels', () => {
      expect(removeVowels('hello world')).toBe('hll wrld');
      expect(removeVowels('AEIOUaeiou')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });
});
