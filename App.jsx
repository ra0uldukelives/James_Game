import React from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { Game } from './Game';
import Board from './Board';

function App() {
  // Get matchID, playerID, and numPlayers directly from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  let matchID = urlParams.get('matchID');
  const playerID = urlParams.get('playerID') || '0';
  // Support 2-4 players (default to 2 for backward compatibility)
  const numPlayers = Math.min(Math.max(parseInt(urlParams.get('numPlayers') || '2'), 2), 4);
  // Check for debug parameter in URL
  const debug = urlParams.get('debug') === 'true';

  const AppClient = Client({
    game: Game,
    board: Board,
    numPlayers: numPlayers,
    multiplayer: SocketIO({ server: 'localhost:8000' }), // Connect to boardgame.io server
    debug: debug, // Enable debug panel when &debug=true is in URL
  });
  
  // If no matchID provided, generate a unique one (timestamp-based)
  // This ensures each new game session gets a fresh state
  if (!matchID) {
    matchID = `match-${Date.now()}`;
  }
  
  const showSetup = !urlParams.get('matchID') && !urlParams.get('playerID');

  // Show connection instructions if no URL params
  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-8 flex items-center justify-center">
        <div className="bg-black bg-opacity-40 rounded-lg p-8 max-w-3xl">
          <h1 className="text-3xl font-bold text-white mb-4">Multiplayer Game Setup</h1>
          <div className="text-white space-y-4">
            <p className="text-lg">This game supports 2, 3, or 4 players.</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Start the server: <code className="bg-gray-800 px-2 py-1 rounded">npm run server</code></li>
              <li>Open browser windows/tabs for each player (or use Chrome + Firefox + Edge)</li>
              <li className="text-yellow-300 mt-2">
                <strong>IMPORTANT:</strong> All players MUST use the SAME matchID and numPlayers, but DIFFERENT playerID values (0, 1, 2, or 3). Using different matchIDs or numPlayers puts you in separate games!
              </li>
              <li className="text-yellow-300">
                Use a unique matchID (like "game1", "game2") for each new game. The same matchID will load the previous game state.
              </li>
            </ol>
            
            {/* Player Count Selection */}
            <div className="mt-6 p-4 bg-purple-900 bg-opacity-50 rounded">
              <p className="font-semibold mb-3 text-lg">Select Number of Players:</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      const newMatchID = `match-${Date.now()}`;
                      window.location.href = `?matchID=${newMatchID}&playerID=0&numPlayers=${count}`;
                    }}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transform transition hover:scale-105"
                  >
                    {count} Players
                  </button>
                ))}
              </div>
            </div>

            {/* Example URLs */}
            <div className="mt-6 p-4 bg-blue-900 bg-opacity-50 rounded">
              <p className="font-semibold mb-2">Example URLs for 2 Players:</p>
              <div className="text-sm space-y-1">
                <div>Player 0: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=0&numPlayers=2</code></div>
                <div>Player 1: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=1&numPlayers=2</code></div>
              </div>
              <p className="font-semibold mb-2 mt-4">Example URLs for 3 Players:</p>
              <div className="text-sm space-y-1">
                <div>Player 0: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=0&numPlayers=3</code></div>
                <div>Player 1: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=1&numPlayers=3</code></div>
                <div>Player 2: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=2&numPlayers=3</code></div>
              </div>
              <p className="font-semibold mb-2 mt-4">Example URLs for 4 Players:</p>
              <div className="text-sm space-y-1">
                <div>Player 0: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=0&numPlayers=4</code></div>
                <div>Player 1: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=1&numPlayers=4</code></div>
                <div>Player 2: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=2&numPlayers=4</code></div>
                <div>Player 3: <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/?matchID=game1&playerID=3&numPlayers=4</code></div>
              </div>
            </div>

            {/* Quick Start Buttons */}
            <div className="mt-6 p-4 bg-green-900 bg-opacity-50 rounded">
              <p className="font-semibold mb-2">Quick Start - Create New 2-Player Game:</p>
              <p className="text-sm text-gray-300 mb-3">
                Click a button to generate a new matchID, then open the other player's URL in a new tab with the same matchID.
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const newMatchID = `match-${Date.now()}`;
                    window.location.href = `?matchID=${newMatchID}&playerID=0&numPlayers=2`;
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  New Game as Player 0 (2P)
                </button>
                <button
                  onClick={() => {
                    const newMatchID = `match-${Date.now()}`;
                    window.location.href = `?matchID=${newMatchID}&playerID=1&numPlayers=2`;
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  New Game as Player 1 (2P)
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-red-900 bg-opacity-50 rounded">
              <p className="text-sm font-semibold mb-1">To Clear All Saved Games:</p>
              <p className="text-xs text-gray-300">Run: <code className="bg-gray-800 px-2 py-1 rounded">npm run clear-storage</code></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <AppClient 
        matchID={matchID} 
        playerID={playerID}
      />
    </div>
  );
}

export default App;

