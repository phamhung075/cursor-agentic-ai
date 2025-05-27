// Set up test environment
import { logger } from '../utils/logger';

// Disable logging during tests
logger.setLevel('none');

// Mock modules if needed
jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  
  return {
    ...originalModule,
    // Add mocks here if needed
  };
}); 