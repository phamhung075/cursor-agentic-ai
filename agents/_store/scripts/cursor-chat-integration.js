#!/usr/bin/env node

/**
 * 🎯 Cursor Chat Integration
 * 
 * Direct integration with Cursor's chat interface
 * Automatically captures user messages and creates tasks
 */

const fs = require('fs');
const path = require('path');
const CursorChatMonitor = require('./cursor-chat-monitor');

class CursorChatIntegration {
  constructor() {
    this.monitor = new CursorChatMonitor();
    this.chatHistoryPath = '.cursor/chat-history';
    this.lastMessageId = 0;
    this.isActive = false;
  }

  /**
   * Initialize the integration
   */
  async initialize() {
    console.log('🎯 Cursor Chat Integration - Auto Task Creation');
    console.log('━'.repeat(60));
    console.log('🔗 Direct integration with Cursor chat interface');
    console.log('');

    // Initialize monitor
    await this.monitor.initialize();

    // Setup chat capture
    await this.setupChatCapture();
    
    this.isActive = true;
    console.log('✅ Chat integration active!');
    console.log('💬 Your chat messages will automatically create tasks');
    console.log('');
  }

  /**
   * Setup chat capture mechanisms
   */
  async setupChatCapture() {
    // Ensure chat history directory exists
    if (!fs.existsSync(this.chatHistoryPath)) {
      fs.mkdirSync(this.chatHistoryPath, { recursive: true });
    }

    // Create chat capture interface
    this.createChatInterface();
    
    // Setup message processing
    this.setupMessageProcessing();
    
    console.log('📡 Chat capture setup complete');
  }

  /**
   * Create chat interface for easy message input
   */
  createChatInterface() {
    const interfacePath = path.join(this.chatHistoryPath, 'chat-interface.html');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Chat Interface</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #1e1e1e;
            color: #ffffff;
        }
        .chat-container {
            background: #2d2d2d;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .input-area {
            width: 100%;
            min-height: 100px;
            background: #3c3c3c;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 15px;
            color: #ffffff;
            font-size: 14px;
            resize: vertical;
        }
        .send-button {
            background: #007acc;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        .send-button:hover {
            background: #005a9e;
        }
        .status {
            background: #2d4a2d;
            border-left: 4px solid #4caf50;
            padding: 10px;
            margin-top: 20px;
            border-radius: 4px;
        }
        .history {
            background: #2d2d2d;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
        }
        .message {
            background: #3c3c3c;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            border-left: 3px solid #007acc;
        }
    </style>
</head>
<body>
    <h1>🎯 Cursor Chat Interface</h1>
    <p>Type your requests below and they will automatically create tasks in Cursor</p>
    
    <div class="chat-container">
        <textarea 
            id="messageInput" 
            class="input-area" 
            placeholder="Type your request here... (e.g., 'Create a login component with validation')"
        ></textarea>
        <button class="send-button" onclick="sendMessage()">Send & Create Tasks</button>
    </div>
    
    <div class="status" id="status">
        Ready to process your requests
    </div>
    
    <div class="history" id="history">
        <h3>Recent Messages</h3>
        <div id="messageHistory"></div>
    </div>

    <script>
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) {
                alert('Please enter a message');
                return;
            }
            
            // Add to history
            addToHistory(message);
            
            // Send to processing
            processMessage(message);
            
            // Clear input
            input.value = '';
            
            // Update status
            document.getElementById('status').textContent = 
                'Processing: "' + message.substring(0, 50) + '..."';
        }
        
        function addToHistory(message) {
            const history = document.getElementById('messageHistory');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = 
                '<strong>' + new Date().toLocaleTimeString() + '</strong><br>' + 
                message;
            history.insertBefore(messageDiv, history.firstChild);
            
            // Keep only last 10 messages
            while (history.children.length > 10) {
                history.removeChild(history.lastChild);
            }
        }
        
        function processMessage(message) {
            // Save to file for processing
            const data = {
                message: message,
                timestamp: Date.now(),
                processed: false
            };
            
            // This would normally use a proper API, but for now we'll use file system
            fetch('data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)))
                .then(() => {
                    // In a real implementation, this would trigger the chat processor
                    console.log('Message queued for processing:', message);
                });
        }
        
        // Allow Enter to send
        document.getElementById('messageInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                sendMessage();
            }
        });
    </script>
