import { normalizeEmail } from '../../src/modules/auth/auth.utils';

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
});