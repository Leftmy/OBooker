import { normalizeEmail, validatePassword } from '../../src/modules/auth/auth.utils';

describe('AuthUtils Unit Tests', () => {
  describe('normalizeEmail', () => {
    it('should trim trailing spaces and convert to lowercase', () => {
      // Arrange
      const rawEmail = '   Ivan.Petrov@Example.com  ';
      const expectedEmail = 'ivan.petrov@example.com';

      // Act
      const result = normalizeEmail(rawEmail);

      // Assert
      expect(result).toBe(expectedEmail);
    });
  });

  describe('validatePassword', () => {
    it('should return true when password is within 8 to 72 characters', () => {
      // Arrange
      const validPasswordShort = '12345678';
      const validPasswordLong = 'a'.repeat(72);

      // Act
      const isShortValid = validatePassword(validPasswordShort);
      const isLongValid = validatePassword(validPasswordLong);

      // Assert
      expect(isShortValid).toBe(true);
      expect(isLongValid).toBe(true);
    });

    it('should return false when password is too short or too long', () => {
      // Arrange
      const tooShort = '1234567';
      const tooLong = 'a'.repeat(73);

      // Act
      const isShortValid = validatePassword(tooShort);
      const isLongValid = validatePassword(tooLong);

      // Assert
      expect(isShortValid).toBe(false);
      expect(isLongValid).toBe(false);
    });
  });
});