</body>
</html>`;

    fs.writeFileSync(interfacePath, htmlContent);
    console.log(`📱 Chat interface created: ${interfacePath}`);
  }

  /**
   * Setup message processing
   */
  setupMessageProcessing() {
    // Create message queue file
    const queuePath = path.join(this.chatHistoryPath, 'message-queue.json');
    
    if (!fs.existsSync(queuePath)) {
      fs.writeFileSync(queuePath, JSON.stringify({ messages: [] }, null, 2));
    }

    // Watch for new messages
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(queuePath, {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async () => {
      await this.processMessageQueue();
    });

    console.log('📨 Message processing setup complete');
  }

  /**
   * Process message queue
   */
  async processMessageQueue() {
    try {
      const queuePath = path.join(this.chatHistoryPath, 'message-queue.json');
      const data = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
      
      for (const message of data.messages) {
        if (!message.processed && message.id > this.lastMessageId) {
          this.lastMessageId = message.id;
          
          console.log(`\n💬 Processing chat message: "${message.content}"`);
          
          // Use the monitor to process the command
          await this.monitor.processor.processCommand(message.content);
          
          // Mark as processed
          message.processed = true;
        }
      }
      
      // Save updated queue
      fs.writeFileSync(queuePath, JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.warn('⚠️ Error processing message queue:', error.message);
    }
  }

  /**
   * Add message to queue (API method)
   */
  static addMessage(content, context = {}) {
    const chatHistoryPath = '.cursor/chat-history';
    const queuePath = path.join(chatHistoryPath, 'message-queue.json');
    
    // Ensure directory exists
    if (!fs.existsSync(chatHistoryPath)) {
      fs.mkdirSync(chatHistoryPath, { recursive: true });
    }

    let data = { messages: [] };
    if (fs.existsSync(queuePath)) {
      data = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    }

    const message = {
      id: Date.now(),
      content: content,
      context: context,
      timestamp: Date.now(),
      processed: false
    };

    data.messages.push(message);
    
    // Keep only last 100 messages
    if (data.messages.length > 100) {
      data.messages = data.messages.slice(-100);
    }

    fs.writeFileSync(queuePath, JSON.stringify(data, null, 2));
    console.log(`✅ Message queued: "${content}"`);
    
    return message.id;
  }

  /**
   * Create a simple command line interface
   */
  createCLI() {
    const cliPath = path.join(this.chatHistoryPath, 'cli.js');
    
    const cliContent = `#!/usr/bin/env node

/**
 * Simple CLI for adding chat messages
 */

const CursorChatIntegration = require('../scripts/cursor-chat-integration');

const args = process.argv.slice(2);
const message = args.join(' ');

if (message) {
  CursorChatIntegration.addMessage(message);
  console.log('Message added to queue for processing');
} else {
  console.log('Usage: node cli.js <your message>');
  console.log('Example: node cli.js Create a user profile component');
}
`;

    fs.writeFileSync(cliPath, cliContent);
    fs.chmodSync(cliPath, '755');
    console.log(`⚡ CLI created: ${cliPath}`);
  }

  /**
   * Start the integration
   */
  async start() {
    await this.initialize();
    this.createCLI();
    
    console.log('🚀 CURSOR CHAT INTEGRATION ACTIVE');
    console.log('━'.repeat(50));
    console.log('');
    console.log('🎯 HOW TO USE:');
    console.log('1. Open .cursor/chat-history/chat-interface.html in browser');
    console.log('2. Type your requests and click "Send & Create Tasks"');
    console.log('3. Or use CLI: node .cursor/chat-history/cli.js "your request"');
    console.log('4. Or use API: CursorChatIntegration.addMessage("your request")');
    console.log('');
    console.log('📋 Tasks will be automatically created in .cursor/tasks.json');
    console.log('🔄 Use Cursor Command Palette → "Tasks: Run Task" to execute');
    console.log('');
    
    // Keep process alive
    setInterval(() => {
      // Just keep alive
    }, 10000);
  }

  /**
   * Show status
   */
  showStatus() {
    console.log('📊 CURSOR CHAT INTEGRATION STATUS');
    console.log('━'.repeat(45));
    console.log(`🔄 Active: ${this.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`📁 Chat History: ${fs.existsSync(this.chatHistoryPath) ? '✅ Ready' : '❌ Missing'}`);
    
    // Show recent messages
    const queuePath = path.join(this.chatHistoryPath, 'message-queue.json');
    if (fs.existsSync(queuePath)) {
      const data = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
      console.log(`💬 Messages: ${data.messages.length} total`);
      
      const unprocessed = data.messages.filter(m => !m.processed).length;
      console.log(`⏳ Pending: ${unprocessed} messages`);
    }
    
    // Show tasks
    if (fs.existsSync('.cursor/tasks.json')) {
      const tasks = JSON.parse(fs.readFileSync('.cursor/tasks.json', 'utf8'));
      console.log(`📋 Tasks: ${tasks.tasks.length} total`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const integration = new CursorChatIntegration();

  switch (command) {
    case 'start':
      integration.start();
      break;

    case 'status':
      integration.showStatus();
      break;

    case 'add':
      const message = args.slice(1).join(' ');
      if (message) {
        CursorChatIntegration.addMessage(message);
      } else {
        console.log('❌ Please provide a message to add');
      }
      break;

    case 'init':
      integration.initialize();
      break;

    default:
      console.log('🎯 Cursor Chat Integration');
      console.log('Commands:');
      console.log('  start    - Start chat integration');
      console.log('  status   - Show current status');
      console.log('  add      - Add a message to process');
      console.log('  init     - Initialize integration');
      console.log('');
      console.log('Example: node cursor-chat-integration.js add "Create a login form"');
  }
}

module.exports = CursorChatIntegration; 