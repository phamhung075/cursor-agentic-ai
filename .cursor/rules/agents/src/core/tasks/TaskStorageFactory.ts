import { TaskStorageService } from './TaskStorageService';
import { DrizzleTaskStorageService } from './DrizzleTaskStorageService';
import { SupabaseTaskStorageService } from './SupabaseTaskStorageService';

/**
 * StorageType - Enum for different storage types
 */
export enum StorageType {
  SQLITE = 'sqlite',
  SUPABASE = 'supabase'
}

/**
 * TaskStorageFactory - Factory for creating TaskStorageService instances
 * This factory helps seamlessly switch between SQLite (local) and Supabase (cloud) storage
 */
export class TaskStorageFactory {
  private static instance: TaskStorageFactory;
  private storageInstance: TaskStorageService | null = null;
  private storageType: StorageType = StorageType.SQLITE;

  private constructor() {}

  /**
   * Get the singleton factory instance
   */
  public static getInstance(): TaskStorageFactory {
    if (!TaskStorageFactory.instance) {
      TaskStorageFactory.instance = new TaskStorageFactory();
    }
    return TaskStorageFactory.instance;
  }

  /**
   * Initialize the storage service
   */
  public async initialize(options: {
    storageType?: StorageType;
    supabaseUrl?: string;
    supabaseKey?: string;
    sqliteDbPath?: string;
  } = {}): Promise<TaskStorageService> {
    // Set storage type from options or environment
    this.storageType = options.storageType || 
      (process.env['STORAGE_TYPE'] === 'supabase' ? StorageType.SUPABASE : StorageType.SQLITE);

    // Create the appropriate storage service
    if (this.storageType === StorageType.SUPABASE) {
      const supabaseStorage = new SupabaseTaskStorageService();
      await supabaseStorage.initialize({
        supabaseUrl: options.supabaseUrl,
        supabaseKey: options.supabaseKey
      });
      this.storageInstance = supabaseStorage;
    } else {
      const drizzleStorage = new DrizzleTaskStorageService();
      await drizzleStorage.initialize({
        dbPath: options.sqliteDbPath,
        runMigrations: true
      });
      this.storageInstance = drizzleStorage;
    }

    return this.storageInstance;
  }

  /**
   * Get the configured storage service
   */
  public getStorageService(): TaskStorageService {
    if (!this.storageInstance) {
      throw new Error('TaskStorageFactory not initialized. Call initialize() first.');
    }
    return this.storageInstance;
  }

  /**
   * Get the current storage type
   */
  public getStorageType(): StorageType {
    return this.storageType;
  }
}

// Export default instance
export default TaskStorageFactory.getInstance(); 