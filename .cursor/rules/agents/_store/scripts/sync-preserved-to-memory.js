#!/usr/bin/env node

/**
 * 🧠 Sync Preserved Code to AAI Memory
 * 
 * Syncs the preserved code from cleanup to the AAI agent's Pinecone memory
 * so the agent can access and use the preserved functionality
 */

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

class PreservedCodeMemorySync {
  constructor() {
    this.baseDir = process.cwd();
    this.memoryDir = path.join(this.baseDir, '.cursor/rules/agents/_store/memory');
    this.pinecone = null;
    this.index = null;
    this.syncedEntries = [];
  }

  /**
   * Main sync process
   */
  async run() {
    console.log('🧠 SYNCING PRESERVED CODE TO AAI MEMORY');
    console.log('━'.repeat(60));

    try {
      // 1. Initialize Pinecone
      await this.initializePinecone();

      // 2. Load preserved code entries
      const entries = await this.loadPreservedEntries();

      // 3. Sync each entry to Pinecone
      await this.syncEntriesToPinecone(entries);

      // 4. Update sync status
      await this.updateSyncStatus();

      console.log('\n✅ PRESERVED CODE SYNC COMPLETED!');
      console.log('━'.repeat(60));
      this.showSummary();

    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize Pinecone connection
   */
  async initializePinecone() {
    console.log('🔗 Connecting to Pinecone...');

    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY not found in environment');
    }

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    const indexName = 'self-improvement-agent';
    this.index = this.pinecone.index(indexName);

    console.log(`   ✅ Connected to Pinecone index: ${indexName}`);
  }

  /**
   * Load preserved code entries
   */
  async loadPreservedEntries() {
    console.log('📋 Loading preserved code entries...');

    const indexPath = path.join(this.memoryDir, 'index.json');
    if (!fs.existsSync(indexPath)) {
      throw new Error('Memory index not found. Run cleanup first.');
    }

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    console.log(`   📁 Found ${index.totalEntries} preserved entries`);

    const entries = [];
    for (const entry of index.entries) {
      const contentPath = path.join(this.memoryDir, `${entry.filename}.content`);
      const memoryPath = path.join(this.memoryDir, `${entry.filename}.memory.json`);

      if (fs.existsSync(contentPath) && fs.existsSync(memoryPath)) {
        const content = fs.readFileSync(contentPath, 'utf8');
        const metadata = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
        
        entries.push({
          ...metadata,
          content
        });
      }
    }

    console.log(`   ✅ Loaded ${entries.length} entries with content`);
    return entries;
  }

  /**
   * Sync entries to Pinecone
   */
  async syncEntriesToPinecone(entries) {
    console.log('🔄 Syncing entries to Pinecone memory...');

    for (const entry of entries) {
      await this.syncSingleEntry(entry);
    }

    console.log(`   ✅ Synced ${this.syncedEntries.length} entries to Pinecone`);
  }

  /**
   * Sync a single entry to Pinecone
   */
  async syncSingleEntry(entry) {
    try {
      // Create embedding-ready text
      const embeddingText = this.createEmbeddingText(entry);
      
      // Create vector entry
      const vectorEntry = {
        id: `preserved-${entry.filename}-${Date.now()}`,
        values: await this.createEmbedding(embeddingText),
        metadata: {
          type: 'preserved-code',
          filename: entry.filename,
          originalPath: entry.originalPath,
          preservedAt: entry.preservedAt,
          functions: entry.functions.join(', '),
          keyFeatures: entry.keyFeatures.join(', '),
          description: entry.description,
          size: entry.size,
          content: entry.content.substring(0, 8000), // Limit content size
          timestamp: new Date().toISOString()
        }
      };

      // Upsert to Pinecone
      await this.index.upsert([vectorEntry]);
      
      this.syncedEntries.push({
        filename: entry.filename,
        id: vectorEntry.id,
        functions: entry.functions.length,
        features: entry.keyFeatures.length
      });

      console.log(`   💾 Synced: ${entry.filename} (${entry.functions.length} functions)`);

    } catch (error) {
      console.warn(`   ⚠️ Failed to sync ${entry.filename}: ${error.message}`);
    }
  }

  /**
   * Create embedding-ready text
   */
  createEmbeddingText(entry) {
    return `
PRESERVED CODE: ${entry.filename}
ORIGINAL PATH: ${entry.originalPath}
DESCRIPTION: ${entry.description}
FUNCTIONS: ${entry.functions.join(', ')}
KEY FEATURES: ${entry.keyFeatures.join(', ')}
DEPENDENCIES: ${entry.dependencies.join(', ')}

CODE CONTENT:
${entry.content}
    `.trim();
  }

  /**
   * Create embedding (simplified - using text length as proxy)
   */
  async createEmbedding(text) {
    // This is a simplified embedding - in production you'd use OpenAI embeddings
    // For now, create a simple vector based on text characteristics
    const vector = new Array(1536).fill(0);
    
    // Simple hash-based vector generation
    for (let i = 0; i < text.length && i < 1536; i++) {
      vector[i % 1536] += text.charCodeAt(i) / 1000;
    }
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  /**
   * Update sync status
   */
  async updateSyncStatus() {
    const status = {
      lastSync: new Date().toISOString(),
      totalEntriesSynced: this.syncedEntries.length,
      syncedEntries: this.syncedEntries,
      pineconeIndex: 'self-improvement-agent',
      syncType: 'preserved-code'
    };

    const statusPath = path.join(this.memoryDir, 'pinecone-sync-status.json');
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));

    console.log('   📊 Updated sync status');
  }

  /**
   * Show summary
   */
  showSummary() {
    console.log('📊 SYNC SUMMARY:');
    console.log(`   💾 Entries synced: ${this.syncedEntries.length}`);
    console.log(`   🔧 Total functions preserved: ${this.syncedEntries.reduce((sum, e) => sum + e.functions, 0)}`);
    console.log(`   ✨ Total features preserved: ${this.syncedEntries.reduce((sum, e) => sum + e.features, 0)}`);
    console.log('');
    console.log('🎯 PRESERVED CODE NOW AVAILABLE TO AAI AGENT:');
    this.syncedEntries.forEach(entry => {
      console.log(`   📄 ${entry.filename} (${entry.functions} functions)`);
    });
    console.log('');
    console.log('✅ Your AAI agent can now access all preserved functionality!');
  }
}

// CLI execution
if (require.main === module) {
  const sync = new PreservedCodeMemorySync();
  
  const command = process.argv[2];
  
  if (command === 'status') {
    // Show sync status
    const statusPath = path.join(process.cwd(), '.cursor/rules/agents/_store/memory/pinecone-sync-status.json');
    if (fs.existsSync(statusPath)) {
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      console.log('🧠 PRESERVED CODE SYNC STATUS');
      console.log('━'.repeat(40));
      console.log(`Last sync: ${new Date(status.lastSync).toLocaleString()}`);
      console.log(`Entries synced: ${status.totalEntriesSynced}`);
      console.log(`Pinecone index: ${status.pineconeIndex}`);
      console.log('\nSynced entries:');
      status.syncedEntries.forEach(entry => {
        console.log(`  📄 ${entry.filename} (ID: ${entry.id})`);
      });
    } else {
      console.log('❌ No sync status found. Run sync first.');
    }
  } else {
    sync.run().catch(error => {
      console.error('💥 Sync failed:', error.message);
      process.exit(1);
    });
  }
}

module.exports = PreservedCodeMemorySync; 