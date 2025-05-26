import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

/**
 * DatabaseService - Singleton service to manage the database connection
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database | null = null;
  private drizzleDb: ReturnType<typeof drizzle> | null = null;
  private dbPath: string;
  private migrationsPath: string;

  private constructor() {
    // Default database path - will be overridden in initialize()
    this.dbPath = path.resolve(process.cwd(), 'data', 'tasks.db');
    this.migrationsPath = path.resolve(process.cwd(), 'drizzle');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize the database with the given configuration
   */
  public async initialize(options: { 
    dbPath?: string;
    migrationsPath?: string;
    runMigrations?: boolean;
  } = {}): Promise<void> {
    if (this.db) {
      return; // Already initialized
    }

    if (options.dbPath) {
      this.dbPath = options.dbPath;
    }
    
    if (options.migrationsPath) {
      this.migrationsPath = options.migrationsPath;
    }

    // Ensure the directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize the SQLite database
    this.db = new Database(this.dbPath);
    this.drizzleDb = drizzle(this.db, { schema });

    // Run migrations if needed
    if (options.runMigrations && fs.existsSync(this.migrationsPath)) {
      await this.runMigrations();
    }
  }

  /**
   * Run database migrations
   */
  public async runMigrations(): Promise<void> {
    if (!this.drizzleDb || !this.db) {
      throw new Error('Database not initialized');
    }

    migrate(this.drizzleDb, { migrationsFolder: this.migrationsPath });
  }

  /**
   * Get the Drizzle ORM instance
   */
  public getDb(): ReturnType<typeof drizzle> {
    if (!this.drizzleDb) {
      throw new Error('Database not initialized');
    }
    return this.drizzleDb;
  }

  /**
   * Get the underlying SQLite database instance
   */
  public getSqliteDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.drizzleDb = null;
    }
  }
}

// Export default instance
export default DatabaseService.getInstance(); 