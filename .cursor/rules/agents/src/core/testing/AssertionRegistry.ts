import { v4 as uuidv4 } from 'uuid';
import {
	AssertionRegistry as IAssertionRegistry,
	TestAssertion,
	AssertionResult,
	AssertionType,
	AssertionOperator
} from '../../types/TestingTypes';

/**
 * Assertion Registry
 * 
 * Provides comprehensive assertion capabilities for testing,
 * including various comparison operators and custom assertions.
 */
export class AssertionRegistry implements IAssertionRegistry {
	private results: AssertionResult[] = [];

	/**
	 * Execute a test assertion
	 */
	public assert(assertion: TestAssertion): AssertionResult {
		const result = this.executeAssertion(assertion);
		this.results.push(result);
		return result;
	}

	/**
	 * Assert equality
	 */
	public assertEquals(actual: any, expected: any, message?: string): AssertionResult {
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'equality',
			description: message || `Expected ${actual} to equal ${expected}`,
			expected,
			actual,
			operator: 'equals',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Assert inequality
	 */
	public assertNotEquals(actual: any, expected: any, message?: string): AssertionResult {
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'inequality',
			description: message || `Expected ${actual} to not equal ${expected}`,
			expected,
			actual,
			operator: 'not_equals',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Assert truthy value
	 */
	public assertTrue(value: any, message?: string): AssertionResult {
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'equality',
			description: message || `Expected ${value} to be truthy`,
			expected: true,
			actual: Boolean(value),
			operator: 'is_truthy',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Assert falsy value
	 */
	public assertFalse(value: any, message?: string): AssertionResult {
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'equality',
			description: message || `Expected ${value} to be falsy`,
			expected: false,
			actual: Boolean(value),
			operator: 'is_falsy',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Assert null value
	 */
	public assertNull(value: any, message?: string): AssertionResult {
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'equality',
			description: message || `Expected ${value} to be null`,
			expected: null,
			actual: value,
			operator: 'is_null',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Assert not null value
	 */
	public assertNotNull(value: any, message?: string): AssertionResult {
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'inequality',
			description: message || `Expected ${value} to not be null`,
			expected: null,
			actual: value,
			operator: 'not_equals',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Assert type
	 */
	public assertType(value: any, type: string, message?: string): AssertionResult {
		const actualType = typeof value;
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'type_check',
			description: message || `Expected ${value} to be of type ${type}`,
			expected: type,
			actual: actualType,
			operator: 'is_type',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Assert contains
	 */
	public assertContains(container: any, item: any, message?: string): AssertionResult {
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'contains',
			description: message || `Expected ${container} to contain ${item}`,
			expected: item,
			actual: container,
			operator: 'contains',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Assert matches pattern
	 */
	public assertMatches(value: string, pattern: RegExp, message?: string): AssertionResult {
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'pattern_match',
			description: message || `Expected ${value} to match pattern ${pattern}`,
			expected: pattern,
			actual: value,
			operator: 'matches',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Custom assertion
	 */
	public custom(predicate: (value: any) => boolean, value: any, message?: string): AssertionResult {
		const passed = predicate(value);
		const assertion: TestAssertion = {
			id: uuidv4(),
			type: 'custom',
			description: message || `Custom assertion for ${value}`,
			expected: true,
			actual: passed,
			operator: 'custom',
			message
		};

		return this.assert(assertion);
	}

	/**
	 * Get all assertion results
	 */
	public getResults(): AssertionResult[] {
		return [...this.results];
	}

	/**
	 * Clear all results
	 */
	public clear(): void {
		this.results = [];
	}

	/**
	 * Get passed assertions count
	 */
	public getPassedCount(): number {
		return this.results.filter(r => r.passed).length;
	}

	/**
	 * Get failed assertions count
	 */
	public getFailedCount(): number {
		return this.results.filter(r => !r.passed).length;
	}

	/**
	 * Execute assertion based on operator
	 */
	private executeAssertion(assertion: TestAssertion): AssertionResult {
		let passed = false;
		let error: string | undefined;

		try {
			switch (assertion.operator) {
				case 'equals':
					passed = this.deepEquals(assertion.actual, assertion.expected);
					break;
				case 'not_equals':
					passed = !this.deepEquals(assertion.actual, assertion.expected);
					break;
				case 'greater_than':
					passed = assertion.actual > assertion.expected;
					break;
				case 'less_than':
					passed = assertion.actual < assertion.expected;
					break;
				case 'greater_equal':
					passed = assertion.actual >= assertion.expected;
					break;
				case 'less_equal':
					passed = assertion.actual <= assertion.expected;
					break;
				case 'contains':
					passed = this.contains(assertion.actual, assertion.expected);
					break;
				case 'not_contains':
					passed = !this.contains(assertion.actual, assertion.expected);
					break;
				case 'matches':
					passed = assertion.expected instanceof RegExp &&
						assertion.expected.test(String(assertion.actual));
					break;
				case 'not_matches':
					passed = assertion.expected instanceof RegExp &&
						!assertion.expected.test(String(assertion.actual));
					break;
				case 'is_type':
					passed = typeof assertion.actual === assertion.expected;
					break;
				case 'is_null':
					passed = assertion.actual === null;
					break;
				case 'is_undefined':
					passed = assertion.actual === undefined;
					break;
				case 'is_truthy':
					passed = Boolean(assertion.actual);
					break;
				case 'is_falsy':
					passed = !Boolean(assertion.actual);
					break;
				case 'custom':
					passed = assertion.actual === true;
					break;
				default:
					passed = false;
					error = `Unknown assertion operator: ${assertion.operator}`;
			}
		} catch (err) {
			passed = false;
			error = err instanceof Error ? err.message : 'Unknown assertion error';
		}

		return {
			assertionId: assertion.id,
			passed,
			expected: assertion.expected,
			actual: assertion.actual,
			message: assertion.description,
			error,
			metadata: assertion.metadata
		};
	}

	/**
	 * Deep equality comparison
	 */
	private deepEquals(a: any, b: any): boolean {
		if (a === b) return true;

		if (a == null || b == null) return a === b;

		if (typeof a !== typeof b) return false;

		if (typeof a === 'object') {
			if (Array.isArray(a) !== Array.isArray(b)) return false;

			if (Array.isArray(a)) {
				if (a.length !== b.length) return false;
				for (let i = 0; i < a.length; i++) {
					if (!this.deepEquals(a[i], b[i])) return false;
				}
				return true;
			}

			const keysA = Object.keys(a);
			const keysB = Object.keys(b);

			if (keysA.length !== keysB.length) return false;

			for (const key of keysA) {
				if (!keysB.includes(key)) return false;
				if (!this.deepEquals(a[key], b[key])) return false;
			}

			return true;
		}

		return false;
	}

	/**
	 * Check if container contains item
	 */
	private contains(container: any, item: any): boolean {
		if (typeof container === 'string') {
			return container.includes(String(item));
		}

		if (Array.isArray(container)) {
			return container.some(element => this.deepEquals(element, item));
		}

		if (typeof container === 'object' && container !== null) {
			return Object.values(container).some(value => this.deepEquals(value, item));
		}

		return false;
	}
}