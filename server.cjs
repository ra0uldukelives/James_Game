const { Server, FlatFile } = require('boardgame.io/server');

// Initialize the storage using FlatFile (persists game state to filesystem)
const db = new FlatFile({ dir: './storage' });

// Start the server
async function startServer() {
  // Use dynamic import to load ES module
  const { Game } = await import('./Game.js');
  
  // Create a server instance with storage
  const server = Server({
    games: [Game],
    db,
    origins: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // Allow CORS from common dev ports
  });

  const PORT = process.env.PORT || 8000;
  server.run(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Storage directory: ./storage`);
    console.log(`CORS origins allowed: http://localhost:5173, http://localhost:3000, http://127.0.0.1:5173`);
    console.log(`Server is ready for connections`);
  });
  
  // Handle uncaught errors to prevent server crashes
  process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    // Don't exit - keep server running
  });
  
  process.on('unhandledRejection', (error) => {
    console.error('[Server] Unhandled Rejection:', error);
    // Don't exit - keep server running
  });
}

startServer().catch(console.error);

