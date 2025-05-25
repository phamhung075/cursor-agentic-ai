import {
	MockServiceRegistry as IMockServiceRegistry,
	MockService
} from '../../types/TestingTypes';

/**
 * Mock Service Registry
 * 
 * Manages mock services for testing, providing service registration,
 * retrieval, and lifecycle management.
 */
export class MockServiceRegistry implements IMockServiceRegistry {
	private services: Map<string, MockService> = new Map();

	/**
	 * Register a mock service
	 */
	public register(service: MockService): void {
		this.services.set(service.name, service);
	}

	/**
	 * Get a mock service by name
	 */
	public get(name: string): MockService | undefined {
		return this.services.get(name);
	}

	/**
	 * Get all registered mock services
	 */
	public getAll(): MockService[] {
		return Array.from(this.services.values());
	}

	/**
	 * Clear all registered services
	 */
	public clear(): void {
		this.services.clear();
	}

	/**
	 * Check if a service is registered
	 */
	public has(name: string): boolean {
		return this.services.has(name);
	}

	/**
	 * Remove a specific service
	 */
	public remove(name: string): boolean {
		return this.services.delete(name);
	}

	/**
	 * Get service count
	 */
	public size(): number {
		return this.services.size;
	}
}