import { initializeEngine } from '../../core';

describe('Core Engine', () => {
  describe('initializeEngine', () => {
    it('should return an initialized engine with correct version', () => {
      // Arrange & Act
      const result = initializeEngine();

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('initialized');
      expect(result.version).toBe('0.1.0');
    });
  });
});
