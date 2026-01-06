import { INVALID_MOVE } from 'boardgame.io/dist/esm/core.js';

// Card Types
export const CARD_TYPES = {
  RESOURCE: 'resource',
  ALLY: 'ally',
  RELIC: 'relic',
};

// Resource Types
export const RESOURCE_TYPES = {
  ENERGY_CELL: 'energy_cell',
  FUSION_FRAGMENT: 'fusion_fragment',
};

// Ally Subtypes
export const ALLY_SUBTYPES = {
  EFFICIENT: 'efficient',
  ATTACK: 'attack',
  SHIELD: 'shield',
  POWERFUL: 'powerful', // Non-Efficient subtype
};

// Card Definitions
const createCard = (id, name, type, cost, properties = {}) => ({
  id,
  name,
  type,
  cost,
  ...properties,
});

// CARDS Constant - All card definitions
export const CARDS = {
  // Resources
  RESOURCES: {
    ENERGY_CELL: {
      name: 'Energy Cell',
      type: CARD_TYPES.RESOURCE,
      cost: 0,
      resourceType: RESOURCE_TYPES.ENERGY_CELL,
      energyValue: 1,
    },
    FUSION_FRAGMENT: {
      name: 'Fusion Fragment',
      type: CARD_TYPES.RESOURCE,
      cost: 0,
      resourceType: RESOURCE_TYPES.FUSION_FRAGMENT,
      victoryPoints: 2,
    },
  },
  
  // Allies - Official Begin Set from Dust to Dust rules
  ALLIES: [
    { name: 'Wellspring Portal', subtype: 'Efficient', cost: 2, energyGenerated: 0, isShield: false, ability: 'Draw until you have 4 cards in hand' },
    { name: 'Ferntip Hare', subtype: 'Efficient', cost: 2, energyGenerated: 1, isShield: false, ability: 'Retrieve 1 Energy Coin from the Dust' },
    { name: 'Fuseforge Blacksmith', subtype: 'Efficient', cost: 3, energyGenerated: 1, isShield: false, ability: 'Discard Fusion Fragment for +2 Energy' },
    { name: 'Machboot Chaser', subtype: 'Efficient', cost: 3, energyGenerated: 0, isShield: false, ability: 'Attack: Opponent discards 1, You draw 1', victoryPoints: 1 },
    { name: 'Barrelhorn Rhino', subtype: 'Powerful', cost: 4, energyGenerated: 2, isShield: true, ability: '', victoryPoints: 1 },
    { name: 'Warhino General', subtype: 'Powerful', cost: 4, energyGenerated: 1, isShield: true, ability: 'Attack: Dust opponent card OR Retrieve 1', victoryPoints: 1 },
    { name: 'Fusegate Keeper', subtype: 'Efficient', cost: 4, energyGenerated: 0, isShield: false, ability: 'Draw 1; Next Powerful card is Efficient' },
    { name: 'Poisonhand Chancellor', subtype: 'Powerful', cost: 5, energyGenerated: 1, isShield: false, ability: 'Attack: All discard 1, Draw 1' },
    { name: 'Dustseeker Drones', subtype: 'Efficient', cost: 6, energyGenerated: 1, isShield: false, ability: 'Attack: Dust opponent card, Draw 1' },
    { name: 'Thistledown Hawk', subtype: 'Efficient', cost: 6, energyGenerated: 1, isShield: false, ability: 'Retrieve 2 from Dust' },
  ],
};

// Helper functions to create cards from CARDS constant
const createEnergyCell = (id) => createCard(
  id,
  CARDS.RESOURCES.ENERGY_CELL.name,
  CARDS.RESOURCES.ENERGY_CELL.type,
  CARDS.RESOURCES.ENERGY_CELL.cost,
  { 
    resourceType: CARDS.RESOURCES.ENERGY_CELL.resourceType,
    energyValue: CARDS.RESOURCES.ENERGY_CELL.energyValue
  }
);

const createFusionFragment = (id) => createCard(
  id,
  CARDS.RESOURCES.FUSION_FRAGMENT.name,
  CARDS.RESOURCES.FUSION_FRAGMENT.type,
  CARDS.RESOURCES.FUSION_FRAGMENT.cost,
  { 
    resourceType: CARDS.RESOURCES.FUSION_FRAGMENT.resourceType,
    victoryPoints: CARDS.RESOURCES.FUSION_FRAGMENT.victoryPoints
  }
);

// Ally Cards - Template for creating different ally types
const createAlly = (id, name, cost, subtype, properties = {}) => createCard(
  id,
  name,
  CARD_TYPES.ALLY,
  cost,
  { subtype, ...properties }
);

// Create Market with 12 stacks: 10 Ally stacks + 8 Fusion Fragments + 10 Energy Cells
const createMarket = () => {
  let cardId = 1000; // Start IDs for market cards
  const market = [];

  // Create 10 Ally stacks (5 copies each)
  CARDS.ALLIES.forEach((allyDef, stackIndex) => {
    const stack = [];
    // Map subtype string to ALLY_SUBTYPES constant
    let mappedSubtype = ALLY_SUBTYPES.EFFICIENT; // Default
    if (allyDef.subtype === 'Efficient') {
      mappedSubtype = ALLY_SUBTYPES.EFFICIENT;
    } else if (allyDef.subtype === 'Powerful') {
      mappedSubtype = ALLY_SUBTYPES.POWERFUL;
    } else if (allyDef.subtype === ALLY_SUBTYPES.ATTACK) {
      mappedSubtype = ALLY_SUBTYPES.ATTACK;
    } else if (allyDef.subtype === ALLY_SUBTYPES.SHIELD) {
      mappedSubtype = ALLY_SUBTYPES.SHIELD;
    }
    
    // Note: We preserve the original subtype (Efficient/Powerful) even if isShield is true
    // This allows us to correctly determine if the card requires an Ally Action
    // The isShield property is used separately to determine if it can be played as a shield
    
    for (let i = 0; i < 5; i++) {
      stack.push(createAlly(
        cardId++, 
        allyDef.name, 
        allyDef.cost, 
        mappedSubtype,
        {
          energyGenerated: allyDef.energyGenerated || 0,
          isShield: allyDef.isShield || false,
          ability: allyDef.ability || '',
          victoryPoints: allyDef.victoryPoints,
        }
      ));
    }
    market.push({
      stackId: stackIndex,
      cards: stack,
      cardName: allyDef.name,
      cost: allyDef.cost,
      subtype: mappedSubtype,
      cardType: CARD_TYPES.ALLY,
    });
  });

  // Add Fusion Fragment stack (Cost 3, 2 VP) - Market resource
  const fusionStack = [];
  for (let i = 0; i < 8; i++) {
    const fragment = createFusionFragment(cardId++);
    fragment.cost = 3; // Market cost is 3, not 0
    fusionStack.push(fragment);
  }
  market.push({
    stackId: 10,
    cards: fusionStack,
    cardName: CARDS.RESOURCES.FUSION_FRAGMENT.name,
    cost: 3, // Market cost
    cardType: CARD_TYPES.RESOURCE,
    resourceType: RESOURCE_TYPES.FUSION_FRAGMENT,
  });

  // Add Energy Cell stack (10 copies)
  const energyStack = [];
  for (let i = 0; i < 10; i++) {
    const energyCell = createEnergyCell(cardId++);
    energyCell.cost = 1; // Market cost is 1, not 0
    energyStack.push(energyCell);
  }
  market.push({
    stackId: 11,
    cards: energyStack,
    cardName: CARDS.RESOURCES.ENERGY_CELL.name,
    cost: 1, // Market cost
    cardType: CARD_TYPES.RESOURCE,
    resourceType: RESOURCE_TYPES.ENERGY_CELL,
  });

  return market;
};

// Relic Cards (powerful cards that don't go in deck)
// All Relics: Cost 8 energy, 5 victory points, force Dust 1 card from hand at start of turn
const createRelic = (id, name, ability, energyGenerated = 0) => createCard(
  id,
  name,
  CARD_TYPES.RELIC,
  8, // All relics cost 8 energy
  { 
    ability,
    energyGenerated, // Some relics generate energy, some don't
    victoryPoints: 5, // All relics worth 5 VP
  }
);

const createRelics = () => {
  // Relic definitions from Relics.csv
  const relicDefinitions = [
    {
      name: 'The Gatekey',
      ability: 'Dust 1 card from your hand. Make the first Ally you play each turn Efficient.',
      energyGenerated: 1,
    },
    {
      name: 'The Metaltree',
      ability: 'Dust 1 card from your hand. Gain 1 Energy Coin per Relic you have acquired.',
      energyGenerated: 0, // Variable - calculated dynamically
    },
    {
      name: 'The Skrysword',
      ability: 'Dust 1 card from your hand. Look at the top card of your deck. You may dust or discard it, then draw 1 card.',
      energyGenerated: 0,
    },
    {
      name: "The Founder's Ring",
      ability: 'Dust 1 card from your hand. Increase your starting hand size to 6 cards.',
      energyGenerated: 0,
    },
    {
      name: 'The Satellite',
      ability: 'Dust 1 card from your hand. This Relic shields you from the first attack that would harm you each round.',
      energyGenerated: 0,
    },
    {
      name: 'The Nobel Cloak',
      ability: 'Dust 1 card from your hand. Increase your minimum hand size to 4 cards.',
      energyGenerated: 1,
    },
    {
      name: 'The Overclock',
      ability: 'Dust 1 card from your hand. You may play a second Powerful Ally each turn.',
      energyGenerated: 0,
    },
    {
      name: 'The Chronograph',
      ability: 'Dust 1 card from your hand. Recall 1 card from your discard pile.',
      energyGenerated: 0,
    },
    {
      name: 'The Machwings',
      ability: 'Dust 1 card from your hand. You may retrieve 1 card with a different name from any cards you dust for Relic effects this turn.',
      energyGenerated: 0,
    },
    {
      name: 'The Orderhelm',
      ability: 'Dust 1 card from your hand. When you acquire this Relic, you may recruit any number of allies that have a total combined cost of 7 or less.',
      energyGenerated: 0,
    },
  ];
  
  let cardId = 2000; // Start IDs for relics
  return relicDefinitions.map(relic => createRelic(cardId++, relic.name, relic.ability, relic.energyGenerated));
};

// Starting deck for players (8 Energy Cells + 2 Fusion Fragments = 10 cards)
const createStartingDeck = (playerId) => {
  const deck = [];
  let cardId = playerId * 100; // Unique IDs per player
  
  // Add 8 Energy Cells
  for (let i = 0; i < 8; i++) {
    deck.push(createEnergyCell(cardId++));
  }
  
  // Add 2 Fusion Fragments
  for (let i = 0; i < 2; i++) {
    deck.push(createFusionFragment(cardId++));
  }
  
  return deck;
};

// Fisher-Yates shuffle algorithm for proper randomization
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to move a card to The Dust
const moveToDust = (G, card) => {
  if (!G.dust) {
    G.dust = [];
  }
  G.dust.push(card);
};

// Helper function to save current game state snapshot for undo
const saveStateSnapshot = (G) => {
  // Deep clone the game state (excluding history itself to avoid circular reference)
  const stateSnapshot = JSON.parse(JSON.stringify({
    players: G.players,
    market: G.market,
    dust: G.dust,
    relicStacks: G.relicStacks,
    availableEnergy: G.availableEnergy,
    currentPhase: G.currentPhase,
    finalRound: G.finalRound,
    finalRoundTriggeredBy: G.finalRoundTriggeredBy,
    finalRoundTurnsRemaining: G.finalRoundTurnsRemaining,
    gameOver: G.gameOver,
    pendingAttack: G.pendingAttack,
    pendingChoice: G.pendingChoice,
    gameLog: G.gameLog ? [...G.gameLog] : [],
  }));
  
  // Add to history (keep max 10 snapshots to prevent memory issues)
  if (!G.gameStateHistory) {
    G.gameStateHistory = [];
  }
  G.gameStateHistory.push(stateSnapshot);
  
  // Limit history size
  if (G.gameStateHistory.length > 10) {
    G.gameStateHistory.shift(); // Remove oldest state
  }
  
  console.log('[saveStateSnapshot] Saved state snapshot. History size:', G.gameStateHistory.length);
};

// UndoMove: Restore previous game state
const undoMove = ({ G, ctx }) => {
  if (!G.gameStateHistory || G.gameStateHistory.length === 0) {
    console.warn('[UndoMove] No history available to undo');
    return INVALID_MOVE;
  }
  
  // Get the last saved state (pop removes it from history)
  const previousState = G.gameStateHistory.pop();
  
  if (!previousState) {
    console.warn('[UndoMove] Previous state is null or undefined');
    return INVALID_MOVE;
  }
  
  // Restore the game state (don't restore gameStateHistory itself - we just popped from it)
  // Direct assignment - Immer will handle the mutations
  G.players = previousState.players;
  G.market = previousState.market;
  G.dust = previousState.dust;
  G.relicStacks = previousState.relicStacks;
  G.availableEnergy = previousState.availableEnergy;
  G.currentPhase = previousState.currentPhase;
  G.finalRound = previousState.finalRound;
  G.finalRoundTriggeredBy = previousState.finalRoundTriggeredBy;
  G.finalRoundTurnsRemaining = previousState.finalRoundTurnsRemaining;
  G.gameOver = previousState.gameOver;
  G.pendingAttack = previousState.pendingAttack;
  G.pendingChoice = previousState.pendingChoice;
  G.gameLog = previousState.gameLog;
  // Keep the current gameStateHistory (don't restore it - we just popped from it)
  
  console.log('[UndoMove] Restored previous game state. Remaining history:', G.gameStateHistory.length);
  
  // Add log entry
  addLogEntry(G, ctx, 'Undo', 'Last move was undone');
  
  // Don't return a value - we're mutating the draft, so Immer will handle the state update
};

// Helper function to set active players when there's a pendingChoice for a non-current player
const ensureActivePlayerForPendingChoice = (G, ctx) => {
  console.log('[ensureActivePlayerForPendingChoice] Called. pendingChoice:', G.pendingChoice ? 'exists' : 'null', 'ctx:', ctx ? 'exists' : 'null', 'ctx.events:', ctx?.events ? 'exists' : 'null');
  
  if (!G.pendingChoice) {
    console.log('[ensureActivePlayerForPendingChoice] No pendingChoice, returning');
    return;
  }
  
  if (!ctx) {
    console.log('[ensureActivePlayerForPendingChoice] No ctx, returning');
    return;
  }
  
  if (!ctx.events) {
    console.log('[ensureActivePlayerForPendingChoice] No ctx.events, returning');
    return;
  }
  
  if (!ctx.events.setActivePlayers) {
    console.log('[ensureActivePlayerForPendingChoice] No ctx.events.setActivePlayers, returning');
    return;
  }
  
  const pendingPlayerId = G.pendingChoice.playerId;
  const currentPlayerId = ctx.currentPlayer;
  
  console.log('[ensureActivePlayerForPendingChoice] pendingPlayerId:', pendingPlayerId, 'currentPlayerId:', currentPlayerId, 'choiceType:', G.pendingChoice.choiceType);
  
  // If the pendingChoice is for a different player, set them as active
  if (pendingPlayerId !== currentPlayerId) {
    // Check if this is a choice that requires a response (attack responses)
    const responseChoices = [
      'warhino_general_select_card_attack',
      'warhino_general_select_card_shield',
      'machboot_chaser_discard',
      'machboot_chaser_confirm_discard',
      'poisonhand_chancellor_discard',
      'dustseeker_drones_dust',
    ];
    
    if (responseChoices.includes(G.pendingChoice.choiceType)) {
      try {
        console.log('[ensureActivePlayerForPendingChoice] Setting active player to:', pendingPlayerId, 'for choiceType:', G.pendingChoice.choiceType);
        ctx.events.setActivePlayers({
          value: {
            [pendingPlayerId]: 'attackResponse',
          },
        });
        console.log('[ensureActivePlayerForPendingChoice] SUCCESS: Set active player');
      } catch (error) {
        console.error('[ensureActivePlayerForPendingChoice] ERROR:', error);
        console.error('[ensureActivePlayerForPendingChoice] Error stack:', error.stack);
      }
    } else {
      console.log('[ensureActivePlayerForPendingChoice] Choice type', G.pendingChoice.choiceType, 'not in responseChoices list');
    }
  } else {
    console.log('[ensureActivePlayerForPendingChoice] pendingPlayerId matches currentPlayerId, no need to set active');
  }
};

// Helper function to add entries to the game log
const addLogEntry = (G, ctx, action, details = '') => {
  if (!G.gameLog) {
    G.gameLog = [];
  }
  
  const turn = ctx.turn || 1;
  const playerId = ctx.currentPlayer || 'unknown';
  const timestamp = Date.now();
  
  G.gameLog.push({
    turn,
    playerId,
    action,
    details,
    timestamp,
  });
  
  // Keep only the last 200 log entries to prevent memory issues
  if (G.gameLog.length > 200) {
    G.gameLog.shift();
  }
};

// DustCard: Move 1 card from hand to global dustPlaymat array (once per turn)
// This function is reusable across phases
// Uses destructured signature: ({ G, ctx }, cardId)
const dustCardMove = ({ G, ctx }, cardId) => {
  // Save state before move
  saveStateSnapshot(G);
  
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  
  // Check if player has already dusted this turn (unless it's for relic requirement)
  if (player.hasDustedThisTurn && !player.mustDustForRelic) {
    return INVALID_MOVE;
  }
  
  // Find the card in hand
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  
  if (cardIndex === -1) {
    return INVALID_MOVE;
  }
  
  // Remove card from hand
  const card = player.hand.splice(cardIndex, 1)[0];
  
  // Move card to The Dust (global dustPlaymat)
  moveToDust(G, card);
  
  // Mark that player has dusted this turn
  player.hasDustedThisTurn = true;
  
  // Clear relic dust requirement if this was for relic
  if (player.mustDustForRelic) {
    player.mustDustForRelic = false;
    console.log('[DustCard] Cleared mustDustForRelic flag - relic requirement satisfied');
  }
  
  // Add log entry
  addLogEntry(G, ctx, 'Dusted Card', `${card.name} was moved to The Dust`);
  
  // Don't return a value - we're mutating the draft, so Immer will handle the state update
  // Returning a value would cause: "An immer producer returned a new value *and* modified its draft"
};

// Helper function to check if a card has an Attack effect
const hasAttackEffect = (card) => {
  if (!card || !card.ability) return false;
  return card.ability.toLowerCase().includes('attack:');
};

// Helper function to process all Ally abilities (non-attack effects)
// This handles abilities that trigger when an Ally card is played
const processAllyAbility = (G, ctx, playerId, card) => {
  if (!card || !card.ability || card.ability.trim() === '') {
    return; // No ability to process
  }
  
  const player = G.players[playerId];
  if (!player) {
    console.error('[processAllyAbility] Player not found:', playerId);
    return;
  }
  
  const ability = card.ability.toLowerCase();
  console.log('[processAllyAbility] Processing ability for', card.name, ':', card.ability);
  
  // Skip attack abilities - they're handled by processAttackEffect
  if (hasAttackEffect(card)) {
    return;
  }
  
  // 1. Wellspring Portal: "Draw until you have 4 cards in hand"
  if (ability.includes('draw until you have 4 cards in hand')) {
    const targetHandSize = 4;
    while (player.hand.length < targetHandSize) {
      if (!drawCard(player, G, ctx, playerId)) {
        // Can't draw more cards (deck and discard empty)
        break;
      }
    }
    console.log('[processAllyAbility] Wellspring Portal: Drew cards until hand size is', player.hand.length);
    addLogEntry(G, ctx, 'Card Ability', `${card.name}: Drew cards until hand size is ${player.hand.length}`);
    return;
  }
  
  // 2. Ferntip Hare: "Retrieve 1 Energy Coin from the Dust"
  if (ability.includes('retrieve 1 energy coin from the dust')) {
    // Find an Energy Cell in the Dust
    const energyCellIndex = G.dust.findIndex(card => 
      card.type === CARD_TYPES.RESOURCE && 
      card.resourceType === RESOURCE_TYPES.ENERGY_CELL
    );
    
    if (energyCellIndex !== -1) {
      const retrievedCard = G.dust.splice(energyCellIndex, 1)[0];
      player.hand.push(retrievedCard);
      console.log('[processAllyAbility] Ferntip Hare: Retrieved Energy Cell from Dust');
      addLogEntry(G, ctx, 'Card Ability', `${card.name}: Retrieved Energy Cell from Dust`);
    } else {
      console.log('[processAllyAbility] Ferntip Hare: No Energy Cell found in Dust');
    }
    return;
  }
  
  // 3. Fuseforge Blacksmith: "Discard Fusion Fragment for +2 Energy"
  // This is an optional effect - player chooses whether to discard
  if (ability.includes('discard fusion fragment for +2 energy')) {
    // Check if player has a Fusion Fragment in hand
    const hasFusionFragment = player.hand.some(card => 
      card.type === CARD_TYPES.RESOURCE && 
      card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT
    );
    
    if (hasFusionFragment) {
      // Set up pending choice for player to decide
      G.pendingChoice = {
        playerId: playerId,
        card: card,
        choiceType: 'discard_fusion_fragment',
        message: 'Discard a Fusion Fragment to gain +2 Energy?',
      };
      console.log('[processAllyAbility] Fuseforge Blacksmith: Pending choice set up - player can choose to discard Fusion Fragment');
    } else {
      console.log('[processAllyAbility] Fuseforge Blacksmith: No Fusion Fragment in hand - effect skipped');
    }
    return;
  }
  
  // 4. Fusegate Keeper: "Draw 1; Next Powerful card is Efficient"
  if (ability.includes('draw 1') && ability.includes('next powerful card is efficient')) {
    // Draw 1 card
    drawCard(player, G, ctx, playerId);
    console.log('[processAllyAbility] Fusegate Keeper: Drew 1 card');
    
    // Set flag to make next Powerful card playable as Efficient
    if (!player.nextPowerfulIsEfficient) {
      player.nextPowerfulIsEfficient = true;
      console.log('[processAllyAbility] Fusegate Keeper: Next Powerful card will be treated as Efficient');
    }
    return;
  }
  
  // 5. Thistledown Hawk: "Retrieve 2 from Dust"
  if (ability.includes('retrieve 2 from dust')) {
    let retrievedCount = 0;
    // Retrieve up to 2 cards from Dust (any type, but not Relics)
    for (let i = G.dust.length - 1; i >= 0 && retrievedCount < 2; i--) {
      const dustCard = G.dust[i];
      // Cannot retrieve Relics
      if (dustCard.type !== CARD_TYPES.RELIC) {
        const retrievedCard = G.dust.splice(i, 1)[0];
        player.hand.push(retrievedCard);
        retrievedCount++;
        console.log('[processAllyAbility] Thistledown Hawk: Retrieved', retrievedCard.name, 'from Dust');
      }
    }
    if (retrievedCount === 0) {
      console.log('[processAllyAbility] Thistledown Hawk: No cards found in Dust to retrieve');
    }
    return;
  }
  
  // Generic "Draw 1" ability (if not already handled)
  if (ability.includes('draw 1') && !ability.includes('next powerful')) {
    drawCard(player, G, ctx, playerId);
    console.log('[processAllyAbility] Drew 1 card from generic draw ability');
    return;
  }
  
  console.log('[processAllyAbility] Unhandled ability:', card.ability);
};

// Helper function to process relic abilities during Relic phase
const processRelicAbility = (G, ctx, playerId, relic) => {
  if (!relic || !relic.ability) {
    return;
  }
  
  const player = G.players[playerId];
  const ability = relic.ability.toLowerCase();
  
  console.log('[processRelicAbility] Processing ability for', relic.name, ':', relic.ability);
  
  // The Metaltree: Gain 1 Energy Coin per Relic you have acquired
  if (relic.name === 'The Metaltree') {
    const totalRelics = (player.relics?.length || 0) + (player.activeRelics?.length || 0);
    const energyGained = totalRelics;
    G.availableEnergy = (G.availableEnergy || 0) + energyGained;
    addLogEntry(G, ctx, 'Relic Ability', `${relic.name}: Gained ${energyGained} Energy (${totalRelics} Relics)`);
    console.log('[processRelicAbility] The Metaltree: Gained', energyGained, 'Energy');
    return;
  }
  
  // The Skrysword: Look at top card, may dust or discard it, then draw 1
  if (relic.name === 'The Skrysword') {
    if (player.deck.length > 0) {
      const topCard = player.deck[player.deck.length - 1];
      // Set up pending choice for player to decide what to do with top card
      G.pendingChoice = {
        playerId: playerId,
        card: relic,
        choiceType: 'skrysword_top_card',
        message: `Look at top card: ${topCard.name}. Choose: Dust it, Discard it, or Leave it`,
        topCard: topCard,
      };
      console.log('[processRelicAbility] The Skrysword: Set up pending choice for top card:', topCard.name);
    } else {
      // Deck is empty, just draw (will shuffle if needed)
      if (drawCard(player, G, ctx, playerId)) {
        addLogEntry(G, ctx, 'Relic Ability', `${relic.name}: Drew 1 card (deck was empty)`);
      }
    }
    return;
  }
  
  // The Chronograph: Recall 1 card from discard pile
  if (relic.name === 'The Chronograph') {
    if (player.discard.length > 0) {
      // Set up pending choice for player to select a card from discard
      G.pendingChoice = {
        playerId: playerId,
        card: relic,
        choiceType: 'chronograph_recall',
        message: 'Choose 1 card from your discard pile to put on top of your deck',
        availableCards: [...player.discard],
      };
      console.log('[processRelicAbility] The Chronograph: Set up pending choice to recall from discard');
    } else {
      addLogEntry(G, ctx, 'Relic Ability', `${relic.name}: No cards in discard to recall`);
    }
    return;
  }
  
  // The Machwings: Retrieve 1 card with different name from cards dusted for Relic effects this turn
  if (relic.name === 'The Machwings') {
    // This will be handled when player dusts cards - we need to track dusted cards for relic effects
    // For now, set up a pending choice to retrieve from dust
    const retrievableCards = G.dust.filter(card => {
      // Find cards that were dusted this turn for relic effects
      // For simplicity, allow retrieving any card from dust that's different from cards in hand
      const handCardNames = new Set(player.hand.map(c => c.name));
      return card.name && !handCardNames.has(card.name) && card.type !== CARD_TYPES.RELIC;
    });
    
    if (retrievableCards.length > 0) {
      G.pendingChoice = {
        playerId: playerId,
        card: relic,
        choiceType: 'machwings_retrieve',
        message: 'Choose 1 card with a different name from your hand to retrieve from Dust',
        availableCards: retrievableCards,
      };
      console.log('[processRelicAbility] The Machwings: Set up pending choice to retrieve from dust');
    } else {
      addLogEntry(G, ctx, 'Relic Ability', `${relic.name}: No retrievable cards in Dust`);
    }
    return;
  }
  
  // Other relics with passive effects are handled elsewhere
  console.log('[processRelicAbility] Relic ability handled or passive:', relic.name);
};

// Helper function to process attack effects
// Returns pendingAttack object if attack needs shield blocking, null if resolved immediately
const processAttackEffect = (G, ctx, attackerId, card) => {
  if (!hasAttackEffect(card)) {
    return null; // Not an attack card
  }
  
  const ability = card.ability.toLowerCase();
  // CRITICAL: Normalize attackerId to handle both string and number IDs
  // Object.keys always returns strings, so normalize attackerId to string for comparison
  const attackerIdStr = String(attackerId);
  const attacker = G.players[attackerId] || G.players[attackerIdStr];
  
  // Get all opponent IDs (Object.keys returns strings)
  // Filter using normalized string comparison to ensure we don't include the attacker
  // CRITICAL: This works for 2-4 player games - returns all players except the attacker
  // Supports any player ID combination (0, 1, 2, 3 or "0", "1", "2", "3")
  const opponentIds = Object.keys(G.players).filter(id => {
    const idStr = String(id);
    return idStr !== attackerIdStr && String(id) !== String(attackerId);
  });
  
  // Process different attack types
  if (ability.includes('opponent discards 1')) {
    // Machboot Chaser and similar attacks: Need opponent selection for 3+ players
    // For 2-player games, automatically target the only opponent
    if (opponentIds.length > 1) {
      // 3+ players: Set up opponent selection
      G.pendingChoice = {
        playerId: attackerId,
        card: card,
        choiceType: 'machboot_chaser_select_opponent',
        message: 'Select a player to attack',
        opponentIds: opponentIds,
      };
      console.log('[Attack] Machboot Chaser: Set up opponent selection for', opponentIds.length, 'opponent(s)');
      return null; // Choice will be resolved by player
    }
    
    // 2-player game: Target the only opponent
    const targetId = opponentIds[0];
    if (targetId) {
      // CRITICAL: opponentIds are strings (from Object.keys), but players might be keyed by number
      // Try both string and convert back to original type if needed
      const target = G.players[targetId] || G.players[parseInt(targetId)];
      // The Satellite: Shield from first attack each round
      const hasSatellite = [...(target.relics || []), ...(target.activeRelics || [])].some(r => r.name === 'The Satellite');
      const satelliteCanBlock = hasSatellite && !target.satelliteShieldUsed;
      
      // Check if target has an active shield that can block, or The Satellite can block
      if ((target.activeShield && !target.activeShield.faceDown) || satelliteCanBlock) {
        // Set up pending attack for shield blocking
        G.pendingAttack = {
          attackerId,
          targetId,
          card,
          effect: 'discard 1',
          satelliteBlock: satelliteCanBlock, // Track if this is a Satellite block
        };
        console.log('[Attack] Attack pending - target can block with', satelliteCanBlock ? 'The Satellite' : 'shield');
        
        // Set target player as active so they can respond to the attack
        if (ctx.events && ctx.events.setActivePlayers) {
          try {
            ctx.events.setActivePlayers({
              value: {
                [attackerId]: 'default', // Keep attacker active
                [targetId]: 'attackResponse', // Activate target for response
              },
            });
            console.log('[Attack] Set active players for attack response - attacker:', attackerId, 'target:', targetId);
          } catch (error) {
            console.error('[Attack] ERROR calling setActivePlayers:', error);
          }
        } else {
          console.warn('[Attack] ctx.events.setActivePlayers not available! ctx.events:', ctx?.events);
        }
        
        return G.pendingAttack;
      } else {
        // No shield: Set up pending choice for target to select card to discard
        if (target.hand.length > 0) {
          G.pendingChoice = {
            playerId: targetId,
            card: card,
            choiceType: 'machboot_chaser_discard',
            message: 'Select a card to discard',
            attackerId: attackerId,
            targetId: targetId,
          };
          console.log('[Attack] Machboot Chaser: Set up discard choice for target');
          
          // Allow the target player to make moves even though they're not the current player
          // Use setActivePlayers to activate the target player in the attackResponse stage
          if (ctx.events && ctx.events.setActivePlayers) {
            try {
              console.log('[Attack] Machboot Chaser: Setting active player to attackResponse stage for player:', targetId);
              ctx.events.setActivePlayers({
                value: { [targetId]: 'attackResponse' },
              });
              console.log('[Attack] Machboot Chaser: SUCCESS: Set active player for target');
            } catch (error) {
              console.error('[Attack] Machboot Chaser: ERROR calling setActivePlayers:', error);
            }
          } else {
            console.warn('[Attack] Machboot Chaser: ctx.events.setActivePlayers not available! ctx.events:', ctx?.events);
          }
          
          return null; // Choice will be resolved by target player
        } else {
          // Target has no cards in hand - attacker still draws
          if (ability.includes('you draw 1')) {
            if (drawCard(attacker, G, ctx, attackerId)) {
              console.log('[Attack] Attacker drew 1 card (target had no cards to discard)');
            }
          }
          return null;
        }
      }
    }
  } else if (ability.includes('all discard 1')) {
    // Poisonhand Chancellor: All opponents discard 1 card
    // Process opponents one at a time, starting with the first one
    // Store remaining opponents in pendingChoice for sequential processing
    const opponentsToProcess = opponentIds.filter(opponentId => {
      // CRITICAL: Handle both string and number IDs
      const opponent = G.players[opponentId] || G.players[parseInt(opponentId)];
      if (!opponent) return false;
      // Skip opponents with shields (they'll be handled via pendingAttack)
      return !(opponent.activeShield && !opponent.activeShield.faceDown);
    });
    
    // Find first opponent without shield to process
    const firstOpponentId = opponentsToProcess[0];
    
    if (firstOpponentId) {
      // CRITICAL: Handle both string and number IDs
      // opponentIds are strings from Object.keys, but try both formats
      const firstOpponent = G.players[firstOpponentId] || G.players[parseInt(firstOpponentId)];
      if (firstOpponent.hand.length > 0) {
        // Set up pending choice for first opponent to select card to discard
        G.pendingChoice = {
          playerId: firstOpponentId,
          card: card,
          choiceType: 'poisonhand_chancellor_discard',
          message: 'Select a card to discard',
          attackerId: attackerId,
          targetId: firstOpponentId,
          remainingOpponents: opponentsToProcess.slice(1), // Store remaining opponents
        };
        console.log('[Attack] Poisonhand Chancellor: Set up discard choice for opponent', firstOpponentId, 'with', opponentsToProcess.length - 1, 'remaining');
        
        // Set active players: keep attacker active, activate first opponent
        if (ctx.events && ctx.events.setActivePlayers) {
          try {
            ctx.events.setActivePlayers({
              value: {
                [attackerId]: 'default', // Keep attacker active
                [firstOpponentId]: 'attackResponse', // Activate first opponent
              },
            });
            console.log('[Attack] Poisonhand Chancellor: Set active players for both attacker and first opponent');
          } catch (error) {
            console.error('[Attack] Poisonhand Chancellor: ERROR calling setActivePlayers:', error);
          }
        }
        
        return null; // Choice will be resolved by opponent
      }
    }
    
    // Check for opponents with shields (set up pendingAttack)
    opponentIds.forEach(opponentId => {
      // CRITICAL: Handle both string and number IDs
      const opponent = G.players[opponentId] || G.players[parseInt(opponentId)];
      if (opponent.activeShield && !opponent.activeShield.faceDown) {
        G.pendingAttack = {
          attackerId,
          targetId: opponentId,
          card,
          effect: 'discard 1',
        };
        console.log('[Attack] Attack pending for opponent', opponentId, '- can block with shield');
      }
    });
    
    // If no opponents need to discard (all have shields or no cards), attacker still draws
    if (opponentsToProcess.length === 0 || opponentsToProcess.every(id => G.players[id].hand.length === 0)) {
      if (ability.includes('you draw 1') || ability.includes('draw 1')) {
        if (drawCard(attacker, G, ctx, attackerId)) {
          console.log('[Attack] Attacker drew 1 card (all opponents blocked or had no cards)');
        }
      }
    }
    
    return G.pendingAttack || null;
  } else if (ability.includes('dust opponent card')) {
    // Dust attack - target discards a card to dust
    // Check if this is "OR Retrieve 1" variant (Warhino General)
    const hasRetrieveOption = ability.includes('or retrieve 1');
    
    const targetId = opponentIds[0];
    if (targetId) {
      // CRITICAL: Handle both string and number IDs
      const target = G.players[targetId] || G.players[parseInt(targetId)];
      
      // If "OR Retrieve 1" option exists (Warhino General), ALWAYS set up pending choice for attacker first
      // The attacker chooses between "Dust opponent card" or "Retrieve 1"
      // Shield blocking will be handled after the attacker chooses "Dust opponent card"
      if (hasRetrieveOption) {
        // Warhino General: Set up pending choice for player to choose
        // For 2-player games, set targetId. For 3+ players, targetId will be set when owner selects opponent
        const finalTargetId = opponentIds.length === 1 ? targetId : null;
        G.pendingChoice = {
          playerId: attackerId,
          card: card,
          choiceType: 'warhino_general_attack',
          message: 'Choose: Dust opponent card OR Retrieve 1 from Dust',
          targetId: finalTargetId, // null for 3+ players, will be set when opponent is selected
        };
        console.log('[Attack] Warhino General: Pending choice set up - player can choose to dust opponent card OR retrieve 1', 
          opponentIds.length > 1 ? '(opponent selection required)' : '');
        return null; // Choice will be resolved by player
      } else {
        // Regular dust attack (Dustseeker Drones) - no retrieve option
        // Check if target has shield
        if (target.activeShield && !target.activeShield.faceDown) {
          // Shield can block - set up pending attack
          G.pendingAttack = {
            attackerId,
            targetId,
            card,
            effect: 'dust card',
          };
          console.log('[Attack] Dust attack pending - target can block with shield');
          
          // Set target player as active so they can respond to the attack
          if (ctx.events && ctx.events.setActivePlayers) {
            try {
              ctx.events.setActivePlayers({
                value: {
                  [attackerId]: 'default', // Keep attacker active
                  [targetId]: 'attackResponse', // Activate target for response
                },
              });
              console.log('[Attack] Set active players for attack response - attacker:', attackerId, 'target:', targetId);
            } catch (error) {
              console.error('[Attack] ERROR calling setActivePlayers:', error);
            }
          } else {
            console.warn('[Attack] ctx.events.setActivePlayers not available! ctx.events:', ctx?.events);
          }
          
          return G.pendingAttack;
        } else {
          // Regular dust attack (Dustseeker Drones) - opponent chooses which card to dust
          // For 3+ players, need opponent selection first
          if (opponentIds.length > 1) {
            // 3+ players: Set up opponent selection
            G.pendingChoice = {
              playerId: attackerId,
              card: card,
              choiceType: 'dustseeker_drones_select_opponent',
              message: 'Select a player to attack',
              opponentIds: opponentIds,
            };
            console.log('[Attack] Dustseeker Drones: Set up opponent selection for', opponentIds.length, 'opponent(s)');
            return null; // Choice will be resolved by player
          }
          
          // 2-player game: Target the only opponent
          if (target.hand.length > 0) {
            G.pendingChoice = {
              playerId: targetId,
              card: card,
              choiceType: 'dustseeker_drones_dust',
              message: 'Select a card from your hand to dust',
              attackerId: attackerId,
              targetId: targetId,
            };
            console.log('[Attack] Dustseeker Drones: Set up dust choice for target');
            
            // Set active players: keep attacker active, activate target
            if (ctx.events && ctx.events.setActivePlayers) {
              try {
                ctx.events.setActivePlayers({
                  value: {
                    [attackerId]: 'default', // Keep attacker active
                    [targetId]: 'attackResponse', // Activate target
                  },
                });
                console.log('[Attack] Dustseeker Drones: Set active players for both attacker and target');
              } catch (error) {
                console.error('[Attack] Dustseeker Drones: ERROR calling setActivePlayers:', error);
              }
            }
            
            return null; // Choice will be resolved by target
          } else {
            // Target has no cards - attacker still draws
            if (ability.includes('draw 1')) {
              if (drawCard(attacker, G, ctx, attackerId)) {
                console.log('[Attack] Attacker drew 1 card (target had no cards to dust)');
              }
            }
            return null;
          }
        }
      }
    }
  }
  
  return null;
};

// BlockWithShield: Discard active shield to negate an attack, or use The Satellite
const blockWithShieldMove = ({ G, ctx }) => {
  // CRITICAL: When a player is in attackResponse stage, they may not be ctx.currentPlayer
  // Use ctx.playerID if available (the client making the call), otherwise check activePlayers
  let playerId = ctx.playerID;
  
  // If ctx.playerID is not available, try to find the player in attackResponse stage
  if (!playerId && ctx.activePlayers) {
    const activePlayerInStage = Object.entries(ctx.activePlayers).find(
      ([id, stage]) => stage === 'attackResponse'
    );
    if (activePlayerInStage) {
      playerId = activePlayerInStage[0];
      console.log('[BlockWithShield] Using player from attackResponse stage:', playerId);
    }
  }
  
  // Fallback to currentPlayer if still not found
  if (!playerId) {
    playerId = ctx.currentPlayer;
    console.log('[BlockWithShield] Using ctx.currentPlayer as fallback:', playerId);
  }
  
  // Normalize to string for comparison
  const playerIdStr = String(playerId);
  const targetIdStr = G.pendingAttack ? String(G.pendingAttack.targetId) : null;
  
  console.log('[BlockWithShield] Move called. playerId:', playerId, 'targetId:', targetIdStr, 'ctx.playerID:', ctx.playerID, 'ctx.currentPlayer:', ctx.currentPlayer, 'activePlayers:', ctx.activePlayers);
  
  // Must have a pending attack
  if (!G.pendingAttack) {
    console.warn('[BlockWithShield] No pending attack exists');
    return INVALID_MOVE;
  }
  
  // Verify this player is the target of the attack
  if (playerIdStr !== targetIdStr) {
    console.warn('[BlockWithShield] Player', playerIdStr, 'is not the target', targetIdStr, 'of the pending attack');
    return INVALID_MOVE;
  }
  
  const player = G.players[playerId] || G.players[playerIdStr];
  if (!player) {
    console.warn('[BlockWithShield] Player not found:', playerId);
    return INVALID_MOVE;
  }
  
  // Check if this is a Satellite block
  if (G.pendingAttack.satelliteBlock) {
    // Check if player has The Satellite and it hasn't been used this round
    const hasSatellite = [...(player.relics || []), ...(player.activeRelics || [])].some(r => r.name === 'The Satellite');
    if (hasSatellite && !player.satelliteShieldUsed) {
      // Mark The Satellite as used for this round
      player.satelliteShieldUsed = true;
      
      // Attacker still gets card draw/energy from attack card (bad effect is negated, but other effects resolve)
      // CRITICAL: Normalize attackerId to handle both string and number IDs consistently
      const attackerIdRaw = G.pendingAttack.attackerId;
      const attackerIdStr = String(attackerIdRaw);
      const attacker = G.players[attackerIdRaw] || G.players[attackerIdStr];
      
      if (attacker) {
        const ability = G.pendingAttack.card.ability.toLowerCase();
        if (ability.includes('you draw 1') || ability.includes('draw 1')) {
          if (drawCard(attacker, G, ctx, attackerIdRaw)) {
            console.log('[BlockWithShield] Attacker', attackerIdRaw, 'drew 1 card (attack was blocked by The Satellite but draw effect still resolves)');
          }
        }
      } else {
        console.warn('[BlockWithShield] Attacker not found for Satellite block:', attackerIdRaw, 'or', attackerIdStr);
      }
      
      // Clear the pending attack (attack is negated)
      console.log('[BlockWithShield] The Satellite used to block attack from', G.pendingAttack.card.name);
      addLogEntry(G, ctx, 'Blocked Attack', `The Satellite blocked ${G.pendingAttack.card.name}'s attack`);
      
      // Store attackerId before clearing pendingAttack - use the original value
      const attackerIdForSatellite = attackerIdRaw;
      G.pendingAttack = null;
      
      // End the attackResponse stage and return control to attacker
      if (ctx.events && ctx.events.endStage) {
        try {
          ctx.events.endStage();
          console.log('[BlockWithShield] Ended attackResponse stage (Satellite block)');
          
          if (ctx.events.setActivePlayers) {
            ctx.events.setActivePlayers({
              value: { [attackerIdForSatellite]: 'default' },
            });
            console.log('[BlockWithShield] Returned control to attacker (Satellite block):', attackerIdForSatellite);
          }
        } catch (error) {
          console.warn('[BlockWithShield] Could not end stage (Turn onMove hook will handle it):', error);
        }
      }
      
      // Don't return - we're mutating G, so we can't return a value in Immer
      return;
    } else {
      console.warn('[BlockWithShield] The Satellite cannot block (already used or not available)');
      return INVALID_MOVE;
    }
  }
  
  // Must have an active shield (face-up)
  if (!player.activeShield || player.activeShield.faceDown) {
    console.warn('[BlockWithShield] No active shield to block with');
    return INVALID_MOVE;
  }
  
  // CRITICAL: Store shield card reference and all necessary data BEFORE any mutations
  // This prevents Immer from losing the reference during state updates
  const shieldCard = player.activeShield.card;
  const shieldCardId = shieldCard?.id;
  const shieldCardName = shieldCard?.name;
  const shieldFaceDown = player.activeShield.faceDown;
  const shieldEnergyGenerated = shieldCard?.energyGenerated || 0;
  
  if (!shieldCard) {
    console.error('[BlockWithShield] ERROR: Shield card is null or undefined!');
    return INVALID_MOVE;
  }
  
  console.log('[BlockWithShield] Discarding shield:', shieldCardName, '(ID:', shieldCardId, ') from player:', playerIdStr, 'to discard pile');
  
  // EDGE CASE: Shield Energy - Remove energy contribution from shield used to block
  // If the shield was face-up (active) and generated energy, remove that energy
  // Calculate this BEFORE clearing activeShield
  if (!shieldFaceDown && shieldEnergyGenerated > 0) {
    const energyToRemove = shieldEnergyGenerated;
    G.availableEnergy = Math.max(0, (G.availableEnergy || 0) - energyToRemove);
    console.log('[BlockWithShield] Shield Energy Edge Case: Removed', energyToRemove, 'energy from blocked shield', shieldCardName, '. New availableEnergy:', G.availableEnergy);
    addLogEntry(G, ctx, 'Shield Blocked', `${shieldCardName} used to block - ${energyToRemove} energy removed`);
  }
  
  // CRITICAL: Store attacker info BEFORE clearing pendingAttack
  const attackerIdRaw = G.pendingAttack.attackerId;
  const attackerIdStr = String(attackerIdRaw);
  const attackCardName = G.pendingAttack.card?.name || 'Unknown';
  
  // CRITICAL: Clear activeShield FIRST, then add to discard
  // This ensures the shield is removed from the active slot
  console.log('[BlockWithShield] Clearing activeShield for player:', playerIdStr);
  player.activeShield = null;
  
  // Verify activeShield was cleared immediately
  if (G.players[playerIdStr]?.activeShield !== null || G.players[playerId]?.activeShield !== null) {
    console.error('[BlockWithShield] ERROR: activeShield was not cleared! Still exists. playerId:', playerIdStr);
    // Force clear it again using direct access
    if (G.players[playerIdStr]) G.players[playerIdStr].activeShield = null;
    if (G.players[playerId]) G.players[playerId].activeShield = null;
  } else {
    console.log('[BlockWithShield] SUCCESS: activeShield cleared for player:', playerIdStr);
  }
  
  // Add shield card to discard pile
  // CRITICAL: Ensure discard pile exists and belongs to the correct player
  if (!player.discard) {
    console.error('[BlockWithShield] ERROR: player.discard is undefined! Initializing for player:', playerIdStr);
    player.discard = [];
  }
  console.log('[BlockWithShield] Adding shield card to discard pile:', shieldCardName, 'for player:', playerIdStr);
  player.discard.push(shieldCard);
  console.log('[BlockWithShield] Shield card added to discard for player', playerIdStr, '. Discard pile size:', player.discard.length);
  
  // Final verification: Check that shield is no longer active (check both ID formats)
  const finalCheckPlayer = G.players[playerIdStr] || G.players[playerId];
  if (finalCheckPlayer && finalCheckPlayer.activeShield !== null) {
    console.error('[BlockWithShield] ERROR: activeShield still exists after discard! Forcing clear...');
    finalCheckPlayer.activeShield = null;
  } else {
    console.log('[BlockWithShield] FINAL VERIFICATION: activeShield successfully cleared for player:', playerIdStr);
  }
  
  // Attacker still gets card draw/energy from attack card (bad effect is negated, but other effects resolve)
  // Use the stored attackerId and card info (already stored above)
  const attacker = G.players[attackerIdRaw] || G.players[attackerIdStr];
  
  if (!attacker) {
    console.warn('[BlockWithShield] Attacker not found:', attackerIdRaw, 'or', attackerIdStr);
  } else {
    // Get attack card ability from pendingAttack before clearing it
    const attackAbility = G.pendingAttack?.card?.ability?.toLowerCase() || '';
    if (attackAbility.includes('you draw 1') || attackAbility.includes('draw 1')) {
      // Use the raw attackerId for drawCard
      if (drawCard(attacker, G, ctx, attackerIdRaw)) {
        console.log('[BlockWithShield] Attacker', attackerIdRaw, 'drew 1 card (attack was blocked but draw effect still resolves)');
      }
    }
  }
  
  // Clear the pending attack (attack is negated)
  console.log('[BlockWithShield] Shield', shieldCardName, 'used to block attack from', attackCardName);
  addLogEntry(G, ctx, 'Blocked Attack', `${shieldCardName} blocked ${attackCardName}'s attack`);
  
  // Store attackerId before clearing pendingAttack - use the original value from pendingAttack
  const attackerId = attackerIdRaw;
  G.pendingAttack = null;
  
  // End the attackResponse stage and return control to attacker
  // The Turn onMove hook will handle this, but we can try here too
  if (ctx.events && ctx.events.endStage) {
    try {
      ctx.events.endStage();
      console.log('[BlockWithShield] Ended attackResponse stage');
      
      if (ctx.events.setActivePlayers) {
        ctx.events.setActivePlayers({
          value: { [attackerId]: 'default' },
        });
        console.log('[BlockWithShield] Returned control to attacker:', attackerId);
      }
    } catch (error) {
      console.warn('[BlockWithShield] Could not end stage (Turn onMove hook will handle it):', error);
    }
  } else {
    console.log('[BlockWithShield] ctx.events not available - Turn onMove hook will handle stage transition');
  }
  
  // Don't return - we're mutating G, so we can't return a value in Immer
};

// ResolveAttack: Target chooses not to block (or can't block)
const resolveAttackMove = ({ G, ctx }) => {
  // CRITICAL: When a player is in attackResponse stage, they may not be ctx.currentPlayer
  // Use ctx.playerID if available (the client making the call), otherwise check activePlayers
  let playerId = ctx.playerID;
  
  // If ctx.playerID is not available, try to find the player in attackResponse stage
  if (!playerId && ctx.activePlayers) {
    const activePlayerInStage = Object.entries(ctx.activePlayers).find(
      ([id, stage]) => stage === 'attackResponse'
    );
    if (activePlayerInStage) {
      playerId = activePlayerInStage[0];
      console.log('[ResolveAttack] Using player from attackResponse stage:', playerId);
    }
  }
  
  // Fallback to currentPlayer if still not found
  if (!playerId) {
    playerId = ctx.currentPlayer;
    console.log('[ResolveAttack] Using ctx.currentPlayer as fallback:', playerId);
  }
  
  // Normalize to string for comparison
  const playerIdStr = String(playerId);
  const targetIdStr = G.pendingAttack ? String(G.pendingAttack.targetId) : null;
  
  console.log('[ResolveAttack] Move called. playerId:', playerId, 'targetId:', targetIdStr, 'ctx.playerID:', ctx.playerID, 'ctx.currentPlayer:', ctx.currentPlayer);
  
  // Must have a pending attack
  if (!G.pendingAttack) {
    console.warn('[ResolveAttack] No pending attack exists');
    return INVALID_MOVE;
  }
  
  // Verify this player is the target of the attack
  if (playerIdStr !== targetIdStr) {
    console.warn('[ResolveAttack] Player', playerIdStr, 'is not the target', targetIdStr, 'of the pending attack');
    return INVALID_MOVE;
  }
  
  const attack = G.pendingAttack;
  // CRITICAL: Normalize IDs to handle both string and number IDs consistently
  // Try both the original ID and string version when accessing players
  const targetIdRaw = attack.targetId;
  const attackerIdRaw = attack.attackerId;
  const target = G.players[targetIdRaw] || G.players[String(targetIdRaw)];
  const attacker = G.players[attackerIdRaw] || G.players[String(attackerIdRaw)];
  
  if (!target) {
    console.warn('[ResolveAttack] Target player not found:', targetIdRaw);
    return INVALID_MOVE;
  }
  if (!attacker) {
    console.warn('[ResolveAttack] Attacker player not found:', attackerIdRaw);
    return INVALID_MOVE;
  }
  
  // Resolve the attack effect
  if (attack.effect === 'discard 1') {
    // Set up pending choice for target to select card to discard (with confirmation)
    if (target.hand.length > 0) {
      G.pendingChoice = {
        playerId: attack.targetId,
        card: attack.card,
        choiceType: 'machboot_chaser_discard',
        message: 'Select a card to discard',
        attackerId: attack.attackerId,
        targetId: attack.targetId,
      };
      console.log('[ResolveAttack] Set up discard choice for target');
      
      // Allow the target player to make moves even though they're not the current player
      // Use setActivePlayers to activate the target player in the attackResponse stage
      if (ctx.events && ctx.events.setActivePlayers) {
        try {
          console.log('[ResolveAttack] Setting active player to attackResponse stage for player:', attack.targetId);
          ctx.events.setActivePlayers({
            value: { [attack.targetId]: 'attackResponse' },
          });
          console.log('[ResolveAttack] SUCCESS: Set active player for target');
        } catch (error) {
          console.error('[ResolveAttack] ERROR calling setActivePlayers:', error);
        }
      } else {
        console.warn('[ResolveAttack] ctx.events.setActivePlayers not available! ctx.events:', ctx?.events);
      }
      
      // Don't clear pendingAttack yet - it will be cleared after discard is confirmed
      // Don't return - we're mutating G, so we can't return a value in Immer
      return;
    } else {
      // Target has no cards in hand - attacker still draws
      const ability = attack.card.ability.toLowerCase();
      if (ability.includes('you draw 1') || ability.includes('draw 1')) {
        if (drawCard(attacker, G, ctx, attackerIdRaw)) {
          console.log('[ResolveAttack] Attacker', attackerIdRaw, 'drew 1 card (target had no cards to discard)');
        }
      }
    }
  } else if (attack.effect === 'dust card') {
    // Player must choose a card to dust (handled by UI)
    // For now, auto-dust first card in hand
    if (target.hand.length > 0) {
      const dusted = target.hand.pop();
      moveToDust(G, dusted);
      console.log('[ResolveAttack] Target card dusted:', dusted.name);
      addLogEntry(G, ctx, 'Attack Resolved', `${attack.card.name}: ${dusted.name} dusted`);
    } else {
      // EDGE CASE: Target has no cards in hand - this should not happen if end turn logic is correct
      // Log error for debugging
      console.error('[ResolveAttack] ERROR: Target has no cards in hand to dust! This suggests end turn logic issue.');
      console.error('[ResolveAttack] Target hand size:', target.hand.length, 'Discard size:', target.discard.length, 'Deck size:', target.deck.length);
      addLogEntry(G, ctx, 'Attack Resolved', `${attack.card.name}: No cards in hand to dust (BUG: should have drawn cards at end of turn)`);
    }
    
    const ability = attack.card.ability.toLowerCase();
    if (ability.includes('draw 1')) {
      if (drawCard(attacker, G, ctx, attackerIdRaw)) {
        console.log('[ResolveAttack] Attacker', attackerIdRaw, 'drew 1 card');
      }
    }
  }
  
  // Clear pending attack
  G.pendingAttack = null;
  
  // EDGE CASE: Hand Minimum - After attack effect completes, enforce hand minimum for target
  // This ensures target has at least 3 cards (or 4 with The Nobel Cloak) during opponent's turn
  // Use normalized IDs to ensure it works in both directions
  if (attack && targetIdRaw && attackerIdRaw) {
    enforceHandMinimum(G, ctx, targetIdRaw, attackerIdRaw);
  }
  
  // Don't return - we're mutating G, so we can't return a value in Immer
};

// Helper function to process shield effects when flipped
const processShieldEffect = (G, ctx, playerId, shieldCard) => {
  if (!shieldCard || !shieldCard.ability) {
    return; // No effect to process
  }
  
  const ability = shieldCard.ability.toLowerCase();
  const player = G.players[playerId];
  
  // CRITICAL: Verify shield still exists before and after processing
  if (!player.activeShield || !player.activeShield.card) {
    console.error('[Shield Effect] ERROR: activeShield is missing before processing effect! This should not happen.');
    return;
  }
  
  // Verify the shield card matches (by ID to avoid reference issues)
  const shieldCardId = player.activeShield.card.id;
  if (shieldCard.id !== shieldCardId) {
    console.warn('[Shield Effect] WARNING: Shield card ID mismatch! Processing card ID:', shieldCard.id, 'Active shield card ID:', shieldCardId);
    // Use the active shield's card instead
    shieldCard = player.activeShield.card;
  }
  
  // Process shield effects (similar to attack effects but for the shield owner)
  if (ability.includes('attack:')) {
    // Shield has an attack effect - this activates when shield flips and every turn while active
    console.log('[Shield Effect] Shield', shieldCard.name, 'has attack effect:', shieldCard.ability);
    
    // Check if this is Warhino General with "OR Retrieve 1" option
    if (ability.includes('dust opponent card') && ability.includes('or retrieve 1')) {
      // Warhino General: Set up pending choice for player to choose
      const opponentIds = Object.keys(G.players).filter(id => id !== playerId);
      // For 2-player games, set targetId. For 3+ players, targetId will be set when owner selects opponent
      const targetId = opponentIds.length === 1 ? opponentIds[0] : null;
      
      // CRITICAL: Use the active shield's card reference to ensure consistency
      const activeShieldCard = player.activeShield.card;
      
      G.pendingChoice = {
        playerId: playerId,
        card: activeShieldCard, // Use active shield's card reference
        choiceType: 'warhino_general_shield',
        message: 'Warhino General (Shield): Choose: Dust opponent card OR Retrieve 1 from Dust',
        targetId: targetId, // null for 3+ players, will be set when opponent is selected
      };
      console.log('[Shield Effect] Warhino General: Pending choice set up - player can choose to dust opponent card OR retrieve 1', 
        opponentIds.length > 1 ? '(opponent selection required)' : '');
    } else {
      // Other attack effects can be processed here
      console.log('[Shield Effect] Processing other attack effect for', shieldCard.name);
    }
  }
  
  // CRITICAL: Verify shield still exists after processing
  if (!player.activeShield || !player.activeShield.card) {
    console.error('[Shield Effect] ERROR: activeShield disappeared after processing effect! This should not happen.');
    // Try to restore it if we have the card info
    if (shieldCard && shieldCard.id) {
      console.log('[Shield Effect] Attempting to restore shield...');
      player.activeShield = {
        card: shieldCard,
        faceDown: false, // Should be face-up if effect is being processed
      };
    }
  } else {
    console.log('[Shield Effect] Shield verified after processing:', {
      cardName: player.activeShield.card.name,
      cardId: player.activeShield.card.id,
      faceDown: player.activeShield.faceDown
    });
  }
  
  // Other shield effects can be added here
  console.log('[Shield Effect] Processed shield effect for', shieldCard.name);
};

// Market Logic: Helper function to check if player can afford a card
const canAfford = (card, availableEnergy) => {
  if (!card || card.cost === undefined) {
    return false;
  }
  return (availableEnergy || 0) >= card.cost;
};

// Fix Energy Calculation: Calculate energy dynamically from playArea
const calculateAvailableEnergy = (G, playerId) => {
  if (!G || !G.players || !G.players[playerId]) {
    return 0;
  }
  
  const player = G.players[playerId];
  let energy = 0;
  
  // Sum Energy from Energy Cells in playArea
  let energyCellEnergy = 0;
  player.playArea.forEach(card => {
    if (card.type === CARD_TYPES.RESOURCE && 
        card.resourceType === RESOURCE_TYPES.ENERGY_CELL) {
      const energyValue = card.energyValue || 1;
      energyCellEnergy += energyValue;
      energy += energyValue;
    }
  });
  
  // Sum Energy from Ally cards in playArea
  let allyEnergy = 0;
  player.playArea.forEach(card => {
    if (card.type === CARD_TYPES.ALLY && card.energyGenerated) {
      const energyGen = card.energyGenerated || 0;
      allyEnergy += energyGen;
      energy += energyGen;
      console.log('[calculateAvailableEnergy] Ally', card.name, 'contributes', energyGen, 'energy');
    }
  });
  
  // Sum Energy from active Relics
  let relicEnergy = 0;
  if (player.activeRelics) {
    player.activeRelics.forEach(relic => {
      const energyValue = relic.energyValue || 0;
      relicEnergy += energyValue;
      energy += energyValue;
    });
  }
  
  // Sum Energy from active Shield (only if face-up)
  let shieldEnergy = 0;
  if (player.activeShield && !player.activeShield.faceDown) {
    shieldEnergy = player.activeShield.card.energyGenerated || 0;
    energy += shieldEnergy;
    console.log('[calculateAvailableEnergy] Shield', player.activeShield.card.name, 'contributes', shieldEnergy, 'energy (face-up)');
  } else if (player.activeShield && player.activeShield.faceDown) {
    console.log('[calculateAvailableEnergy] Shield', player.activeShield.card.name, 'is face-down, not contributing energy');
  } else if (!player.activeShield) {
    console.log('[calculateAvailableEnergy] No active shield');
  }
  
  console.log('[calculateAvailableEnergy] Total breakdown - Energy Cells:', energyCellEnergy, 'Allies:', allyEnergy, 'Relics:', relicEnergy, 'Shield:', shieldEnergy, 'Total:', energy);
  
  return energy;
};

// BuyCard: Handle buying cards from market
// This function is reusable across phases
// Uses destructured signature: ({ G, ctx }, stackId)
const buyCardMove = ({ G, ctx }, stackId) => {
  // Save state before move
  saveStateSnapshot(G);
  
  // Safety checks
  if (!G || !ctx) {
    console.error('[BuyCard] G or ctx is undefined');
    return INVALID_MOVE;
  }
  
  if (!ctx.currentPlayer) {
    console.error('[BuyCard] ctx.currentPlayer is undefined');
    return INVALID_MOVE;
  }
  
  if (stackId === undefined || stackId === null) {
    console.error('[BuyCard] stackId is undefined or null');
    return INVALID_MOVE;
  }
  
  console.log('[BuyCard] Global move called with stackId:', stackId, 'Type:', typeof stackId);
  console.log('[BuyCard] Current phase:', G.currentPhase || ctx.phase);
  console.log('[BuyCard] Market exists:', !!G.market);
  console.log('[BuyCard] Market length:', G.market?.length);
  console.log('[BuyCard] Market stacks:', G.market?.map((s, i) => ({ index: i, stackId: s.stackId, cardName: s.cardName, cardsRemaining: s.cards?.length })));
  
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  
  // Don't recalculate energy here - it should already be set from Energy Phase
  // Recalculating would reset it to the full amount, ignoring previous purchases
  // Only use the current G.availableEnergy value
  console.log('[BuyCard] Current availableEnergy before purchase:', G.availableEnergy);
  
  // Validate stack ID - stackId should be the array index
  if (!G.market) {
    console.error('[BuyCard] G.market is undefined or null');
    return INVALID_MOVE;
  }
  
  if (stackId < 0 || stackId >= G.market.length) {
    console.error('[BuyCard] Invalid stackId:', stackId, 'Market length:', G.market.length);
    console.error('[BuyCard] Valid stackId range: 0 to', G.market.length - 1);
    return INVALID_MOVE;
  }
  
  const stack = G.market[stackId];
  console.log('[BuyCard] Found stack at index', stackId, ':', { 
    stackId: stack?.stackId, 
    cardName: stack?.cardName, 
    cost: stack?.cost,
    cardsRemaining: stack?.cards?.length 
  });
  
  // Check if stack has cards
  if (!stack.cards || stack.cards.length === 0) {
    console.error('[BuyCard] Stack is empty:', stackId);
    return INVALID_MOVE;
  }
  
  console.log('[BuyCard] Stack info:', { stackId, cost: stack.cost, cardsRemaining: stack.cards.length, cardName: stack.cardName });
  
  // Market Logic: Use canAfford helper to check if player can afford the card
  const canBuy = canAfford({ cost: stack.cost }, G.availableEnergy);
  console.log('[BuyCard] Can afford check:', { cost: stack.cost, availableEnergy: G.availableEnergy, canBuy });
  
  if (!canBuy) {
    console.warn('[BuyCard] Cannot afford card. Cost:', stack.cost, 'Available:', G.availableEnergy);
    return INVALID_MOVE;
  }
  
  // Purchase the card
  const purchasedCard = stack.cards.pop();
  console.log('[BuyCard] Purchasing card:', purchasedCard.name, 'Cost:', stack.cost);
  
  // Deduct cost from availableEnergy
  G.availableEnergy = G.availableEnergy - stack.cost;
  console.log('[BuyCard] Energy after purchase:', G.availableEnergy);
  
  // Check for end game trigger: any 5 stacks of cards in the market are empty
  // This includes allies, energy coins, or fusion fragments
  const emptyStacks = G.market.filter(s => s.cards.length === 0).length;
  if (emptyStacks >= 5 && !G.finalRound) {
    G.finalRound = true;
    G.finalRoundTriggeredBy = playerId;
    G.finalRoundTurnsRemaining = ctx.numPlayers - 1; // All other players get one more turn
    addLogEntry(G, ctx, 'End Game Triggered', `5 market stacks are empty! Final round begins - all other players get one more turn.`);
    console.log('[BuyCard] End game triggered: 5 market stacks empty');
  }
  
  // Add purchased card to discard pile (as per rules)
  // CRITICAL: Ensure discard pile exists and belongs to the correct player
  if (!player.discard) {
    console.error('[BuyCard] ERROR: player.discard is undefined! Initializing for player:', playerId);
    player.discard = [];
  }
  // Defensive check: Verify we're using the correct player's discard pile
  if (playerId !== ctx.currentPlayer) {
    console.error('[BuyCard] ERROR: playerId mismatch! playerId:', playerId, 'ctx.currentPlayer:', ctx.currentPlayer);
  }
  player.discard.push(purchasedCard);
  console.log('[BuyCard] Card added to discard for player', playerId, '. Discard length:', player.discard.length, 'Card:', purchasedCard.name);
  
  // Add log entry
  addLogEntry(G, ctx, 'Bought Card', `${purchasedCard.name} (Cost: ${stack.cost} Energy, Remaining: ${stack.cards.length})`);
  
  // Don't return a value - we're mutating the draft, so Immer will handle the state update
  // Returning a value would cause: "An immer producer returned a new value *and* modified its draft"
};

// PlayCard: Handle playing cards from hand according to Dust to Dust rules
// This function is reusable across phases
// Uses destructured signature: ({ G, ctx }, cardId, playAsShield = false)
const playCardMove = ({ G, ctx }, cardId, playAsShield = false) => {
  // Save state before move
  saveStateSnapshot(G);
  
  // Safety checks: Ensure G and ctx are defined
  if (!G || !ctx) {
    console.error('[PlayCard] G or ctx is undefined', { G: !!G, ctx: !!ctx });
    return INVALID_MOVE;
  }
  
  // Safety check: Ensure currentPlayer exists
  if (!ctx.currentPlayer) {
    console.error('[PlayCard] ctx.currentPlayer is undefined');
    return INVALID_MOVE;
  }
  
  // Safety check: Ensure cardId is provided
  if (cardId === undefined || cardId === null) {
    console.error('[PlayCard] cardId is undefined or null');
    return INVALID_MOVE;
  }
  
  // PlayCard is a global move - available in all phases
  // Phase validation is enforced below to ensure proper phase order:
  // - ALLY phase: Only Ally cards and Fusion Fragments
  // - ENERGY phase: Only Energy Cells and Fusion Fragments
  // - ACQUISITION phase: No card playing (only buying)
  
  const currentPhase = G.currentPhase || ctx.phase;
  console.log('[PlayCard] Function called with cardId:', cardId);
  console.log('[PlayCard] Current phase:', currentPhase);
  console.log('[PlayCard] Context:', { currentPlayer: ctx.currentPlayer, phase: ctx.phase });
  
  const playerId = ctx.currentPlayer;
  
  // Safety check: Ensure players object exists
  if (!G.players || !G.players[playerId]) {
    console.error('[PlayCard] Player not found:', playerId, 'Available players:', Object.keys(G.players || {}));
    return INVALID_MOVE;
  }
  
  const player = G.players[playerId];
  
  console.log('[PlayCard] Player hand:', player.hand.map(c => ({ id: c.id, name: c.name })));
  
  // Find the card in hand
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  
  if (cardIndex === -1) {
    console.warn('[PlayCard] Card not found in hand. cardId:', cardId);
    return INVALID_MOVE;
  }
  
  // Remove card from hand
  const card = player.hand.splice(cardIndex, 1)[0];
  console.log('[PlayCard] Playing card:', { id: card.id, name: card.name, type: card.type, resourceType: card.resourceType });
  
  // Phase Restrictions: Enforce proper phase order
  // ALLY phase: Only Ally cards allowed (Energy Cells and Fusion Fragments must wait for ENERGY phase)
  // ENERGY phase: Only Energy Cells and Fusion Fragments allowed (Ally cards cannot be played)
  // ACQUISITION phase: No card playing allowed (only buying)
  // Note: Fusion Fragments and Energy Cells can still be targets of card effects (discard, dust, etc.) during any phase
  
  // Handle Energy Cells (Energy Coins)
  if (card.type === CARD_TYPES.RESOURCE && 
      card.resourceType === RESOURCE_TYPES.ENERGY_CELL) {
    
    // Phase Check: Energy Cells can be played during ALLY, ENERGY, RELIC, or SHIELD phases
    if (currentPhase === PHASES.ACQUISITION || currentPhase === PHASES.DISCARD || currentPhase === PHASES.RESET || currentPhase === PHASES.DUST) {
      // Put card back in hand
      player.hand.push(card);
      console.warn('[PlayCard] Cannot play Energy Cell during', currentPhase, 'phase. Energy Cells can only be played during ALLY, ENERGY, RELIC, or SHIELD phases.');
      return INVALID_MOVE;
    }
    
    console.log('[PlayCard] Processing Energy Cell - Card ID:', card.id, 'Card Name:', card.name);
    
    // Energy Cells do NOT cost an Ally Action
    // State Transition: Move card from hand to playArea
    player.playArea.push(card);
    console.log('[PlayCard] Card moved to playArea. PlayArea length:', player.playArea.length);
    
    // Add energy from this Energy Cell to existing energy pool
    // Don't recalculate from scratch - this preserves energy from other sources (e.g., Fusion Fragment discard)
    const energyValue = card.energyValue || 1;
    G.availableEnergy = (G.availableEnergy || 0) + energyValue;
    console.log('[PlayCard] Added', energyValue, 'energy from Energy Cell. Total:', G.availableEnergy, {
      energyCellsInPlayArea: player.playArea.filter(c => c.type === CARD_TYPES.RESOURCE && c.resourceType === RESOURCE_TYPES.ENERGY_CELL).length,
    });
    
    // Add log entry
    addLogEntry(G, ctx, 'Played Energy Cell', `+${energyValue} Energy (Total: ${G.availableEnergy})`);
    
    // Phase Advancement: Playing an energy coin advances from Relic, Shield, or Ally phase
    const currentPhaseForAdvance = ctx.phase || currentPhase;
    if (currentPhaseForAdvance === PHASES.ALLY) {
      console.log('[PlayCard] Energy coin played in ALLY phase - advancing to ENERGY phase');
      G.currentPhase = PHASES.ENERGY;
      if (ctx.events && ctx.events.setPhase) {
        ctx.events.setPhase(PHASES.ENERGY);
      }
    } else if (currentPhaseForAdvance === PHASES.RELIC || currentPhaseForAdvance === PHASES.SHIELD) {
      console.log('[PlayCard] Energy coin played in', currentPhaseForAdvance, 'phase - advancing to next phase');
      if (ctx.events && ctx.events.endPhase) {
        ctx.events.endPhase();
      }
    }
    
    return;
  }
  
  // Handle Fusion Fragments
  if (card.type === CARD_TYPES.RESOURCE && 
      card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT) {
    // Phase Check: Fusion Fragments can only be played during ENERGY phase (same as Energy Cells)
    // They must wait until after Ally phase is complete
    // Note: Fusion Fragments can still be targets of card effects (discard, dust, etc.) during any phase
    if (currentPhase === PHASES.ALLY || currentPhase === PHASES.ACQUISITION || currentPhase === PHASES.DISCARD || currentPhase === PHASES.RESET || currentPhase === PHASES.DUST) {
      // Put card back in hand
      player.hand.push(card);
      console.warn('[PlayCard] Cannot play Fusion Fragment during', currentPhase, 'phase. Fusion Fragments can only be played during ENERGY phase (or RELIC/SHIELD phases).');
      return INVALID_MOVE;
    }
    
    // Fusion Fragments don't cost an action, just move to play area
    player.playArea.push(card);
    return;
  }
  
  // Handle Ally cards
  if (card.type === CARD_TYPES.ALLY) {
    // Phase Check: Ally cards can only be played during ALLY phase (or RELIC/SHIELD phases for convenience)
    if (currentPhase === PHASES.ENERGY || currentPhase === PHASES.ACQUISITION || currentPhase === PHASES.DISCARD || currentPhase === PHASES.RESET || currentPhase === PHASES.DUST) {
      // Put card back in hand
      player.hand.push(card);
      console.warn('[PlayCard] Cannot play Ally card during', currentPhase, 'phase. Ally cards can only be played during ALLY phase (or RELIC/SHIELD phases).');
      return INVALID_MOVE;
    }
    
    // Shield Handling: If isShield is true AND playAsShield is true, play it as Shield
    if (card.isShield && playAsShield) {
      // Shield Replacement: If there's already an active shield, discard it first
      if (player.activeShield !== null) {
        const oldShield = player.activeShield.card;
        
        // EDGE CASE: Shield Energy - Remove energy contribution from removed/replaced shield
        // If the old shield was face-up (active) and generated energy, remove that energy
        if (!player.activeShield.faceDown && oldShield.energyGenerated) {
          const energyToRemove = oldShield.energyGenerated || 0;
          G.availableEnergy = Math.max(0, (G.availableEnergy || 0) - energyToRemove);
          console.log('[PlayCard] Shield Energy Edge Case: Removed', energyToRemove, 'energy from replaced shield', oldShield.name, '. New availableEnergy:', G.availableEnergy);
          addLogEntry(G, ctx, 'Shield Replaced', `${oldShield.name} replaced - ${energyToRemove} energy removed`);
        }
        
        // CRITICAL: Ensure discard pile exists before adding old shield
        if (!player.discard) {
          console.error('[PlayCard] ERROR: player.discard is undefined! Initializing for player:', playerId);
          player.discard = [];
        }
        player.discard.push(oldShield);
        console.log('[PlayCard] Replacing active shield:', oldShield.name, 'with new shield:', card.name, 'for player', playerId, '. Discard length:', player.discard.length);
        player.activeShield = null;
      }
      
      // Non-Efficient Shields require an Ally Action
      // Check the original subtype (Powerful cards require an action, Efficient don't)
      console.log('[PlayCard] Shield card subtype check:', {
        cardName: card.name,
        subtype: card.subtype,
        isEfficient: card.subtype === ALLY_SUBTYPES.EFFICIENT,
        allyActionsAvailable: player.allyActionsAvailable,
        playerId: playerId,
        playAreaAllies: player.playArea.filter(c => c.type === CARD_TYPES.ALLY).map(c => ({ name: c.name, subtype: c.subtype }))
      });
      
      // Debug: Check if allyActionsAvailable is undefined or null
      if (player.allyActionsAvailable === undefined || player.allyActionsAvailable === null) {
        console.warn('[PlayCard] allyActionsAvailable is undefined/null, initializing to 1');
        player.allyActionsAvailable = 1;
      }
      
      // Safety check: If allyActionsAvailable is 0, check if we've actually consumed an action
      // Efficient Allies don't consume actions, so if we only have Efficient Allies in playArea, we should still have 1 action
      if (player.allyActionsAvailable === 0) {
        const hasNonEfficientAllies = player.playArea.some(c => 
          c.type === CARD_TYPES.ALLY && c.subtype !== ALLY_SUBTYPES.EFFICIENT
        );
        const hasChargingShield = player.activeShield && player.activeShield.faceDown;
        
        // If we don't have any non-Efficient allies or charging shield, we should still have an action
        if (!hasNonEfficientAllies && !hasChargingShield) {
          console.warn('[PlayCard] allyActionsAvailable is 0 but should be 1 (only Efficient allies in playArea, no charging shield). Resetting to 1.');
          player.allyActionsAvailable = 1;
        }
      }
      
      if (card.subtype !== ALLY_SUBTYPES.EFFICIENT && player.allyActionsAvailable <= 0) {
        player.hand.push(card);
        console.warn('[PlayCard] Cannot play Shield - requires Ally Action but none available. Subtype:', card.subtype, 'Available:', player.allyActionsAvailable);
        return INVALID_MOVE;
      }
      
      // Move Shield card to activeShield slot, face-down
      player.activeShield = {
        card: card,
        faceDown: true, // Starts face-down, flips in Shield Phase
      };
      
      console.log('[PlayCard] Shield card moved to activeShield:', {
        cardName: card.name,
        faceDown: player.activeShield.faceDown,
        activeShieldObject: player.activeShield,
        cardId: card.id,
        handLength: player.hand.length,
        cardStillInHand: player.hand.some(c => c.id === card.id)
      });
      
      // Verify card was removed from hand
      if (player.hand.some(c => c.id === card.id)) {
        console.error('[PlayCard] ERROR: Card still in hand after playing as shield!', {
          cardId: card.id,
          cardName: card.name,
          hand: player.hand.map(c => ({ id: c.id, name: c.name }))
        });
        // Remove it again (safety check)
        const remainingIndex = player.hand.findIndex(c => c.id === card.id);
        if (remainingIndex !== -1) {
          player.hand.splice(remainingIndex, 1);
          console.log('[PlayCard] Removed duplicate card from hand');
        }
      }
      
      // Consume Ally Action if not Efficient
      if (card.subtype !== ALLY_SUBTYPES.EFFICIENT) {
        player.allyActionsAvailable -= 1;
        console.log('[PlayCard] Consumed Ally Action. Remaining:', player.allyActionsAvailable);
      } else {
        console.log('[PlayCard] Efficient Shield - no Ally Action consumed. Remaining:', player.allyActionsAvailable);
      }
      
      // Add log entry
      addLogEntry(G, ctx, 'Played Shield', `${card.name} (charging, will activate next turn)`);
      
      // Verify state is correct before returning
      console.log('[PlayCard] Final state check:', {
        activeShieldExists: player.activeShield !== null,
        activeShieldCardName: player.activeShield?.card?.name,
        activeShieldFaceDown: player.activeShield?.faceDown,
        handLength: player.hand.length,
        cardInHand: player.hand.some(c => c.id === card.id)
      });
      
      // Note: Shield cards don't generate immediate energy when played face-down
      // Return undefined to commit Immer mutations
      return;
    }
    
    // If card is Shield-capable but playAsShield is false, play it as regular Ally
    // (This allows Shield cards to be played normally even if there's already a shield)
    console.log('[PlayCard] Card is Shield-capable but playAsShield is false, playing as regular Ally:', card.name);
    
    // Efficient Allies can be played for free
    if (card.subtype === ALLY_SUBTYPES.EFFICIENT) {
      console.log('[PlayCard] Playing Efficient Ally as regular card:', card.name);
      console.log('[PlayCard] Efficient Ally - allyActionsAvailable before:', player.allyActionsAvailable, '(should NOT be decremented)');
      player.playArea.push(card);
      console.log('[PlayCard] Efficient Ally - allyActionsAvailable after:', player.allyActionsAvailable, '(should be unchanged)');
      
      // Immediate Energy: Add energyGenerated when played
      const energyGenerated = card.energyGenerated || 0;
      if (energyGenerated > 0) {
        G.availableEnergy = (G.availableEnergy || 0) + energyGenerated;
        console.log('[PlayCard] Added', energyGenerated, 'immediate energy from', card.name, 'Total:', G.availableEnergy);
      }
      
      // Add log entry
      const energyText = energyGenerated > 0 ? ` (+${energyGenerated} Energy)` : '';
      addLogEntry(G, ctx, 'Played Ally', `${card.name} (Efficient)${energyText}`);
      
      // Process Attack effects if this is an attack card
      if (hasAttackEffect(card)) {
        console.log('[PlayCard] Processing attack effect for', card.name);
        processAttackEffect(G, ctx, playerId, card);
      } else {
        // Process non-attack abilities
        processAllyAbility(G, ctx, playerId, card);
      }
      
      // Phase Advancement: Playing an ally card advances from Relic or Shield phase
      // Use the currentPhase variable declared at the top of the function
      const currentPhaseForAdvance = ctx.phase || currentPhase;
      if (currentPhaseForAdvance === PHASES.RELIC || currentPhaseForAdvance === PHASES.SHIELD) {
        console.log('[PlayCard] Ally card played in', currentPhaseForAdvance, 'phase - advancing to next phase');
        if (ctx.events && ctx.events.endPhase) {
          ctx.events.endPhase();
        }
      }
      
      return;
    }
    
    // Non-Efficient Allies (including Powerful/Shield cards played as regular) require an Ally Action
    // Check if "Next Powerful card is Efficient" effect is active
    // Also check if this is the first ally played this turn and player has The Gatekey
    const isFirstAllyThisTurn = player.playArea.filter(c => c.type === CARD_TYPES.ALLY).length === 0;
    const hasGatekey = [...(player.relics || []), ...(player.activeRelics || [])].some(r => r.name === 'The Gatekey');
    const gatekeyMakesEfficient = isFirstAllyThisTurn && hasGatekey && card.subtype !== ALLY_SUBTYPES.EFFICIENT;
    const isTreatedAsEfficient = (player.nextPowerfulIsEfficient && card.subtype === ALLY_SUBTYPES.POWERFUL) || gatekeyMakesEfficient;
    
    // The Overclock: Allow second powerful ally per turn
    const hasOverclock = [...(player.relics || []), ...(player.activeRelics || [])].some(r => r.name === 'The Overclock');
    const isPowerfulAlly = card.subtype === ALLY_SUBTYPES.POWERFUL;
    const powerfulAlliesPlayed = player.powerfulAlliesPlayedThisTurn || 0;
    if (isPowerfulAlly && !isTreatedAsEfficient && powerfulAlliesPlayed >= 1 && !hasOverclock) {
      // Already played one powerful ally this turn and don't have The Overclock
      player.hand.push(card);
      console.warn('[PlayCard] Cannot play second Powerful Ally - The Overclock required');
      return INVALID_MOVE;
    }
    
    console.log('[PlayCard] Non-Efficient Ally - checking Ally Action. Available:', player.allyActionsAvailable, 'Subtype:', card.subtype, 'Treated as Efficient:', isTreatedAsEfficient);
    
    // If treated as Efficient, skip the Ally Action check
    if (!isTreatedAsEfficient) {
      // Debug: Check if allyActionsAvailable is undefined or null (should never happen, but safety check)
      if (player.allyActionsAvailable === undefined || player.allyActionsAvailable === null) {
        console.warn('[PlayCard] allyActionsAvailable is undefined/null for non-Efficient ally. Should be 1 at start of turn. Initializing to 1.');
        player.allyActionsAvailable = 1;
      }
      
      // Additional check: If it's 0, check if we're at the start of a turn
      // Efficient allies don't consume Ally Actions, so if allyActionsAvailable is 0 and we only have Efficient allies
      // (or no non-Efficient allies) in playArea, we should still have an Ally Action available
      if (player.allyActionsAvailable === 0) {
        const hasChargingShield = player.activeShield && player.activeShield.faceDown;
        const hasActiveShield = player.activeShield && !player.activeShield.faceDown;
        
        // Check if any non-Efficient allies (that consume actions) are in playArea
        const nonEfficientAlliesInPlayArea = player.playArea.filter(card => 
          card.type === CARD_TYPES.ALLY && 
          card.subtype !== ALLY_SUBTYPES.EFFICIENT &&
          !(player.nextPowerfulIsEfficient && card.subtype === ALLY_SUBTYPES.POWERFUL)
        );
        const hasNonEfficientAllies = nonEfficientAlliesInPlayArea.length > 0;
        
        // If we have no non-Efficient allies in playArea and no charging shield that used an action,
        // we should still have an Ally Action available (Efficient allies don't consume actions)
        if (!hasNonEfficientAllies && !hasChargingShield) {
          console.warn('[PlayCard] allyActionsAvailable is 0 but should be 1 (only Efficient allies or no action-consuming cards in playArea). Resetting to 1.');
          player.allyActionsAvailable = 1;
        }
        // If we have a charging shield, check if it was played this turn (which would have consumed an action)
        // by checking if we're past early phases
        else if (hasChargingShield && !hasNonEfficientAllies) {
          const currentPhaseForCheck = ctx.phase || G.currentPhase || currentPhase;
          const isEarlyPhase = currentPhaseForCheck === PHASES.RELIC || currentPhaseForCheck === PHASES.SHIELD;
          // If we're in early phase and only have Efficient allies, the shield might be from previous turn
          // or we should still have an action available
          if (isEarlyPhase) {
            console.warn('[PlayCard] allyActionsAvailable is 0 with charging shield in early phase and only Efficient allies in playArea. Resetting to 1.');
            player.allyActionsAvailable = 1;
          }
        }
      }
      
      if (player.allyActionsAvailable <= 0) {
        // Put card back in hand BEFORE returning INVALID_MOVE
        // This ensures the card is restored even if the move is rejected
        player.hand.push(card);
        console.warn('[PlayCard] Cannot play non-Efficient Ally - no Ally Action available. Current value:', player.allyActionsAvailable, 'Card returned to hand.');
        return INVALID_MOVE;
      }
    }
    
    // Other non-Efficient Allies: Play to play area
    console.log('[PlayCard] Playing non-Efficient Ally to playArea:', card.name, isTreatedAsEfficient ? '(treated as Efficient)' : '');
    player.playArea.push(card);
    
    // Consume Ally Action only if not treated as Efficient
    if (!isTreatedAsEfficient) {
      player.allyActionsAvailable -= 1;
      // Track powerful allies played for The Overclock
      if (card.subtype === ALLY_SUBTYPES.POWERFUL) {
        player.powerfulAlliesPlayedThisTurn = (player.powerfulAlliesPlayedThisTurn || 0) + 1;
      }
    } else {
      // Clear the "Next Powerful card is Efficient" flag after using it
      if (player.nextPowerfulIsEfficient) {
        player.nextPowerfulIsEfficient = false;
        console.log('[PlayCard] Used "Next Powerful card is Efficient" effect, flag cleared');
      }
      // Clear The Gatekey flag after first ally
      if (gatekeyMakesEfficient) {
        player.firstAllyIsEfficient = false;
        console.log('[PlayCard] Used The Gatekey effect - first ally treated as Efficient');
      }
    }
    
    // Immediate Energy: Add energyGenerated when played
    const energyGenerated = card.energyGenerated || 0;
    if (energyGenerated > 0) {
      G.availableEnergy = (G.availableEnergy || 0) + energyGenerated;
      console.log('[PlayCard] Added', energyGenerated, 'immediate energy from', card.name, 'Total:', G.availableEnergy);
    }
    
    // Add log entry
    const energyText = energyGenerated > 0 ? ` (+${energyGenerated} Energy)` : '';
    const treatedText = isTreatedAsEfficient ? ' (treated as Efficient)' : '';
    addLogEntry(G, ctx, 'Played Ally', `${card.name}${treatedText}${energyText}`);
    
    // Process Attack effects if this is an attack card
    if (hasAttackEffect(card)) {
      console.log('[PlayCard] Processing attack effect for', card.name);
      processAttackEffect(G, ctx, playerId, card);
    } else {
      // Process non-attack abilities
      processAllyAbility(G, ctx, playerId, card);
    }
    
    // Phase Advancement: Playing an ally card advances from Relic or Shield phase
    // Use the currentPhase variable declared at the top of the function
    const currentPhaseForAdvance = ctx.phase || currentPhase;
    if (currentPhaseForAdvance === PHASES.RELIC || currentPhaseForAdvance === PHASES.SHIELD) {
      console.log('[PlayCard] Ally card played in', currentPhaseForAdvance, 'phase - advancing to next phase');
      if (ctx.events && ctx.events.endPhase) {
        ctx.events.endPhase();
      }
    }
    
    return;
  }
  
  // Invalid card type - put card back in hand
  player.hand.push(card);
  return INVALID_MOVE;
};

// PlayAllEnergyCoins: Play all Energy Coins from hand to play area
const playAllEnergyCoinsMove = ({ G, ctx }) => {
  // Save state before move
  saveStateSnapshot(G);
  
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  
  if (!player || !player.hand) {
    console.error('[PlayAllEnergyCoins] Player or hand not found');
    return INVALID_MOVE;
  }
  
  const currentPhase = G.currentPhase || ctx.phase;
  
  // Phase Check: Energy Cells can be played during ALLY, ENERGY, RELIC, or SHIELD phases
  if (currentPhase === PHASES.ACQUISITION || currentPhase === PHASES.DISCARD || currentPhase === PHASES.RESET || currentPhase === PHASES.DUST) {
    console.warn('[PlayAllEnergyCoins] Cannot play Energy Cells during', currentPhase, 'phase');
    return INVALID_MOVE;
  }
  
  // Find all Energy Coins in hand
  const energyCoins = player.hand.filter(card => 
    card.type === CARD_TYPES.RESOURCE && 
    card.resourceType === RESOURCE_TYPES.ENERGY_CELL
  );
  
  if (energyCoins.length === 0) {
    console.log('[PlayAllEnergyCoins] No Energy Coins in hand');
    return; // Not an error, just nothing to do
  }
  
  // Calculate total energy value and move all Energy Coins from hand to playArea
  let totalEnergy = 0;
  
  energyCoins.forEach(card => {
    const cardIndex = player.hand.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
      const removedCard = player.hand.splice(cardIndex, 1)[0];
      player.playArea.push(removedCard);
      const energyValue = removedCard.energyValue || 1;
      totalEnergy += energyValue;
    }
  });
  
  // Add total energy to available energy pool
  G.availableEnergy = (G.availableEnergy || 0) + totalEnergy;
  
  console.log('[PlayAllEnergyCoins] Played', energyCoins.length, 'Energy Coins. Added', totalEnergy, 'energy. Total:', G.availableEnergy);
  
  // Add log entry
  addLogEntry(G, ctx, 'Played All Energy Coins', `${energyCoins.length} Energy Coins played (+${totalEnergy} Energy, Total: ${G.availableEnergy})`);
  
  // Phase Advancement: Playing energy coins advances from Relic, Shield, or Ally phase
  const currentPhaseForAdvance = ctx.phase || currentPhase;
  if (currentPhaseForAdvance === PHASES.ALLY) {
    console.log('[PlayAllEnergyCoins] Energy coins played in ALLY phase - advancing to ENERGY phase');
    
    // CRITICAL: Recalculate energy to include shield energy before advancing to Energy phase
    // This ensures shield energy is included even if Energy Phase onBegin doesn't run
    const calculatedEnergy = calculateAvailableEnergy(G, playerId);
    G.availableEnergy = calculatedEnergy;
    console.log('[PlayAllEnergyCoins] Recalculated energy including shield:', calculatedEnergy);
    
    G.currentPhase = PHASES.ENERGY;
    if (ctx.events && ctx.events.setPhase) {
      ctx.events.setPhase(PHASES.ENERGY);
    }
  } else if (currentPhaseForAdvance === PHASES.RELIC || currentPhaseForAdvance === PHASES.SHIELD) {
    console.log('[PlayAllEnergyCoins] Energy coins played in', currentPhaseForAdvance, 'phase - advancing to next phase');
    if (ctx.events && ctx.events.endPhase) {
      ctx.events.endPhase();
    }
  }
  
  // Don't return a value - we're mutating the draft
};

// Helper function to enforce hand minimum during opponent's turn
// EDGE CASE: Hand Minimum - If player would have fewer than 3 cards during opponent's turn,
// draw until they have 3 cards. Only applies during opponent's turns, not player's own turn.
// Note: The Nobel Cloak relic increases minimum hand size to 4.
const enforceHandMinimum = (G, ctx, targetPlayerId, currentPlayerId) => {
  // Only enforce during opponent's turn (target is not the current player)
  if (targetPlayerId === currentPlayerId) {
    return; // Not an opponent's turn
  }
  
  const target = G.players[targetPlayerId];
  if (!target) return;
  
  // Check for The Nobel Cloak which increases minimum hand size to 4
  const hasNobelCloak = [...(target.relics || []), ...(target.activeRelics || [])].some(r => r.name === 'The Nobel Cloak');
  const minHandSize = hasNobelCloak ? 4 : 3;
  
  // Draw until hand reaches minimum size
  while (target.hand.length < minHandSize) {
    if (!drawCard(target, G, ctx, targetPlayerId)) {
      // Can't draw more cards (deck and discard empty)
      break;
    }
  }
  
  if (target.hand.length < minHandSize) {
    console.log('[enforceHandMinimum] Hand minimum not met for', targetPlayerId, '- only', target.hand.length, 'cards available (minimum:', minHandSize, ')');
  } else if (target.hand.length >= minHandSize) {
    console.log('[enforceHandMinimum] Hand minimum enforced for', targetPlayerId, '- now has', target.hand.length, 'cards (minimum:', minHandSize, ')');
  }
};

// Helper function to check if player is eliminated (decking out)
const checkPlayerElimination = (G, ctx, playerId) => {
  const player = G.players[playerId];
  if (!player) return false;
  
  // EDGE CASE: Decking Out - If deck is empty and no cards can be shuffled back, player is eliminated
  // Check if deck is empty
  if (player.deck.length === 0) {
    // Check if discard has any non-relic cards that could be shuffled
    const deckableCards = player.discard.filter(card => card.type !== CARD_TYPES.RELIC);
    
    // Check if hand has any non-relic cards that could be shuffled
    const handDeckableCards = player.hand.filter(card => card.type !== CARD_TYPES.RELIC);
    
    // If no cards can be shuffled back, player is eliminated
    if (deckableCards.length === 0 && handDeckableCards.length === 0) {
      console.log('[checkPlayerElimination] Player', playerId, 'is eliminated - no cards to shuffle back');
      addLogEntry(G, ctx, 'Player Eliminated', `Player ${playerId} eliminated - decked out`);
      
      // Calculate final score from relics
      const totalRelics = (player.relics?.length || 0) + (player.activeRelics?.length || 0);
      const relicPoints = totalRelics * 5; // Each relic is worth 5 VP
      player.victoryPoints = relicPoints;
      console.log('[checkPlayerElimination] Player', playerId, 'final score:', relicPoints, 'VP from', totalRelics, 'relic(s)');
      addLogEntry(G, ctx, 'Final Score', `Player ${playerId}: ${relicPoints} VP from ${totalRelics} relic(s)`);
      
      // Mark player as eliminated
      player.eliminated = true;
      
      return true;
    }
  }
  
  return false;
};

// Helper function to check if a player has decked out (no cards to draw)
const hasPlayerDeckedOut = (player) => {
  if (!player) return false;
  
  // Check if deck is empty
  if (player.deck.length === 0) {
    // Check if discard has any non-relic cards that could be shuffled
    const deckableCards = player.discard.filter(card => card.type !== CARD_TYPES.RELIC);
    
    // Check if hand has any non-relic cards that could be shuffled
    const handDeckableCards = player.hand.filter(card => card.type !== CARD_TYPES.RELIC);
    
    // If no cards can be shuffled back, player has decked out
    return deckableCards.length === 0 && handDeckableCards.length === 0;
  }
  
  return false;
};

// Helper function to check if all players have decked out (edge case game end)
const checkAllPlayersDeckedOut = (G, ctx) => {
  const playerIds = Object.keys(G.players);
  const allDeckedOut = playerIds.every(playerId => hasPlayerDeckedOut(G.players[playerId]));
  
  if (allDeckedOut) {
    console.log('[checkAllPlayersDeckedOut] All players have decked out - game ends');
    addLogEntry(G, ctx, 'End Game Triggered', 'All players have decked out - game ends');
    // Set final round flag if not already set (for consistency)
    if (!G.finalRound) {
      G.finalRound = true;
      G.finalRoundTriggeredBy = null; // No specific triggerer for this condition
    }
    return true;
  }
  
  return false;
};

// Helper function to calculate victory points for a player
// Counts VP from all cards the player owns: deck, hand, discard, playArea, activeShield, and relics
// Cards moved to dust are automatically excluded (not in player's areas)
// Cards retrieved from dust are automatically included (added back to player's areas)
export const calculateVictoryPoints = (player) => {
  if (!player) return 0;
  
  let vp = 0;
  
  // Relics: 5 VP each (in activeRelics and relics)
  vp += (player.relics?.length || 0) * 5;
  vp += (player.activeRelics?.length || 0) * 5;
  
  // Collect all cards from all player areas: deck, hand, discard, playArea, and activeShield
  const allCards = [
    ...(player.deck || []),
    ...(player.hand || []),
    ...(player.discard || []),
    ...(player.playArea || []),
  ];
  
  // Include active shield card if it exists
  if (player.activeShield && player.activeShield.card) {
    allCards.push(player.activeShield.card);
  }
  
  // Fusion Fragments: 2 VP each (in any location)
  const fusionFragments = allCards.filter(
    card => card.type === CARD_TYPES.RESOURCE && 
    card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT
  );
  
  vp += fusionFragments.length * 2;
  
  // Certain Allies may have VP (check card properties)
  allCards.forEach(card => {
    if (card.type === CARD_TYPES.ALLY && card.victoryPoints) {
      vp += card.victoryPoints;
    }
  });
  
  return vp;
};

// Helper function to end the game and calculate victory points for all players
const endGame = (G, ctx) => {
  console.log('[endGame] Game ending - calculating victory points for all players');
  addLogEntry(G, ctx, 'Game Over', 'Calculating final victory points...');
  
  // Calculate victory points for all players
  Object.keys(G.players).forEach(playerId => {
    const player = G.players[playerId];
    const vp = calculateVictoryPoints(player);
    player.victoryPoints = vp;
    console.log('[endGame] Player', playerId, 'final score:', vp, 'VP');
    addLogEntry(G, ctx, 'Final Score', `Player ${playerId}: ${vp} VP`);
  });
  
  // Set game over flag - this will be checked in turn.endIf
  G.gameOver = true;
  console.log('[endGame] Game over flag set');
};

// Robust drawCard function that handles all edge cases
// Note: Relics are never shuffled into the deck
const drawCard = (player, G = null, ctx = null, playerId = null) => {
  // Check Deck: If G.deck has cards, pop one and add it to G.hand
  if (player.deck.length > 0) {
    const drawnCard = player.deck.pop();
    // Only add non-relic cards to hand (relics shouldn't be in deck, but safety check)
    if (drawnCard.type !== CARD_TYPES.RELIC) {
      player.hand.push(drawnCard);
      return true; // Successfully drew a card
    }
  }

  // Refill Logic: If player.deck is empty AND player.discard has cards
  // CRITICAL: Only use THIS player's discard pile, not any other player's
  if (player.deck.length === 0 && player.discard && player.discard.length > 0) {
    // Filter out relics - they should never be shuffled into deck
    const deckableCards = player.discard.filter(card => card.type !== CARD_TYPES.RELIC);
    
    if (deckableCards.length === 0) {
      // Only relics in discard, can't refill
      // EDGE CASE: Decking Out - Check for elimination
      if (G && ctx && playerId) {
        checkPlayerElimination(G, ctx, playerId);
      }
      return false;
    }

    // Shuffle the deckable cards
    const shuffledDiscard = shuffleArray(deckableCards);
    
    // Move all shuffled cards from player.discard into player.deck
    // CRITICAL: Only shuffle THIS player's discard pile
    player.deck = shuffledDiscard;
    
    // Clear discard pile (all cards have been shuffled into deck)
    // Note: Relics never go to discard, so we can safely clear it
    player.discard = [];
    
    // Defensive logging
    if (G && ctx && playerId) {
      console.log('[drawCard] Shuffled discard into deck for player', playerId, '. Deck size:', player.deck.length, 'Discard size:', player.discard.length);
    }
    
    // Then, draw the card from the new player.deck
    const drawnCard = player.deck.pop();
    player.hand.push(drawnCard);
    return true; // Successfully drew a card after refilling
  }

  // Empty Case: If both G.deck and G.discard are empty, check for elimination
  // EDGE CASE: Decking Out - Check for elimination
  if (G && ctx && playerId) {
    checkPlayerElimination(G, ctx, playerId);
  }
  
  return false; // Could not draw a card
};

// DiscardFusionFragmentForEnergy: Handle Fuseforge Blacksmith choice - discard Fusion Fragment for +2 Energy
const discardFusionFragmentForEnergyMove = ({ G, ctx }, cardId) => {
  // Save state before move
  saveStateSnapshot(G);
  
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  
  // Must have a pending choice for this player
  if (!G.pendingChoice || G.pendingChoice.playerId !== playerId) {
    console.warn('[DiscardFusionFragmentForEnergy] No pending choice for this player');
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'discard_fusion_fragment') {
    console.warn('[DiscardFusionFragmentForEnergy] Pending choice is not discard_fusion_fragment');
    return INVALID_MOVE;
  }
  
  // Find the Fusion Fragment in hand
  const fusionFragmentIndex = player.hand.findIndex(card => 
    card.id === cardId &&
    card.type === CARD_TYPES.RESOURCE && 
    card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT
  );
  
  if (fusionFragmentIndex === -1) {
    console.warn('[DiscardFusionFragmentForEnergy] Fusion Fragment not found in hand');
    return INVALID_MOVE;
  }
  
  // Discard the Fusion Fragment and gain +2 Energy
  // CRITICAL: Ensure discard pile exists and belongs to the correct player
  if (!player.discard) {
    console.error('[DiscardFusionFragmentForEnergy] ERROR: player.discard is undefined! Initializing for player:', playerId);
    player.discard = [];
  }
  const discardedFragment = player.hand.splice(fusionFragmentIndex, 1)[0];
  player.discard.push(discardedFragment);
  console.log('[DiscardFusionFragmentForEnergy] Discarded Fusion Fragment for player', playerId, '. Discard length:', player.discard.length);
  G.availableEnergy = (G.availableEnergy || 0) + 2;
  
  console.log('[DiscardFusionFragmentForEnergy] Discarded Fusion Fragment, gained +2 Energy. Total:', G.availableEnergy);
  addLogEntry(G, ctx, 'Card Ability', `Fuseforge Blacksmith: Discarded Fusion Fragment for +2 Energy (Total: ${G.availableEnergy})`);
  
  // Clear the pending choice
  G.pendingChoice = null;
  
  // Don't return a value - we're mutating the draft, so Immer will handle the state update
  // Returning a value would cause: "An immer producer returned a new value *and* modified its draft"
};

// SkipFusionFragmentDiscard: Handle Fuseforge Blacksmith choice - skip the effect
const skipFusionFragmentDiscardMove = ({ G, ctx }) => {
  const playerId = ctx.currentPlayer;
  
  // Must have a pending choice for this player
  if (!G.pendingChoice || G.pendingChoice.playerId !== playerId) {
    console.warn('[SkipFusionFragmentDiscard] No pending choice for this player');
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'discard_fusion_fragment') {
    console.warn('[SkipFusionFragmentDiscard] Pending choice is not discard_fusion_fragment');
    return INVALID_MOVE;
  }
  
  console.log('[SkipFusionFragmentDiscard] Player chose to skip discarding Fusion Fragment');
  
  // Clear the pending choice
  G.pendingChoice = null;
  
  // Don't return a value - we're mutating the draft, so Immer will handle the state update
  // Returning a value would cause: "An immer producer returned a new value *and* modified its draft"
};

// WarhinoGeneralDustOpponent: Handle Warhino General choice - dust opponent card
// This handles the initial choice. If 3+ players, it sets up opponent selection.
// If 2 players or opponent already selected, it sets up card selection for the opponent.
const warhinoGeneralDustOpponentMove = ({ G, ctx }) => {
  console.log('[WarhinoGeneralDustOpponent] Move called. ctx.events:', ctx?.events ? 'exists' : 'undefined', 'ctx.events.setActivePlayers:', ctx?.events?.setActivePlayers ? 'exists' : 'undefined');
  const playerId = ctx.currentPlayer;
  // Normalize to string for consistent comparison
  const playerIdStr = String(playerId);
  const player = G.players[playerId];
  
  // Must have a pending choice for this player
  // Normalize both IDs to strings for comparison
  const pendingPlayerIdStr = G.pendingChoice ? String(G.pendingChoice.playerId) : null;
  if (!G.pendingChoice || pendingPlayerIdStr !== playerIdStr) {
    console.warn('[WarhinoGeneralDustOpponent] No pending choice for this player. pendingPlayerId:', pendingPlayerIdStr, 'playerId:', playerIdStr);
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'warhino_general_attack' && G.pendingChoice.choiceType !== 'warhino_general_shield') {
    console.warn('[WarhinoGeneralDustOpponent] Pending choice is not warhino_general');
    return INVALID_MOVE;
  }
  
  const targetId = G.pendingChoice.targetId;
  
  // If no targetId (3+ players), set up opponent selection
  if (!targetId) {
    const opponentIds = Object.keys(G.players).filter(id => id !== playerId);
    if (opponentIds.length === 0) {
      console.warn('[WarhinoGeneralDustOpponent] No opponents found');
      G.pendingChoice = null;
      return INVALID_MOVE;
    }
    
    // Set up choice to select opponent
    const originalChoiceType = G.pendingChoice.choiceType;
    G.pendingChoice = {
      playerId: playerId,
      card: G.pendingChoice.card,
      choiceType: originalChoiceType === 'warhino_general_attack' 
        ? 'warhino_general_select_opponent_attack' 
        : 'warhino_general_select_opponent_shield',
      message: 'Select an opponent to force to dust a card',
      opponentIds: opponentIds,
    };
    console.log('[WarhinoGeneralDustOpponent] Set up opponent selection for', opponentIds.length, 'opponent(s)');
    return;
  }
  
  // Target ID exists - proceed with dusting logic
  // Normalize targetId for player lookup (handle both string and number)
  const targetIdNormalized = targetId;
  const target = G.players[targetIdNormalized] || G.players[String(targetIdNormalized)];
  if (!target) {
    console.warn('[WarhinoGeneralDustOpponent] Target player not found:', targetId);
    G.pendingChoice = null;
    return INVALID_MOVE;
  }
  
  // CRITICAL: Check for shield FIRST - shield blocking takes precedence over card selection
  // Even if the target has cards, they can choose to block with shield instead
  // Check if target has shield that can block
  if (target.activeShield && !target.activeShield.faceDown) {
    // Shield can block - set up pending attack
    G.pendingAttack = {
      attackerId: playerId,
      targetId: targetIdNormalized,
      card: G.pendingChoice.card,
      effect: 'dust card',
    };
    G.pendingChoice = null;
    console.log('[WarhinoGeneralDustOpponent] Attack pending - target can block with shield. pendingAttack:', {
      attackerId: playerId,
      targetId: targetIdNormalized,
      effect: 'dust card',
      pendingChoice: G.pendingChoice ? 'exists' : 'null'
    });
    
    // Set target player as active so they can respond to the attack
    if (ctx.events && ctx.events.setActivePlayers) {
      try {
        ctx.events.setActivePlayers({
          value: {
            [playerId]: 'default', // Keep attacker active
            [targetIdNormalized]: 'attackResponse', // Activate target for response
          },
        });
        console.log('[WarhinoGeneralDustOpponent] Set active players for attack response - attacker:', playerId, 'target:', targetIdNormalized);
      } catch (error) {
        console.error('[WarhinoGeneralDustOpponent] ERROR calling setActivePlayers:', error);
      }
    } else {
      console.warn('[WarhinoGeneralDustOpponent] ctx.events.setActivePlayers not available! ctx.events:', ctx?.events);
      console.log('[WarhinoGeneralDustOpponent] Turn.onMove hook should activate target player after this move completes');
    }
    
    // NOTE: The Turn.onMove hook will run after this move completes and should activate the target player
    // since ctx.events is not available in move functions
    
    return;
  }
  
  // No shield - set up choice for opponent to select which card to dust
  if (target.hand.length > 0) {
    const originalChoiceType = G.pendingChoice.choiceType;
    G.pendingChoice = {
      playerId: targetIdNormalized, // This choice is for the target opponent
      card: G.pendingChoice.card,
      choiceType: originalChoiceType === 'warhino_general_attack' 
        ? 'warhino_general_select_card_attack' 
        : 'warhino_general_select_card_shield',
      message: `Select a card from your hand to dust (forced by ${playerId})`,
      attackerId: playerId, // Store who is forcing this
      targetId: targetIdNormalized,
    };
    console.log('[WarhinoGeneralDustOpponent] Set up card selection for opponent', targetIdNormalized, 'with', target.hand.length, 'card(s) in hand');
    
    // Allow the target player to make moves even though they're not the current player
    // Use setActivePlayers to activate BOTH players:
    // - Current player (attacker) stays active in their normal stage
    // - Target player becomes active in attackResponse stage
    console.log('[WarhinoGeneralDustOpponent] About to set active players. ctx:', ctx ? 'exists' : 'null', 'ctx.events:', ctx?.events ? 'exists' : 'null');
    if (ctx && ctx.events && ctx.events.setActivePlayers) {
      try {
        const currentPlayerId = ctx.currentPlayer;
        console.log('[WarhinoGeneralDustOpponent] Calling setActivePlayers for both players. Current:', currentPlayerId, 'Target:', targetIdNormalized, 'stage: attackResponse');
        const result = ctx.events.setActivePlayers({
          value: { 
            [currentPlayerId]: 'default', // Keep current player active
            [targetIdNormalized]: 'attackResponse'  // Activate target player in attackResponse stage
          },
        });
        console.log('[WarhinoGeneralDustOpponent] setActivePlayers returned:', result);
        console.log('[WarhinoGeneralDustOpponent] SUCCESS: Set active players for both current and target');
      } catch (error) {
        console.error('[WarhinoGeneralDustOpponent] ERROR calling setActivePlayers:', error);
        console.error('[WarhinoGeneralDustOpponent] Error stack:', error?.stack);
      }
    } else {
      console.warn('[WarhinoGeneralDustOpponent] ctx.events.setActivePlayers not available!');
      console.warn('[WarhinoGeneralDustOpponent] ctx:', ctx);
      console.warn('[WarhinoGeneralDustOpponent] ctx.events:', ctx?.events);
      console.warn('[WarhinoGeneralDustOpponent] ctx.events.setActivePlayers:', ctx?.events?.setActivePlayers);
    }
  } else {
    // Target has no cards in hand - this should not happen per game rules
    // Players should always have cards in hand (drawn at end of turn)
    // Log warning but complete attack with no effect
    console.warn('[WarhinoGeneralDustOpponent] WARNING: Opponent has no cards in hand to dust! This suggests a game logic bug (cards should have been drawn at end of turn).');
    console.warn('[WarhinoGeneralDustOpponent] Target hand size:', target.hand.length, 'Discard size:', target.discard.length, 'Deck size:', target.deck.length);
    G.pendingChoice = null;
    // Attack completes with no effect - nothing to dust
  }
};

// WarhinoGeneralSelectOpponent: Handle Warhino General - select which opponent to target
const warhinoGeneralSelectOpponentMove = ({ G, ctx }, selectedOpponentId) => {
  const playerId = ctx.currentPlayer;
  // Normalize to string for consistent comparison
  const playerIdStr = String(playerId);
  
  // Must have a pending choice for this player
  // Normalize both IDs to strings for comparison
  const pendingPlayerIdStr = G.pendingChoice ? String(G.pendingChoice.playerId) : null;
  if (!G.pendingChoice || pendingPlayerIdStr !== playerIdStr) {
    console.warn('[WarhinoGeneralSelectOpponent] No pending choice for this player. pendingPlayerId:', pendingPlayerIdStr, 'playerId:', playerIdStr);
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'warhino_general_select_opponent_attack' && 
      G.pendingChoice.choiceType !== 'warhino_general_select_opponent_shield') {
    console.warn('[WarhinoGeneralSelectOpponent] Pending choice is not warhino_general_select_opponent');
    return INVALID_MOVE;
  }
  
  // Validate selected opponent - normalize IDs for comparison
  const selectedOpponentIdStr = String(selectedOpponentId);
  const opponentIdsNormalized = G.pendingChoice.opponentIds.map(id => String(id));
  if (!selectedOpponentId || !opponentIdsNormalized.includes(selectedOpponentIdStr)) {
    console.warn('[WarhinoGeneralSelectOpponent] Invalid opponent selected:', selectedOpponentId, 'Available:', opponentIdsNormalized);
    return INVALID_MOVE;
  }
  
  // Use the original selectedOpponentId (not string) to access players object
  const actualOpponentId = G.pendingChoice.opponentIds.find(id => String(id) === selectedOpponentIdStr) || selectedOpponentId;
  
  // Use actualOpponentId for all subsequent operations
  const finalTargetId = actualOpponentId;
  
  const target = G.players[finalTargetId] || G.players[selectedOpponentIdStr];
  if (!target) {
    console.warn('[WarhinoGeneralSelectOpponent] Target player not found:', selectedOpponentId, 'actualOpponentId:', actualOpponentId);
    return INVALID_MOVE;
  }
  
  // Check if target has shield that can block
  if (target.activeShield && !target.activeShield.faceDown) {
    // Shield can block - set up pending attack
    G.pendingAttack = {
      attackerId: playerId,
      targetId: finalTargetId,
      card: G.pendingChoice.card,
      effect: 'dust card',
    };
    G.pendingChoice = null;
    console.log('[WarhinoGeneralSelectOpponent] Attack pending - target can block with shield');
    
    // Set target player as active so they can respond to the attack
    if (ctx.events && ctx.events.setActivePlayers) {
      try {
        ctx.events.setActivePlayers({
          value: {
            [playerId]: 'default', // Keep attacker active
            [finalTargetId]: 'attackResponse', // Activate target for response
          },
        });
        console.log('[WarhinoGeneralSelectOpponent] Set active players for attack response - attacker:', playerId, 'target:', finalTargetId);
      } catch (error) {
        console.error('[WarhinoGeneralSelectOpponent] ERROR calling setActivePlayers:', error);
      }
    } else {
      console.warn('[WarhinoGeneralSelectOpponent] ctx.events.setActivePlayers not available! ctx.events:', ctx?.events);
    }
    
    return;
  }
  
  // No shield - set up choice for opponent to select which card to dust
  if (target.hand.length > 0) {
    const originalChoiceType = G.pendingChoice.choiceType;
    G.pendingChoice = {
      playerId: finalTargetId, // This choice is for the target opponent
      card: G.pendingChoice.card,
      choiceType: originalChoiceType === 'warhino_general_select_opponent_attack' 
        ? 'warhino_general_select_card_attack' 
        : 'warhino_general_select_card_shield',
      message: `Select a card from your hand to dust (forced by ${playerId})`,
      attackerId: playerId, // Store who is forcing this
      targetId: finalTargetId,
    };
    console.log('[WarhinoGeneralSelectOpponent] Set up card selection for opponent', finalTargetId, 'with', target.hand.length, 'card(s) in hand');
    
    // Allow the target player to make moves even though they're not the current player
    // Use setActivePlayers to activate the target player in the attackResponse stage
    if (ctx.events && ctx.events.setActivePlayers) {
      try {
        console.log('[WarhinoGeneralSelectOpponent] Setting active player to attackResponse stage for player:', finalTargetId);
        ctx.events.setActivePlayers({
          value: { [finalTargetId]: 'attackResponse' },
        });
        console.log('[WarhinoGeneralSelectOpponent] SUCCESS: Set active player for target');
      } catch (error) {
        console.error('[WarhinoGeneralSelectOpponent] ERROR calling setActivePlayers:', error);
      }
    } else {
      console.warn('[WarhinoGeneralSelectOpponent] ctx.events.setActivePlayers not available! ctx.events:', ctx?.events);
    }
  } else {
    console.log('[WarhinoGeneralSelectOpponent] Opponent has no cards in hand to dust');
    G.pendingChoice = null;
  }
};

// WarhinoGeneralSelectCard: Handle Warhino General - opponent selects which card to dust
// NOTE: This move must be available to the player with the pendingChoice, even if they're not the current player
// We use ctx.playerID (the client making the call) instead of ctx.currentPlayer to allow non-current players
const warhinoGeneralSelectCardMove = ({ G, ctx }, cardId) => {
  console.log('[WarhinoGeneralSelectCard] Move function called! cardId:', cardId);
  console.log('[WarhinoGeneralSelectCard] Current phase:', ctx.phase, 'G.currentPhase:', G.currentPhase);
  console.log('[WarhinoGeneralSelectCard] Current player:', ctx.currentPlayer);
  console.log('[WarhinoGeneralSelectCard] PlayerID (client):', ctx.playerID);
  
  // Save state before move
  saveStateSnapshot(G);
  
  // NOTE: This move is only available to players in the 'attackResponse' stage
  // boardgame.io validates stage membership BEFORE calling this function
  // So if we get here, the player should be authorized
  console.log('[WarhinoGeneralSelectCard] Move called with cardId:', cardId);
  console.log('[WarhinoGeneralSelectCard] ctx.currentPlayer:', ctx.currentPlayer, 'ctx.playerID:', ctx.playerID);
  console.log('[WarhinoGeneralSelectCard] ctx.activePlayers:', ctx.activePlayers);
  
  // Must have a pending choice
  if (!G.pendingChoice) {
    console.warn('[WarhinoGeneralSelectCard] No pending choice exists');
    return INVALID_MOVE;
  }
  
  // Use pendingChoice.playerId as the source of truth
  // boardgame.io should have already validated that this player is in the attackResponse stage
  const playerId = G.pendingChoice.playerId;
  // Normalize to string for consistent comparison
  const playerIdStr = String(playerId);
  console.log('[WarhinoGeneralSelectCard] Using playerId from pendingChoice:', playerId, 'playerIdStr:', playerIdStr);
  
  // Verify the player is in the attackResponse stage (boardgame.io should have checked this)
  // Normalize keys for comparison
  const activePlayerKey = Object.keys(ctx.activePlayers || {}).find(key => String(key) === playerIdStr);
  if (ctx.activePlayers && (!activePlayerKey || ctx.activePlayers[activePlayerKey] !== 'attackResponse')) {
    console.warn('[WarhinoGeneralSelectCard] WARNING: Player', playerId, 'is not in attackResponse stage. activePlayers:', ctx.activePlayers);
    // This shouldn't happen if boardgame.io is working correctly, but log it
  }
  
  if (G.pendingChoice.choiceType !== 'warhino_general_select_card_attack' && 
      G.pendingChoice.choiceType !== 'warhino_general_select_card_shield') {
    console.warn('[WarhinoGeneralSelectCard] Pending choice is not warhino_general_select_card. Actual type:', G.pendingChoice.choiceType);
    return INVALID_MOVE;
  }
  
  // Validate that this player is the target (normalize to string for comparison)
  const targetIdStr = String(G.pendingChoice.targetId);
  if (targetIdStr !== playerIdStr) {
    console.warn('[WarhinoGeneralSelectCard] Player', playerIdStr, 'is not the target', targetIdStr);
    return INVALID_MOVE;
  }
  
  // Use the original playerId (not string) to access players object
  const player = G.players[playerId] || G.players[playerIdStr];
  if (!player) {
    console.warn('[WarhinoGeneralSelectCard] Player not found:', playerId);
    return INVALID_MOVE;
  }
  
  // Find the card in hand
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    console.warn('[WarhinoGeneralSelectCard] Card not found in hand:', cardId, 'Available cards:', player.hand.map(c => ({ id: c.id, name: c.name })));
    return INVALID_MOVE;
  }
  
  // Dust the selected card
  const dusted = player.hand.splice(cardIndex, 1)[0];
  moveToDust(G, dusted);
  console.log('[WarhinoGeneralSelectCard] Opponent', playerId, 'selected card to dust:', dusted.name, '(forced by', G.pendingChoice.attackerId, ')');
  
  // Add log entry
  const attackerName = G.players[G.pendingChoice.attackerId]?.name || `Player ${G.pendingChoice.attackerId}`;
  addLogEntry(G, ctx, 'Warhino General', `${playerId} dusted ${dusted.name} (forced by ${G.pendingChoice.attackerId})`);
  
  // Save attackerId before clearing pendingChoice
  const attackerId = G.pendingChoice?.attackerId || ctx.currentPlayer;
  
  // EDGE CASE: Hand Minimum - After attack effect completes, enforce hand minimum for target
  // This ensures target has at least 3 cards (or 4 with The Nobel Cloak) during opponent's turn
  if (attackerId && playerId !== attackerId) {
    enforceHandMinimum(G, ctx, playerId, attackerId);
  }
  
  // Clear the pending choice
  G.pendingChoice = null;
  
  // End the attackResponse stage so control returns to the current player
  // After ending the stage, explicitly set the current player (attacker) as active again
  if (ctx.events && ctx.events.endStage) {
    ctx.events.endStage();
    console.log('[WarhinoGeneralSelectCard] Ended attackResponse stage');
    
    // Explicitly return control to the current player (attacker)
    // This ensures they can continue their turn after the attack response
    if (ctx.events.setActivePlayers) {
      ctx.events.setActivePlayers({
        value: { [attackerId]: 'default' },
      });
      console.log('[WarhinoGeneralSelectCard] Returned control to attacker:', attackerId);
    }
  } else {
    console.warn('[WarhinoGeneralSelectCard] ctx.events.endStage not available! ctx.events:', ctx?.events);
  }
  
  console.log('[WarhinoGeneralSelectCard] Move completed successfully, pendingChoice cleared');
};

// WarhinoGeneralRetrieve: Handle Warhino General choice - retrieve 1 from Dust
// This sets up a pending choice for the player to select which card to retrieve
const warhinoGeneralRetrieveMove = ({ G, ctx }) => {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  
  // Must have a pending choice for this player
  if (!G.pendingChoice || G.pendingChoice.playerId !== playerId) {
    console.warn('[WarhinoGeneralRetrieve] No pending choice for this player');
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'warhino_general_attack' && G.pendingChoice.choiceType !== 'warhino_general_shield') {
    console.warn('[WarhinoGeneralRetrieve] Pending choice is not warhino_general');
    return INVALID_MOVE;
  }
  
  // Check if there are any retrievable cards in Dust (non-Relics)
  const retrievableCards = G.dust.filter(card => card.type !== CARD_TYPES.RELIC);
  
  if (retrievableCards.length === 0) {
    console.log('[WarhinoGeneralRetrieve] No cards found in Dust to retrieve');
    // Clear the pending choice since there's nothing to retrieve
    G.pendingChoice = null;
    return;
  }
  
  // Update the pending choice to allow card selection
  G.pendingChoice = {
    ...G.pendingChoice,
    choiceType: G.pendingChoice.choiceType === 'warhino_general_attack' 
      ? 'warhino_general_select_retrieve_attack' 
      : 'warhino_general_select_retrieve_shield',
    message: 'Select a card from The Dust to retrieve:',
  };
  
  console.log('[WarhinoGeneralRetrieve] Pending choice updated - player can now select a card from Dust');
  
  // Don't return a value - we're mutating the draft, so Immer will handle the state update
};

// WarhinoGeneralSelectRetrieve: Handle Warhino General - retrieve the selected card from Dust
const warhinoGeneralSelectRetrieveMove = ({ G, ctx }, cardId) => {
  // Save state before move
  saveStateSnapshot(G);
  
  console.log('[WarhinoGeneralSelectRetrieve] Move called with cardId:', cardId);
  console.log('[WarhinoGeneralSelectRetrieve] ctx.currentPlayer:', ctx.currentPlayer, 'ctx.playerID:', ctx.playerID);
  
  // Must have a pending choice
  if (!G.pendingChoice) {
    console.warn('[WarhinoGeneralSelectRetrieve] No pending choice exists');
    return INVALID_MOVE;
  }
  
  // Use pendingChoice.playerId as the source of truth (player making the choice)
  const playerId = G.pendingChoice.playerId;
  const player = G.players[playerId];
  
  if (!player) {
    console.warn('[WarhinoGeneralSelectRetrieve] Player not found:', playerId);
    return INVALID_MOVE;
  }
  
  // Verify this is the correct player (should match ctx.currentPlayer or ctx.playerID)
  const playerIdStr = String(playerId);
  const currentPlayerStr = String(ctx.currentPlayer || ctx.playerID || '');
  console.log('[WarhinoGeneralSelectRetrieve] Using playerId from pendingChoice:', playerId, 'currentPlayer:', ctx.currentPlayer, 'playerID:', ctx.playerID);
  
  if (G.pendingChoice.choiceType !== 'warhino_general_select_retrieve_attack' && 
      G.pendingChoice.choiceType !== 'warhino_general_select_retrieve_shield') {
    console.warn('[WarhinoGeneralSelectRetrieve] Pending choice is not warhino_general_select_retrieve. Actual type:', G.pendingChoice.choiceType);
    return INVALID_MOVE;
  }
  
  // Find the card in Dust
  const dustCardIndex = G.dust.findIndex(card => card.id === cardId);
  
  if (dustCardIndex === -1) {
    console.warn('[WarhinoGeneralSelectRetrieve] Card not found in Dust:', cardId);
    return INVALID_MOVE;
  }
  
  const retrievedCard = G.dust[dustCardIndex];
  
  // Cannot retrieve Relics
  if (retrievedCard.type === CARD_TYPES.RELIC) {
    console.warn('[WarhinoGeneralSelectRetrieve] Cannot retrieve Relics');
    return INVALID_MOVE;
  }
  
  // Remove card from Dust and add to player's hand
  G.dust.splice(dustCardIndex, 1);
  player.hand.push(retrievedCard);
  
  console.log('[WarhinoGeneralSelectRetrieve] Retrieved', retrievedCard.name, 'from Dust and added to player', playerId, 'hand');
  console.log('[WarhinoGeneralSelectRetrieve] Player hand size after retrieve:', player.hand.length);
  
  // Add log entry
  addLogEntry(G, ctx, 'Retrieved Card', `${playerId} retrieved ${retrievedCard.name} from The Dust`);
  
  // Clear the pending choice
  G.pendingChoice = null;
  
  // Don't return a value - we're mutating the draft, so Immer will handle the state update
};

// MachbootChaserSelectOpponent: Handle Machboot Chaser - select which opponent to attack (3+ players)
const machbootChaserSelectOpponentMove = ({ G, ctx }, selectedOpponentId) => {
  const playerId = ctx.currentPlayer;
  
  // Must have a pending choice for this player
  if (!G.pendingChoice || G.pendingChoice.playerId !== playerId) {
    console.warn('[MachbootChaserSelectOpponent] No pending choice for this player');
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'machboot_chaser_select_opponent') {
    console.warn('[MachbootChaserSelectOpponent] Pending choice is not machboot_chaser_select_opponent');
    return INVALID_MOVE;
  }
  
  // Validate selected opponent
  if (!selectedOpponentId || !G.pendingChoice.opponentIds.includes(selectedOpponentId)) {
    console.warn('[MachbootChaserSelectOpponent] Invalid opponent selected:', selectedOpponentId);
    return INVALID_MOVE;
  }
  
  const target = G.players[selectedOpponentId];
  if (!target) {
    console.warn('[MachbootChaserSelectOpponent] Target player not found:', selectedOpponentId);
    return INVALID_MOVE;
  }
  
  // The Satellite: Shield from first attack each round
  const hasSatellite = [...(target.relics || []), ...(target.activeRelics || [])].some(r => r.name === 'The Satellite');
  const satelliteCanBlock = hasSatellite && !target.satelliteShieldUsed;
  
  // Check if target has an active shield that can block, or The Satellite can block
  if ((target.activeShield && !target.activeShield.faceDown) || satelliteCanBlock) {
    // Set up pending attack for shield blocking
    G.pendingAttack = {
      attackerId: playerId,
      targetId: selectedOpponentId,
      card: G.pendingChoice.card,
      effect: 'discard 1',
      satelliteBlock: satelliteCanBlock,
    };
    G.pendingChoice = null;
    console.log('[MachbootChaserSelectOpponent] Attack pending - target can block with', satelliteCanBlock ? 'The Satellite' : 'shield');
    return;
  }
  
  // No shield: Set up pending choice for target to select card to discard
  if (target.hand.length > 0) {
    G.pendingChoice = {
      playerId: selectedOpponentId, // This choice is for the target opponent
      card: G.pendingChoice.card,
      choiceType: 'machboot_chaser_discard',
      message: 'Select a card to discard',
      attackerId: playerId, // Store who is attacking
      targetId: selectedOpponentId,
    };
    console.log('[MachbootChaserSelectOpponent] Set up discard choice for opponent', selectedOpponentId, 'with', target.hand.length, 'card(s) in hand');
    
    // Allow the target player to make moves even though they're not the current player
    // Use setActivePlayers to activate the target player in the attackResponse stage
    if (ctx.events && ctx.events.setActivePlayers) {
      try {
        console.log('[MachbootChaserSelectOpponent] Setting active player to attackResponse stage for player:', selectedOpponentId);
        ctx.events.setActivePlayers({
          value: { [selectedOpponentId]: 'attackResponse' },
        });
        console.log('[MachbootChaserSelectOpponent] SUCCESS: Set active player for target');
      } catch (error) {
        console.error('[MachbootChaserSelectOpponent] ERROR calling setActivePlayers:', error);
      }
    } else {
      console.warn('[MachbootChaserSelectOpponent] ctx.events.setActivePlayers not available! ctx.events:', ctx?.events);
    }
  } else {
    // Target has no cards in hand - attacker still draws
    const attacker = G.players[playerId];
    const ability = G.pendingChoice.card.ability.toLowerCase();
    if (ability.includes('you draw 1')) {
      if (drawCard(attacker, G, ctx, playerId)) {
        console.log('[MachbootChaserSelectOpponent] Attacker drew 1 card (target had no cards to discard)');
      }
    }
    G.pendingChoice = null;
  }
};

// MachbootChaserSelectCard: Handle Machboot Chaser - target selects which card to discard (sets up confirmation)
// NOTE: Use ctx.playerID to allow non-current players to respond
const machbootChaserSelectCardMove = ({ G, ctx }, cardId) => {
  // Use ctx.playerID (the client making the call) to allow non-current players to respond
  // If ctx.playerID is not available, try to use the pending choice's playerId
  let playerId = ctx.playerID;
  if (playerId === undefined || playerId === null) {
    // Fallback: use pending choice's playerId if available
    if (G.pendingChoice && G.pendingChoice.playerId !== undefined) {
      playerId = G.pendingChoice.playerId;
      console.log('[MachbootChaserSelectCard] ctx.playerID not available, using pendingChoice.playerId:', playerId);
    } else {
      playerId = ctx.currentPlayer;
    }
  }
  // Normalize to string for consistent comparison (boardgame.io uses string IDs)
  const playerIdStr = String(playerId);
  console.log('[MachbootChaserSelectCard] Move called by player:', playerId, 'playerIdStr:', playerIdStr, 'currentPlayer:', ctx.currentPlayer, 'ctx.playerID:', ctx.playerID);
  
  // Must have a pending choice for this player (the target opponent)
  // Normalize both IDs to strings for comparison
  const pendingPlayerIdStr = G.pendingChoice ? String(G.pendingChoice.playerId) : null;
  if (!G.pendingChoice || pendingPlayerIdStr !== playerIdStr) {
    console.warn('[MachbootChaserSelectCard] No pending choice for this player. pendingChoice:', G.pendingChoice, 'pendingPlayerId:', pendingPlayerIdStr, 'playerId:', playerIdStr, 'ctx.playerID:', ctx.playerID);
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'machboot_chaser_discard') {
    console.warn('[MachbootChaserSelectCard] Pending choice is not machboot_chaser_discard');
    return INVALID_MOVE;
  }
  
  // Validate that this player is the target (normalize to string for comparison)
  const targetIdStr = String(G.pendingChoice.targetId);
  if (targetIdStr !== playerIdStr) {
    console.warn('[MachbootChaserSelectCard] Player', playerIdStr, 'is not the target', targetIdStr);
    return INVALID_MOVE;
  }
  
  // Use the original playerId (not string) to access players object
  const player = G.players[playerId] || G.players[playerIdStr];
  if (!player) {
    console.warn('[MachbootChaserSelectCard] Player not found:', playerId);
    return INVALID_MOVE;
  }
  
  // Find the card in hand
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    console.warn('[MachbootChaserSelectCard] Card not found in hand:', cardId);
    return INVALID_MOVE;
  }
  
  // Set up confirmation state - don't discard yet, just store the selected card
  G.pendingChoice = {
    ...G.pendingChoice,
    choiceType: 'machboot_chaser_confirm_discard',
    selectedCardId: cardId,
    message: `Confirm: Discard ${player.hand[cardIndex].name}?`,
  };
  
  console.log('[MachbootChaserSelectCard] Card selected for discard confirmation:', player.hand[cardIndex].name);
};

// MachbootChaserConfirmDiscard: Handle Machboot Chaser - confirm and execute the discard
const machbootChaserConfirmDiscardMove = ({ G, ctx }) => {
  // Save state before move
  saveStateSnapshot(G);
  
  // Use ctx.playerID (the client making the call) to allow non-current players to respond
  // If ctx.playerID is not available, try to use the pending choice's playerId
  let playerId = ctx.playerID;
  if (playerId === undefined || playerId === null) {
    // Fallback: use pending choice's playerId if available
    if (G.pendingChoice && G.pendingChoice.playerId !== undefined) {
      playerId = G.pendingChoice.playerId;
      console.log('[MachbootChaserConfirmDiscard] ctx.playerID not available, using pendingChoice.playerId:', playerId);
    } else {
      playerId = ctx.currentPlayer;
    }
  }
  // Normalize to string for consistent comparison (boardgame.io uses string IDs)
  const playerIdStr = String(playerId);
  console.log('[MachbootChaserConfirmDiscard] Move called by player:', playerId, 'playerIdStr:', playerIdStr, 'currentPlayer:', ctx.currentPlayer, 'ctx.playerID:', ctx.playerID);
  
  // Must have a pending choice for this player (the target opponent)
  // Normalize both IDs to strings for comparison
  const pendingPlayerIdStr = G.pendingChoice ? String(G.pendingChoice.playerId) : null;
  if (!G.pendingChoice || pendingPlayerIdStr !== playerIdStr) {
    console.warn('[MachbootChaserConfirmDiscard] No pending choice for this player. pendingChoice:', G.pendingChoice, 'pendingPlayerId:', pendingPlayerIdStr, 'playerId:', playerIdStr, 'ctx.playerID:', ctx.playerID);
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'machboot_chaser_confirm_discard') {
    console.warn('[MachbootChaserConfirmDiscard] Pending choice is not machboot_chaser_confirm_discard');
    return INVALID_MOVE;
  }
  
  // Validate that this player is the target (normalize to string for comparison)
  const targetIdStr = String(G.pendingChoice.targetId);
  if (targetIdStr !== playerIdStr) {
    console.warn('[MachbootChaserConfirmDiscard] Player', playerIdStr, 'is not the target', targetIdStr);
    return INVALID_MOVE;
  }
  
  // Use the original playerId (not string) to access players object
  const player = G.players[playerId] || G.players[playerIdStr];
  if (!player) {
    console.warn('[MachbootChaserConfirmDiscard] Player not found:', playerId);
    return INVALID_MOVE;
  }
  
  // Find the selected card in hand
  const cardIndex = player.hand.findIndex(card => card.id === G.pendingChoice.selectedCardId);
  if (cardIndex === -1) {
    console.warn('[MachbootChaserConfirmDiscard] Selected card not found in hand:', G.pendingChoice.selectedCardId);
    G.pendingChoice = null;
    return INVALID_MOVE;
  }
  
  // Discard the selected card
  // CRITICAL: Ensure discard pile exists and belongs to the correct player (target, not attacker)
  if (!player.discard) {
    console.error('[MachbootChaserConfirmDiscard] ERROR: player.discard is undefined! Initializing for player:', playerId);
    player.discard = [];
  }
  // Defensive check: Verify we're discarding to the target's discard pile, not the attacker's
  // targetIdStr was already declared and validated above, so we can reuse it
  if (playerIdStr !== targetIdStr) {
    console.error('[MachbootChaserConfirmDiscard] ERROR: playerId mismatch! playerId:', playerIdStr, 'targetId:', targetIdStr);
  }
  const discarded = player.hand.splice(cardIndex, 1)[0];
  player.discard.push(discarded);
  console.log('[MachbootChaserConfirmDiscard] Opponent', playerId, 'discarded:', discarded.name, '(attacked by', G.pendingChoice.attackerId, '). Discard length:', player.discard.length);
  
  // Attacker draws a card
  const attacker = G.players[G.pendingChoice.attackerId];
  if (attacker) {
    const ability = G.pendingChoice.card.ability.toLowerCase();
    if (ability.includes('you draw 1')) {
      if (drawCard(attacker, G, ctx, G.pendingChoice.attackerId)) {
        console.log('[MachbootChaserConfirmDiscard] Attacker drew 1 card');
      }
    }
  }
  
  // Add log entry
  addLogEntry(G, ctx, 'Attack Resolved', `${G.pendingChoice.card.name}: ${discarded.name} discarded`);
  
  // Clear pending attack if it exists (from shield blocking scenario)
  if (G.pendingAttack && G.pendingAttack.targetId === playerId) {
    G.pendingAttack = null;
  }
  
  // Save attackerId before clearing pendingChoice
  const attackerId = G.pendingChoice?.attackerId || ctx.currentPlayer;
  
  // EDGE CASE: Hand Minimum - After attack effect completes, enforce hand minimum for target
  // This ensures target has at least 3 cards (or 4 with The Nobel Cloak) during opponent's turn
  if (attackerId && playerId !== attackerId) {
    enforceHandMinimum(G, ctx, playerId, attackerId);
  }
  
  // Clear the pending choice
  G.pendingChoice = null;
  
  // End the attackResponse stage so control returns to the current player
  // After ending the stage, explicitly set the current player (attacker) as active again
  if (ctx.events && ctx.events.endStage) {
    ctx.events.endStage();
    console.log('[MachbootChaserConfirmDiscard] Ended attackResponse stage');
    
    // Explicitly return control to the current player (attacker)
    // This ensures they can continue their turn after the attack response
    if (ctx.events.setActivePlayers) {
      ctx.events.setActivePlayers({
        value: { [attackerId]: 'default' },
      });
      console.log('[MachbootChaserConfirmDiscard] Returned control to attacker:', attackerId);
    }
  } else {
    console.warn('[MachbootChaserConfirmDiscard] ctx.events.endStage not available! ctx.events:', ctx?.events);
  }
};

// PoisonhandChancellorSelectCard: Handle Poisonhand Chancellor - opponent selects which card to discard
// This processes opponents sequentially - after one discards, the next one gets a choice
const poisonhandChancellorSelectCardMove = ({ G, ctx }, cardId) => {
  console.log('[PoisonhandChancellorSelectCard] Move function called! cardId:', cardId);
  
  // Save state before move
  saveStateSnapshot(G);
  
  // Use pendingChoice.playerId as the source of truth
  const playerId = G.pendingChoice?.playerId;
  console.log('[PoisonhandChancellorSelectCard] Using playerId from pendingChoice:', playerId);
  
  // Must have a pending choice
  if (!G.pendingChoice) {
    console.warn('[PoisonhandChancellorSelectCard] No pending choice exists');
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'poisonhand_chancellor_discard') {
    console.warn('[PoisonhandChancellorSelectCard] Pending choice is not poisonhand_chancellor_discard');
    return INVALID_MOVE;
  }
  
  const player = G.players[playerId];
  if (!player) {
    console.warn('[PoisonhandChancellorSelectCard] Player not found:', playerId);
    return INVALID_MOVE;
  }
  
  // Find the card in hand
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    console.warn('[PoisonhandChancellorSelectCard] Card not found in hand:', cardId);
    return INVALID_MOVE;
  }
  
  // Save attackerId and card before modifying pendingChoice
  const attackerId = G.pendingChoice.attackerId;
  const card = G.pendingChoice.card;
  const remainingOpponents = G.pendingChoice.remainingOpponents || [];
  
  // Discard the selected card
  // CRITICAL: Ensure discard pile exists and belongs to the correct player (target, not attacker)
  if (!player.discard) {
    console.error('[PoisonhandChancellorSelectCard] ERROR: player.discard is undefined! Initializing for player:', playerId);
    player.discard = [];
  }
  // Defensive check: Verify we're discarding to the target's discard pile
  if (playerId !== G.pendingChoice.playerId) {
    console.error('[PoisonhandChancellorSelectCard] ERROR: playerId mismatch! playerId:', playerId, 'pendingChoice.playerId:', G.pendingChoice.playerId);
  }
  const discarded = player.hand.splice(cardIndex, 1)[0];
  player.discard.push(discarded);
  console.log('[PoisonhandChancellorSelectCard] Opponent', playerId, 'discarded:', discarded.name, '(attacked by', attackerId, '). Discard length:', player.discard.length);
  
  // Check if there are more opponents to process
  if (remainingOpponents.length > 0) {
    // Process next opponent
    const nextOpponentId = remainingOpponents[0];
    const nextOpponent = G.players[nextOpponentId];
    
    if (nextOpponent && nextOpponent.hand.length > 0) {
      // Set up pending choice for next opponent
      G.pendingChoice = {
        playerId: nextOpponentId,
        card: card,
        choiceType: 'poisonhand_chancellor_discard',
        message: 'Select a card to discard',
        attackerId: attackerId,
        targetId: nextOpponentId,
        remainingOpponents: remainingOpponents.slice(1), // Remove first from remaining
      };
      console.log('[PoisonhandChancellorSelectCard] Set up discard choice for next opponent', nextOpponentId, 'with', remainingOpponents.length - 1, 'remaining');
      
      // Set active players: keep attacker active, activate next opponent
      if (ctx.events && ctx.events.setActivePlayers) {
        try {
          ctx.events.setActivePlayers({
            value: {
              [attackerId]: 'default',
              [nextOpponentId]: 'attackResponse',
            },
          });
          console.log('[PoisonhandChancellorSelectCard] Set active players for next opponent');
        } catch (error) {
          console.error('[PoisonhandChancellorSelectCard] ERROR calling setActivePlayers:', error);
        }
      }
    } else {
      // Next opponent has no cards, skip them - process remaining or finish
      console.log('[PoisonhandChancellorSelectCard] Next opponent', nextOpponentId, 'has no cards, checking remaining');
      
      // Try to find next opponent with cards
      let foundNext = false;
      for (let i = 1; i < remainingOpponents.length; i++) {
        const nextId = remainingOpponents[i];
        const next = G.players[nextId];
        if (next && next.hand.length > 0) {
          G.pendingChoice = {
            playerId: nextId,
            card: card,
            choiceType: 'poisonhand_chancellor_discard',
            message: 'Select a card to discard',
            attackerId: attackerId,
            targetId: nextId,
            remainingOpponents: remainingOpponents.slice(i + 1),
          };
          if (ctx.events && ctx.events.setActivePlayers) {
            ctx.events.setActivePlayers({
              value: {
                [attackerId]: 'default',
                [nextId]: 'attackResponse',
              },
            });
          }
          foundNext = true;
          break;
        }
      }
      
      if (!foundNext) {
        // All opponents processed - attacker draws and we're done
        G.pendingChoice = null;
        const attacker = G.players[attackerId];
        if (attacker) {
          const ability = card.ability.toLowerCase();
          if (ability.includes('you draw 1') || ability.includes('draw 1')) {
            if (drawCard(attacker, G, ctx, attackerId)) {
              console.log('[PoisonhandChancellorSelectCard] Attacker drew 1 card');
            }
          }
        }
        
        // End stage and return control
        if (ctx.events && ctx.events.endStage) {
          ctx.events.endStage();
          if (ctx.events.setActivePlayers) {
            ctx.events.setActivePlayers({
              value: { [attackerId]: 'default' },
            });
          }
        }
      }
    }
  } else {
    // All opponents processed - attacker draws and we're done
    const attacker = G.players[attackerId];
    
    // EDGE CASE: Hand Minimum - After all attack effects complete, enforce hand minimum for all targets
    // This ensures targets have at least 3 cards (or 4 with The Nobel Cloak) during opponent's turn
    // Note: For Poisonhand Chancellor, we process all opponents, so we need to check each one
    const allOpponentIds = Object.keys(G.players).filter(id => id !== attackerId);
    allOpponentIds.forEach(opponentId => {
      enforceHandMinimum(G, ctx, opponentId, attackerId);
    });
    
    // Clear the pending choice
    G.pendingChoice = null;
    
    // Attacker draws card
    if (attacker) {
      const ability = card.ability.toLowerCase();
      if (ability.includes('you draw 1') || ability.includes('draw 1')) {
        if (drawCard(attacker, G, ctx, attackerId)) {
          console.log('[PoisonhandChancellorSelectCard] Attacker drew 1 card');
        }
      }
    }
    
    // End the attackResponse stage and return control to attacker
    if (ctx.events && ctx.events.endStage) {
      ctx.events.endStage();
      console.log('[PoisonhandChancellorSelectCard] Ended attackResponse stage');
      
      if (ctx.events.setActivePlayers) {
        ctx.events.setActivePlayers({
          value: { [attackerId]: 'default' },
        });
        console.log('[PoisonhandChancellorSelectCard] Returned control to attacker:', attackerId);
      }
    } else {
      console.warn('[PoisonhandChancellorSelectCard] ctx.events.endStage not available! ctx.events:', ctx?.events);
    }
  }
  
  console.log('[PoisonhandChancellorSelectCard] Move completed successfully');
};

// DustseekerDronesSelectOpponent: Handle Dustseeker Drones - select which opponent to attack (3+ players)
const dustseekerDronesSelectOpponentMove = ({ G, ctx }, selectedOpponentId) => {
  const playerId = ctx.currentPlayer;
  
  // Must have a pending choice for this player
  if (!G.pendingChoice || G.pendingChoice.playerId !== playerId) {
    console.warn('[DustseekerDronesSelectOpponent] No pending choice for this player');
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'dustseeker_drones_select_opponent') {
    console.warn('[DustseekerDronesSelectOpponent] Pending choice is not dustseeker_drones_select_opponent');
    return INVALID_MOVE;
  }
  
  // Validate selected opponent
  if (!selectedOpponentId || !G.pendingChoice.opponentIds.includes(selectedOpponentId)) {
    console.warn('[DustseekerDronesSelectOpponent] Invalid opponent selected:', selectedOpponentId);
    return INVALID_MOVE;
  }
  
  const target = G.players[selectedOpponentId];
  if (!target) {
    console.warn('[DustseekerDronesSelectOpponent] Target player not found:', selectedOpponentId);
    return INVALID_MOVE;
  }
  
  // Check if target has shield
  if (target.activeShield && !target.activeShield.faceDown) {
    // Set up pending attack for shield blocking
    G.pendingAttack = {
      attackerId: playerId,
      targetId: selectedOpponentId,
      card: G.pendingChoice.card,
      effect: 'dust card',
    };
    G.pendingChoice = null;
    console.log('[DustseekerDronesSelectOpponent] Attack pending - target can block with shield');
    return;
  }
  
  // No shield - set up choice for opponent to select which card to dust
  if (target.hand.length > 0) {
    G.pendingChoice = {
      playerId: selectedOpponentId,
      card: G.pendingChoice.card,
      choiceType: 'dustseeker_drones_dust',
      message: 'Select a card from your hand to dust',
      attackerId: playerId,
      targetId: selectedOpponentId,
    };
    console.log('[DustseekerDronesSelectOpponent] Set up dust choice for opponent', selectedOpponentId, 'with', target.hand.length, 'card(s) in hand');
    
    // Set active players: keep attacker active, activate target
    if (ctx.events && ctx.events.setActivePlayers) {
      try {
        ctx.events.setActivePlayers({
          value: {
            [playerId]: 'default',
            [selectedOpponentId]: 'attackResponse',
          },
        });
        console.log('[DustseekerDronesSelectOpponent] Set active players for both attacker and target');
      } catch (error) {
        console.error('[DustseekerDronesSelectOpponent] ERROR calling setActivePlayers:', error);
      }
    }
  } else {
    // Target has no cards - attacker still draws
    const attacker = G.players[playerId];
    const ability = G.pendingChoice.card.ability.toLowerCase();
    if (ability.includes('draw 1')) {
      if (drawCard(attacker, G, ctx, playerId)) {
        console.log('[DustseekerDronesSelectOpponent] Attacker drew 1 card (target had no cards to dust)');
      }
    }
    G.pendingChoice = null;
  }
};

// DustseekerDronesSelectCard: Handle Dustseeker Drones - opponent selects which card to dust
const dustseekerDronesSelectCardMove = ({ G, ctx }, cardId) => {
  console.log('[DustseekerDronesSelectCard] Move function called! cardId:', cardId);
  
  // Save state before move
  saveStateSnapshot(G);
  
  // Use pendingChoice.playerId as the source of truth
  const playerId = G.pendingChoice?.playerId;
  console.log('[DustseekerDronesSelectCard] Using playerId from pendingChoice:', playerId);
  
  // Must have a pending choice
  if (!G.pendingChoice) {
    console.warn('[DustseekerDronesSelectCard] No pending choice exists');
    return INVALID_MOVE;
  }
  
  if (G.pendingChoice.choiceType !== 'dustseeker_drones_dust') {
    console.warn('[DustseekerDronesSelectCard] Pending choice is not dustseeker_drones_dust');
    return INVALID_MOVE;
  }
  
  const player = G.players[playerId];
  if (!player) {
    console.warn('[DustseekerDronesSelectCard] Player not found:', playerId);
    return INVALID_MOVE;
  }
  
  // Find the card in hand
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    console.warn('[DustseekerDronesSelectCard] Card not found in hand:', cardId);
    return INVALID_MOVE;
  }
  
  // Save attackerId and card before clearing pendingChoice
  const attackerId = G.pendingChoice.attackerId;
  const card = G.pendingChoice.card;
  
  // Dust the selected card
  const dusted = player.hand.splice(cardIndex, 1)[0];
  moveToDust(G, dusted);
  console.log('[DustseekerDronesSelectCard] Opponent', playerId, 'dusted:', dusted.name, '(attacked by', attackerId, ')');
  
  // Attacker draws a card
  const attacker = G.players[attackerId];
  if (attacker) {
    const ability = card.ability.toLowerCase();
    if (ability.includes('draw 1')) {
      if (drawCard(attacker, G, ctx, attackerId)) {
        console.log('[DustseekerDronesSelectCard] Attacker drew 1 card');
      }
    }
  }
  
  // Add log entry
  addLogEntry(G, ctx, 'Attack Resolved', `${card.name}: ${dusted.name} dusted`);
  
  // EDGE CASE: Hand Minimum - After attack effect completes, enforce hand minimum for target
  // This ensures target has at least 3 cards (or 4 with The Nobel Cloak) during opponent's turn
  if (attackerId && playerId !== attackerId) {
    enforceHandMinimum(G, ctx, playerId, attackerId);
  }
  
  // Clear the pending choice
  G.pendingChoice = null;
  
  // End the attackResponse stage and return control to attacker
  if (ctx.events && ctx.events.endStage) {
    ctx.events.endStage();
    console.log('[DustseekerDronesSelectCard] Ended attackResponse stage');
    
    if (ctx.events.setActivePlayers) {
      ctx.events.setActivePlayers({
        value: { [attackerId]: 'default' },
      });
      console.log('[DustseekerDronesSelectCard] Returned control to attacker:', attackerId);
    }
  } else {
    console.warn('[DustseekerDronesSelectCard] ctx.events.endStage not available! ctx.events:', ctx?.events);
  }
  
  console.log('[DustseekerDronesSelectCard] Move completed successfully');
};

// Shared EndTurn function - handles all end-of-turn logic
// This ensures shields flip consistently regardless of which phase EndTurn is called from
const endTurnMove = ({ G, ctx }) => {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  
  console.log('[EndTurn] Ending turn for player:', playerId);
  console.log('[EndTurn] Hand size before:', player.hand.length);
  console.log('[EndTurn] PlayArea size before:', player.playArea.length);
  console.log('[EndTurn] Discard size before:', player.discard.length);
  console.log('[EndTurn] Deck size before:', player.deck.length);
  
  // CRITICAL: Ensure discard pile exists and belongs to the correct player
  if (!player.discard) {
    console.error('[EndTurn] ERROR: player.discard is undefined! Initializing for player:', playerId);
    player.discard = [];
  }
  // Defensive check: Verify we're using the correct player's discard pile
  if (playerId !== ctx.currentPlayer) {
    console.error('[EndTurn] ERROR: playerId mismatch! playerId:', playerId, 'ctx.currentPlayer:', ctx.currentPlayer);
  }
  
  // Step 1: Move all remaining cards from hand to discardPile
  if (player.hand.length > 0) {
    player.discard.push(...player.hand);
    console.log('[EndTurn] Moved', player.hand.length, 'cards from hand to discard for player', playerId, '. Discard length:', player.discard.length);
    player.hand = [];
  }
  
  // Step 2: Move all cards from playArea (spent energy/allies) to discardPile
  // IMPORTANT: activeShield is NOT moved to discard - it persists on the board
  if (player.playArea.length > 0) {
    player.discard.push(...player.playArea);
    console.log('[EndTurn] Moved', player.playArea.length, 'cards from playArea to discard for player', playerId, '. Discard length:', player.discard.length);
    player.playArea = [];
  }
  
  // Persistence: activeShield stays on the board (not moved to discard)
  // Step 2.5: Flip face-down (charging) shields face-up at end of turn
  // IMPORTANT: Only flip the current player's shield. Shield effects will be processed
  // in Shield Phase onBegin when the shield owner's turn starts (not here).
  if (player.activeShield) {
    // CRITICAL: Verify shield card reference is valid
    if (!player.activeShield.card) {
      console.error('[EndTurn] ERROR: activeShield exists but card is null/undefined! This should not happen.');
      // Clear invalid shield to prevent further issues
      player.activeShield = null;
      console.log('[EndTurn] Cleared invalid shield');
    } else {
      const shieldCardName = player.activeShield.card?.name || 'Unknown';
      const shieldCardId = player.activeShield.card?.id;
      console.log('[EndTurn] activeShield persists on board:', shieldCardName, 'faceDown:', player.activeShield.faceDown, 'cardId:', shieldCardId);
      
      // CRITICAL: Store a copy of the card reference to ensure it persists through mutations
      const shieldCardRef = player.activeShield.card;
      
      // If shield is face-down (charging), flip it face-up
      // NOTE: Shield effects are NOT processed here - they are processed in Shield Phase onBegin
      // when the shield owner's turn starts, ensuring the correct player sees the prompt
      if (player.activeShield.faceDown === true) {
        console.log('[EndTurn] Flipping charging shield face-up:', shieldCardName);
        player.activeShield.faceDown = false;
        console.log('[EndTurn] Shield flipped! New faceDown value:', player.activeShield.faceDown);
        console.log('[EndTurn] Shield effect will be processed when shield owner\'s turn starts (Shield Phase onBegin)');
        
        // CRITICAL: Verify shield still exists after flip and restore card reference if needed
        if (!player.activeShield || !player.activeShield.card) {
          console.error('[EndTurn] ERROR: activeShield disappeared after flip! Attempting to restore...');
          if (shieldCardRef) {
            player.activeShield = {
              card: shieldCardRef,
              faceDown: false
            };
            console.log('[EndTurn] Shield restored after flip:', {
              cardName: shieldCardRef.name,
              cardId: shieldCardRef.id,
              faceDown: false
            });
          }
        } else {
          // Ensure card reference is still valid
          if (!player.activeShield.card || player.activeShield.card.id !== shieldCardId) {
            console.warn('[EndTurn] WARNING: Shield card reference changed after flip! Restoring original reference...');
            player.activeShield.card = shieldCardRef;
          }
          console.log('[EndTurn] Shield verified after flip:', {
            cardName: player.activeShield.card.name,
            cardId: player.activeShield.card.id,
            faceDown: player.activeShield.faceDown
          });
        }
        // Do NOT process shield effect here - it will be processed in Shield Phase onBegin
      } else {
        // Shield is already face-up - verify it still exists and card reference is valid
        if (!player.activeShield.card || player.activeShield.card.id !== shieldCardId) {
          console.warn('[EndTurn] WARNING: Shield card reference may be invalid! Restoring if possible...');
          if (shieldCardRef) {
            player.activeShield.card = shieldCardRef;
          }
        }
        console.log('[EndTurn] Shield already face-up, verifying persistence:', {
          cardName: player.activeShield.card?.name,
          cardId: player.activeShield.card?.id,
          faceDown: player.activeShield.faceDown
        });
      }
    }
  } else {
    console.log('[EndTurn] No activeShield for player:', playerId);
  }
  
  // Step 2.6: Check and flip ALL other players' charging shields
  // When a player ends their turn, any opponent's charging shields should flip
  // This ensures shields flip at the end of the turn after they were played
  const allPlayerIds = Object.keys(G.players);
  allPlayerIds.forEach(otherPlayerId => {
    if (otherPlayerId !== playerId) {
      const otherPlayer = G.players[otherPlayerId];
      if (otherPlayer && otherPlayer.activeShield && otherPlayer.activeShield.faceDown === true) {
        console.log('[EndTurn] Flipping opponent\'s charging shield face-up:', otherPlayer.activeShield.card.name, 'for player:', otherPlayerId);
        otherPlayer.activeShield.faceDown = false;
        console.log('[EndTurn] Opponent shield flipped! Effect will be processed when their turn starts');
        // Do NOT process shield effect here - it will be processed in Shield Phase onBegin
        // when the shield owner's turn starts, ensuring the correct player sees the prompt
      }
    }
  });
  
  console.log('[EndTurn] Discard size after moving cards:', player.discard.length);
  
  // Step 2.75: Reset turn-specific flags (dusted, etc.) so they reset when turn ends
  player.hasDustedThisTurn = false;
  console.log('[EndTurn] Reset hasDustedThisTurn to false');
  
  // Step 2.8: Draw cards back up to starting hand size
  // Check for The Founder's Ring which increases starting hand size to 6
  const hasFoundersRing = [...(player.relics || []), ...(player.activeRelics || [])].some(r => r.name === "The Founder's Ring");
  const targetHandSize = hasFoundersRing ? 6 : (player.startingHandSize || 5);
  
  console.log('[EndTurn] Drawing cards back up to starting hand size:', targetHandSize, hasFoundersRing ? '(The Founder\'s Ring: 6 cards)' : '');
  
  // Draw cards until hand reaches target size
  while (player.hand.length < targetHandSize) {
    // If deck is empty, shuffle discard into deck
    // CRITICAL: Only use THIS player's discard pile, not any other player's
    if (player.deck.length === 0 && player.discard && player.discard.length > 0) {
      // Filter out relics - they should never be shuffled into deck
      const deckableCards = player.discard.filter(card => card.type !== CARD_TYPES.RELIC);
      
      if (deckableCards.length === 0) {
        // Only relics in discard, can't refill - stop drawing
        console.warn('[EndTurn] Only relics in discard, cannot refill deck for player', playerId);
        break;
      }
      
      // Use ctx.random.Shuffle if available, otherwise use shuffleArray
      let shuffledCards;
      if (ctx.random && ctx.random.Shuffle) {
        shuffledCards = ctx.random.Shuffle(deckableCards);
      } else {
        shuffledCards = shuffleArray(deckableCards);
      }
      
      // Move shuffled cards to deck
      // CRITICAL: Only shuffle THIS player's discard pile
      player.deck = shuffledCards;
      
      // Clear discard pile (all cards have been shuffled into deck)
      // Note: Relics never go to discard, so we can safely clear it
      player.discard = [];
      
      console.log('[EndTurn] Shuffled discard into deck for player', playerId, '. New deck size:', player.deck.length, 'Discard size:', player.discard.length);
    }
    
    // Draw a card from deck
    if (player.deck.length > 0) {
      const drawnCard = player.deck.pop();
      // Only add non-relic cards to hand
      if (drawnCard.type !== CARD_TYPES.RELIC) {
        player.hand.push(drawnCard);
        console.log('[EndTurn] Drew card:', drawnCard.name);
      }
    } else {
      // Deck is empty and discard is empty (or only has relics)
      console.warn('[EndTurn] Cannot draw more cards - deck and discard are empty');
      break;
    }
    
    // Stop if we've reached target hand size
    if (player.hand.length >= targetHandSize) {
      break;
    }
  }
  
  console.log('[EndTurn] Finished drawing. Final hand size:', player.hand.length, 'Target was:', targetHandSize);
  
  // CRITICAL: Verify hand was actually drawn and persisted
  if (player.hand.length < targetHandSize) {
    console.warn('[EndTurn] WARNING: Hand size is', player.hand.length, 'but target was', targetHandSize, '- cards may not have been drawn properly');
  } else {
    console.log('[EndTurn] Hand verification: Successfully drew', player.hand.length, 'cards. Hand contents:', player.hand.map(c => c.name).join(', '));
  }
  
  // CRITICAL: Final verification that activeShield persists after all EndTurn operations
  if (player.activeShield) {
    console.log('[EndTurn] FINAL VERIFICATION - activeShield still exists:', {
      cardName: player.activeShield.card?.name,
      cardId: player.activeShield.card?.id,
      faceDown: player.activeShield.faceDown,
      playerId: playerId
    });
  } else {
    console.warn('[EndTurn] FINAL VERIFICATION - activeShield is NULL/UNDEFINED for player:', playerId, 'This should not happen if shield was played!');
  }
  
  // Step 3: Reset availableEnergy to 0
  G.availableEnergy = 0;
  console.log('[EndTurn] Reset availableEnergy to 0');
  
  // Add log entry for ending turn
  addLogEntry(G, ctx, 'Ended Turn', `Turn ${ctx.turn} ended`);
  
  // Step 4: Set flag to end turn
  G._endTurnRequested = true;
  console.log('[EndTurn] Set _endTurnRequested flag');
  console.log('[EndTurn] Current phase:', ctx.phase || G.currentPhase);
  console.log('[EndTurn] Current player:', ctx.currentPlayer, 'Turn:', ctx.turn);
  
  // Step 5: Try to end the turn using available methods
  // In phase-based games, we need to use the phase system or turn.endIf
  // Try ctx.events.endTurn() first if available
  if (ctx.events && ctx.events.endTurn) {
    console.log('[EndTurn] ctx.events.endTurn() is available, calling it');
    ctx.events.endTurn();
  } else {
    console.log('[EndTurn] ctx.events.endTurn() not available');
    // Force phase to advance to DUST (last phase) which has endIf to check the flag
    // Use setPhase to properly transition, which will trigger endIf evaluation
    if (ctx.events && ctx.events.setPhase) {
      console.log('[EndTurn] Setting phase to DUST via ctx.events.setPhase()');
      ctx.events.setPhase(PHASES.DUST);
      // After setting phase, the framework should evaluate DUST phase's endIf
      // which will see _endTurnRequested = true and end the turn
    } else if (ctx.events && ctx.events.endPhase) {
      // Try ending current phase to trigger next phase evaluation
      console.log('[EndTurn] Ending current phase to trigger phase transition');
      ctx.events.endPhase();
      // Set phase to DUST so endIf can check it
      G.currentPhase = PHASES.DUST;
    } else {
      console.log('[EndTurn] No events available, setting phase to DUST manually');
      G.currentPhase = PHASES.DUST;
      // Note: Manual phase change might not trigger endIf immediately
      // The framework should evaluate it on the next move or phase transition
    }
  }
  
  // Reset phase for next turn (will be set in turn.onBegin)
  // Don't set it here as it might interfere with turn ending
};

// Draw Five Cards helper function
// Handles shuffling discard into deck when deck is empty
// Ensures cards moved to discard this turn are included in shuffle
const drawFiveCards = (G, ctx) => {
  const playerId = ctx.currentPlayer;
  const player = G.players[playerId];
  
  if (!player) {
    console.error('[drawFiveCards] Player not found:', playerId);
    return;
  }
  
  // The Founder's Ring: Increase starting hand size to 6
  const hasFoundersRing = [...(player.relics || []), ...(player.activeRelics || [])].some(r => r.name === "The Founder's Ring");
  const targetHandSize = hasFoundersRing ? 6 : (player.startingHandSize || 5);
  
  console.log('[drawFiveCards] Drawing', targetHandSize, 'cards for player:', playerId, hasFoundersRing ? '(The Founder\'s Ring: 6 cards)' : '');
  console.log('[drawFiveCards] Deck size before:', player.deck.length);
  console.log('[drawFiveCards] Discard size before:', player.discard.length);
  
  // Loop to draw up to targetHandSize cards
  for (let i = 0; i < targetHandSize; i++) {
    // If deck is empty, shuffle discard into deck
    // CRITICAL: Only use THIS player's discard pile, not any other player's
    if (player.deck.length === 0 && player.discard && player.discard.length > 0) {
      // Filter out relics - they should never be shuffled into deck
      const deckableCards = player.discard.filter(card => card.type !== CARD_TYPES.RELIC);
      
      if (deckableCards.length === 0) {
        // Only relics in discard, can't refill - stop drawing
        console.warn('[drawFiveCards] Only relics in discard, cannot refill deck for player', playerId);
        break;
      }
      
      // Use ctx.random.Shuffle if available, otherwise use shuffleArray
      let shuffledCards;
      if (ctx.random && ctx.random.Shuffle) {
        // Use boardgame.io's built-in shuffle
        shuffledCards = ctx.random.Shuffle(deckableCards);
      } else {
        // Fallback to Fisher-Yates shuffle
        shuffledCards = shuffleArray(deckableCards);
      }
      
      // Move shuffled cards to deck
      // CRITICAL: Only shuffle THIS player's discard pile
      player.deck = shuffledCards;
      
      // Clear discard pile (all cards have been shuffled into deck)
      // Note: Relics never go to discard, so we can safely clear it
      player.discard = [];
      
      console.log('[drawFiveCards] Shuffled discard into deck for player', playerId, '. New deck size:', player.deck.length, 'Discard size:', player.discard.length);
    }
    
  // Draw a card from deck
  if (player.deck.length > 0) {
    const drawnCard = player.deck.pop();
    // Only add non-relic cards to hand
    if (drawnCard.type !== CARD_TYPES.RELIC) {
      player.hand.push(drawnCard);
      console.log('[drawFiveCards] Drew card:', drawnCard.name);
    }
  } else {
    // Deck is empty and discard is empty (or only has relics)
    console.warn('[drawFiveCards] Cannot draw card', i + 1, '- deck and discard are empty');
    break;
  }
  
  // Stop drawing once we reach target hand size
  if (player.hand.length >= targetHandSize) {
    break;
  }
}
  
  console.log('[drawFiveCards] Finished drawing. Hand size:', player.hand.length, 'Deck size:', player.deck.length, 'Discard size:', player.discard.length);
};

// Game Phases
export const PHASES = {
  RELIC: 'relic',
  SHIELD: 'shield',
  ALLY: 'ally',
  ENERGY: 'energy',
  ACQUISITION: 'acquisition',
  DISCARD: 'discard',
  RESET: 'reset',
  DUST: 'dust',
};

export const Game = {
  setup: (ctx) => {
    // Initialize market with 12 stacks: 10 Ally stacks + 8 Fusion Fragments + 10 Energy Cells
    const market = createMarket();
    
    // Initialize The Dust Playmat (shared, empty at start)
    const dust = [];
    
    // Initialize Relic stacks: 10 relics shuffled into 2 stacks of 5, top card revealed
    const allRelics = createRelics();
    const shuffledRelics = shuffleArray(allRelics);
    
    const relicStacks = [
      {
        stackId: 0,
        cards: shuffledRelics.slice(0, 5), // First 5 relics
        revealedCard: shuffledRelics[0], // Top card (revealed)
      },
      {
        stackId: 1,
        cards: shuffledRelics.slice(5, 10), // Last 5 relics
        revealedCard: shuffledRelics[5], // Top card (revealed)
      },
    ];
    
    // Initialize players with starting decks (8 Energy Cells + 2 Fusion Fragments)
    // Support 2-4 players
    const numPlayers = ctx.numPlayers || 2;
    const players = {};
    for (let i = 0; i < numPlayers; i++) {
      const playerId = String(i);
      const startingDeck = createStartingDeck(i);
      const shuffledDeck = shuffleArray(startingDeck);
      
      // Draw 5 cards from shuffled deck into hand
      const hand = [];
      for (let j = 0; j < 5 && shuffledDeck.length > 0; j++) {
        const card = shuffledDeck.pop();
        if (card.type !== CARD_TYPES.RELIC) {
          hand.push(card);
        }
      }
      
      players[playerId] = {
        deck: shuffledDeck, // Remaining cards after drawing 5
        hand: hand, // 5 cards drawn at start
        playArea: [], // Cards played this turn (Energy Coins, Allies, etc.)
        discard: [], // CRITICAL: Each player has their own individual discard pile
        relics: [], // Acquired relics (not yet active)
        activeRelics: [], // Max 2 active relics
        activeShield: null, // null or { card: Card, faceDown: boolean }
        maxShields: 1, // Default 1, can be increased by card effects
        victoryPoints: 0, // VP from Relics (4 VP), Fusion Fragments (2 VP), and certain Allies
        hasDustedThisTurn: false, // Track if player has dusted this turn
        mustDustForRelic: false, // Track if player must dust 1 card for relic requirement
        allyActionsAvailable: 1, // Starts at 1 per turn
        nextPowerfulIsEfficient: false, // Flag for Fusegate Keeper effect
        firstAllyIsEfficient: false, // Flag for The Gatekey - first ally played each turn is Efficient
        powerfulAlliesPlayedThisTurn: 0, // Track powerful allies played for The Overclock
        startingHandSize: 5, // Default 5, increased to 6 by The Founder's Ring
        minHandSize: 0, // Default 0, increased to 4 by The Nobel Cloak
        satelliteShieldUsed: false, // Track if The Satellite has blocked an attack this round
      };
    }

    return {
      players,
      market,
      dust, // Shared Dust Playmat
      relicStacks, // Two stacks of 5 face-down Relic cards, top card face-up
      availableEnergy: 0, // Available energy pool for current turn (persists until spent or turn ends)
      currentPhase: PHASES.RELIC, // Current phase in turn order
      finalRound: false, // Whether we're in the final round
      finalRoundTriggeredBy: null, // Player who triggered final round
      finalRoundTurnsRemaining: null, // Number of turns remaining in final round
      gameOver: false, // Flag to indicate game should end
      pendingAttack: null, // { attackerId: string, targetId: string, card: Card, effect: string } - tracks active attack that can be blocked
      pendingChoice: null, // { playerId: string, card: Card, choiceType: string, message: string } - tracks pending player choices
      gameLog: [], // Array of log entries: { turn: number, playerId: string, action: string, details: string, timestamp: number }
      gameStateHistory: [], // Array of previous game states for undo functionality (max 10 states)
      _endTurnRequested: false, // Flag to signal that EndTurn move was called (used by turn.endIf)
    };
  },

  // Secret State: Hide other players' hands and decks
  playerView: ({ G, ctx, playerID }) => {
    if (!playerID) return G; // Observer view - show everything
    
    // Ensure playerID is a string for consistent comparison
    const playerIDStr = String(playerID);
    
    // Create a filtered game state that hides other players' secrets
    const filteredG = { ...G };
    filteredG.players = {};
    
    // Only show full data for the current player
    Object.keys(G.players).forEach((pid) => {
      const pidStr = String(pid);
      if (pidStr === playerIDStr) {
        // Show full player data for the current player
        filteredG.players[pid] = G.players[pid];
      } else {
        // Hide hand and deck for other players, but show public info (discard, playArea, etc.)
        filteredG.players[pid] = {
          ...G.players[pid],
          hand: [], // Hide hand
          deck: [], // Hide deck
        };
      }
    });
    
    return filteredG;
  },

  moves: {
    // PlayCard: Use the reusable playCardMove function
    PlayCard: playCardMove,
    
    // PlayAllEnergyCoins: Play all Energy Coins from hand
    PlayAllEnergyCoins: playAllEnergyCoinsMove,
    
    // UndoMove: Restore previous game state
    UndoMove: undoMove,
    
    // CRITICAL: BlockWithShield and ResolveAttack must be available at game level
    // so they can be used by players in attackResponse stage regardless of phase
    BlockWithShield: blockWithShieldMove,
    ResolveAttack: resolveAttackMove,

    // DebugSetupWarhinoGeneral: Debug move to add Warhino General to current player's hand
    // Usage: Call this from the debug panel to set up a test scenario
    DebugSetupWarhinoGeneral: ({ G, ctx }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      
      // Find the highest card ID in the game to generate a new unique ID
      let maxId = 0;
      Object.values(G.players || {}).forEach(p => {
        [...(p.hand || []), ...(p.deck || []), ...(p.discard || []), ...(p.playArea || [])].forEach(card => {
          if (card.id && card.id > maxId) maxId = card.id;
        });
      });
      [...(G.market || [])].forEach(stack => {
        (stack.cards || []).forEach(card => {
          if (card.id && card.id > maxId) maxId = card.id;
        });
      });
      [...(G.dust || []), ...(G.relicStacks || []).flatMap(s => s.cards || [])].forEach(card => {
        if (card.id && card.id > maxId) maxId = card.id;
      });
      
      const newCardId = maxId + 1;
      
      // Create Warhino General card
      const warhinoGeneral = createAlly(
        newCardId,
        'Warhino General',
        4,
        ALLY_SUBTYPES.POWERFUL,
        {
          energyGenerated: 1,
          isShield: true,
          ability: 'Attack: Dust opponent card OR Retrieve 1',
          victoryPoints: 1,
        }
      );
      
      // Add to player's hand
      if (!player.hand) player.hand = [];
      player.hand.push(warhinoGeneral);
      
      console.log('[DebugSetupWarhinoGeneral] Added Warhino General to player', playerId, "'s hand");
      addLogEntry(G, ctx, 'Debug Setup', `Added Warhino General to hand (Debug)`);
      
      return warhinoGeneral;
    },

    // DebugSetEnergy: Debug move to set available energy to a specific value
    // Usage: Call this from the debug panel with a number parameter to set energy
    // Example: DebugSetEnergy(5) sets energy to 5
    DebugSetEnergy: ({ G, ctx }, energyAmount) => {
      if (typeof energyAmount !== 'number' || energyAmount < 0) {
        console.warn('[DebugSetEnergy] Invalid energy amount:', energyAmount);
        return INVALID_MOVE;
      }
      
      G.availableEnergy = energyAmount;
      console.log('[DebugSetEnergy] Set availableEnergy to', energyAmount);
      addLogEntry(G, ctx, 'Debug Setup', `Set available energy to ${energyAmount} (Debug)`);
      
      return energyAmount;
    },

    // BuyCard: Global move - available in all phases (ally, energy, acquisition, shield, relic)
    // IMPORTANT: This is a global move, but also explicitly included in each phase's moves object
    // to ensure it's always available regardless of phase configuration
    BuyCard: ({ G, ctx }, stackId) => {
      console.log('[Global BuyCard] Move called from global moves object');
      // Call the reusable buyCardMove function
      return buyCardMove({ G, ctx }, stackId);
    },
    
    // BlockWithShield: Discard active shield to negate an attack, or use The Satellite
    BlockWithShield: blockWithShieldMove,
    
    // ResolveAttack: Target chooses not to block (or can't block)
    ResolveAttack: resolveAttackMove,
    
    // DiscardFusionFragmentForEnergy: Handle Fuseforge Blacksmith choice - discard Fusion Fragment for +2 Energy
    DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
    
    // SkipFusionFragmentDiscard: Handle Fuseforge Blacksmith choice - skip the effect
    SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
    
    // WarhinoGeneralDustOpponent: Handle Warhino General choice - dust opponent card
    // Set client: false so the move runs on the server where ctx.events is available
    // This allows us to call setActivePlayers directly in the move
    WarhinoGeneralDustOpponent: {
      move: warhinoGeneralDustOpponentMove,
      client: false, // Run on server so ctx.events.setActivePlayers is available
    },
    
    // WarhinoGeneralRetrieve: Handle Warhino General choice - retrieve 1 from Dust (sets up card selection)
    WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
    
    // WarhinoGeneralSelectRetrieve: Handle Warhino General - retrieve the selected card from Dust
    WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
    // WarhinoGeneralSelectOpponent: Handle Warhino General - select which opponent to target (3+ players)
    WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
    // WarhinoGeneralSelectCard: Handle Warhino General - opponent selects which card to dust
    // Set client: false so the move runs on the server where ctx.events.endStage is available
    WarhinoGeneralSelectCard: {
      move: warhinoGeneralSelectCardMove,
      client: false, // Run on server so ctx.events.endStage is available
    },
    
    // MachbootChaserSelectOpponent: Handle Machboot Chaser - select which opponent to attack (3+ players)
    MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
    // MachbootChaserSelectCard: Handle Machboot Chaser - target selects which card to discard (sets up confirmation)
    // Set client: false so the move runs on the server where ctx.events is available
    MachbootChaserSelectCard: {
      move: machbootChaserSelectCardMove,
      client: false, // Run on server so ctx.events is available
    },
    // MachbootChaserConfirmDiscard: Handle Machboot Chaser - confirm and execute the discard
    // Set client: false so the move runs on the server where ctx.events.endStage is available
    MachbootChaserConfirmDiscard: {
      move: machbootChaserConfirmDiscardMove,
      client: false, // Run on server so ctx.events.endStage is available
    },
    
    // PoisonhandChancellorSelectCard: Handle Poisonhand Chancellor - opponent selects which card to discard
    // Set client: false so the move runs on the server where ctx.events is available
    PoisonhandChancellorSelectCard: {
      move: poisonhandChancellorSelectCardMove,
      client: false, // Run on server so ctx.events is available
    },
    
    // DustseekerDronesSelectOpponent: Handle Dustseeker Drones - select which opponent to attack (3+ players)
    DustseekerDronesSelectOpponent: dustseekerDronesSelectOpponentMove,
    
    // DustseekerDronesSelectCard: Handle Dustseeker Drones - opponent selects which card to dust
    // Set client: false so the move runs on the server where ctx.events.endStage is available
    DustseekerDronesSelectCard: {
      move: dustseekerDronesSelectCardMove,
      client: false, // Run on server so ctx.events.endStage is available
    },

    // EndTurn: Move all cards in hand and play area to discard. Draw 5 new cards. Reset availableEnergy to 0
    // Enable events so we can call ctx.events.endTurn()
    // Use the shared endTurnMove function to ensure consistency
    EndTurn: {
      move: endTurnMove,
      // Enable client-side events so ctx.events.endTurn() is available
      client: true,
    },

    // DustCard: Move 1 card from hand to global dustPlaymat array (once per turn)
    // Global move - available in all phases
    // IMPORTANT: This is a global move, but also explicitly included in each phase's moves object
    // to ensure it's always available regardless of phase configuration
    DustCard: ({ G, ctx }, cardId) => {
      console.log('[Global DustCard] Move called from global moves object');
      // Call the reusable dustCardMove function
      // Return the result so INVALID_MOVE errors are propagated
      return dustCardMove({ G, ctx }, cardId);
    },

    // Move a card to The Dust (removes it from game) - generic version
    MoveToDust: ({ G, ctx }, cardId, source) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      
      let card = null;
      let cardIndex = -1;
      
      // Find card based on source location
      switch (source) {
        case 'hand':
          cardIndex = player.hand.findIndex(c => c.id === cardId);
          if (cardIndex !== -1) {
            card = player.hand.splice(cardIndex, 1)[0];
          }
          break;
        case 'deck':
          cardIndex = player.deck.findIndex(c => c.id === cardId);
          if (cardIndex !== -1) {
            card = player.deck.splice(cardIndex, 1)[0];
          }
          break;
        case 'discard':
          cardIndex = player.discard.findIndex(c => c.id === cardId);
          if (cardIndex !== -1) {
            card = player.discard.splice(cardIndex, 1)[0];
          }
          break;
        default:
          return INVALID_MOVE;
      }
      
      if (!card) {
        return INVALID_MOVE;
      }
      
      // Move card to The Dust
      moveToDust(G, card);
    },

    // Retrieve: Take a card (except Relics) from the Dust Playmat and put it into your hand
    Retrieve: ({ G, ctx }, cardId) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      
      // Find card in Dust
      const cardIndex = G.dust.findIndex(card => card.id === cardId);
      
      if (cardIndex === -1) {
        return INVALID_MOVE;
      }
      
      const card = G.dust[cardIndex];
      
      // Cannot retrieve Relics
      if (card.type === CARD_TYPES.RELIC) {
        return INVALID_MOVE;
      }
      
      // Remove from Dust and add to hand
      G.dust.splice(cardIndex, 1);
      player.hand.push(card);
      
      return card;
    },

    // ============================================
    // DEBUG MOVES - For testing and development
    // Enable by adding ?debug=true to URL
    // ============================================
    
    // Debug: Add card to hand
    DebugAddCardToHand: ({ G, ctx }, { cardName, cardType = 'resource' }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return INVALID_MOVE;
      
      let card = null;
      let cardId = Date.now(); // Generate unique ID
      
      if (cardType === 'resource' && cardName === 'Energy Cell') {
        card = createEnergyCell(cardId);
      } else if (cardType === 'resource' && cardName === 'Fusion Fragment') {
        card = createFusionFragment(cardId);
      } else if (cardType === 'ally') {
        const allyDef = CARDS.ALLIES.find(a => a.name === cardName);
        if (allyDef) {
          card = createAlly(cardId, allyDef.name, allyDef.cost, allyDef.subtype, {
            energyGenerated: allyDef.energyGenerated,
            isShield: allyDef.isShield,
            ability: allyDef.ability,
            victoryPoints: allyDef.victoryPoints,
          });
        }
      }
      
      if (card) {
        player.hand.push(card);
        addLogEntry(G, ctx, 'Debug', `Added ${cardName} to hand`);
        console.log('[Debug] Added card to hand:', cardName);
      }
      return card;
    },
    
    // Debug: Set available energy
    DebugSetEnergy: ({ G, ctx }, energy) => {
      G.availableEnergy = Math.max(0, parseInt(energy) || 0);
      addLogEntry(G, ctx, 'Debug', `Set energy to ${G.availableEnergy}`);
      console.log('[Debug] Set energy to:', G.availableEnergy);
    },
    
    // Debug: Add relic to player
    DebugAddRelic: ({ G, ctx }, relicName) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return INVALID_MOVE;
      
      const allRelics = createRelics();
      const relic = allRelics.find(r => r.name === relicName);
      
      if (relic) {
        // Create a new instance with unique ID
        const newRelic = { ...relic, id: Date.now() };
        player.relics.push(newRelic);
        addLogEntry(G, ctx, 'Debug', `Added ${relicName} to relics`);
        console.log('[Debug] Added relic:', relicName);
        
        // Check for 3rd relic end game trigger
        if (player.relics.length === 3 && !G.finalRound) {
          G.finalRound = true;
          G.finalRoundTriggeredBy = playerId;
          G.finalRoundTurnsRemaining = ctx.numPlayers - 1;
          addLogEntry(G, ctx, 'End Game Triggered', `${playerId} acquired their 3rd Relic! Final round begins.`);
        }
      }
      return relic;
    },
    
    // Debug: Activate relic (move from relics to activeRelics)
    DebugActivateRelic: ({ G, ctx }, relicIndex) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player || relicIndex < 0 || relicIndex >= player.relics.length) return INVALID_MOVE;
      
      if (player.activeRelics.length >= 2) {
        console.warn('[Debug] Cannot activate - already have 2 active relics');
        return INVALID_MOVE;
      }
      
      const relic = player.relics[relicIndex];
      if (player.activeRelics.find(r => r.id === relic.id)) {
        console.warn('[Debug] Relic already active');
        return INVALID_MOVE;
      }
      
      player.activeRelics.push(relic);
      addLogEntry(G, ctx, 'Debug', `Activated ${relic.name}`);
      console.log('[Debug] Activated relic:', relic.name);
    },
    
    // Debug: Set current phase
    DebugSetPhase: ({ G, ctx }, phase) => {
      if (Object.values(PHASES).includes(phase)) {
        G.currentPhase = phase;
        if (ctx.events && ctx.events.setPhase) {
          ctx.events.setPhase(phase);
        }
        addLogEntry(G, ctx, 'Debug', `Set phase to ${phase}`);
        console.log('[Debug] Set phase to:', phase);
      }
    },
    
    // Debug: Draw cards
    DebugDrawCards: ({ G, ctx }, count = 1) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return INVALID_MOVE;
      
      for (let i = 0; i < count; i++) {
        drawCard(player, G, ctx, playerId);
      }
      addLogEntry(G, ctx, 'Debug', `Drew ${count} card(s)`);
      console.log('[Debug] Drew', count, 'cards');
    },
    
    // Debug: Add card to deck
    DebugAddCardToDeck: ({ G, ctx }, { cardName, cardType = 'resource', position = 'top' }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return INVALID_MOVE;
      
      let card = null;
      let cardId = Date.now();
      
      if (cardType === 'resource' && cardName === 'Energy Cell') {
        card = createEnergyCell(cardId);
      } else if (cardType === 'resource' && cardName === 'Fusion Fragment') {
        card = createFusionFragment(cardId);
      } else if (cardType === 'ally') {
        const allyDef = CARDS.ALLIES.find(a => a.name === cardName);
        if (allyDef) {
          card = createAlly(cardId, allyDef.name, allyDef.cost, allyDef.subtype, {
            energyGenerated: allyDef.energyGenerated,
            isShield: allyDef.isShield,
            ability: allyDef.ability,
            victoryPoints: allyDef.victoryPoints,
          });
        }
      }
      
      if (card) {
        if (position === 'top') {
          player.deck.push(card);
        } else {
          player.deck.unshift(card);
        }
        addLogEntry(G, ctx, 'Debug', `Added ${cardName} to deck (${position})`);
        console.log('[Debug] Added card to deck:', cardName);
      }
      return card;
    },
    
    // Debug: Add card to discard
    DebugAddCardToDiscard: ({ G, ctx }, { cardName, cardType = 'resource' }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return INVALID_MOVE;
      
      let card = null;
      let cardId = Date.now();
      
      if (cardType === 'resource' && cardName === 'Energy Cell') {
        card = createEnergyCell(cardId);
      } else if (cardType === 'resource' && cardName === 'Fusion Fragment') {
        card = createFusionFragment(cardId);
      } else if (cardType === 'ally') {
        const allyDef = CARDS.ALLIES.find(a => a.name === cardName);
        if (allyDef) {
          card = createAlly(cardId, allyDef.name, allyDef.cost, allyDef.subtype, {
            energyGenerated: allyDef.energyGenerated,
            isShield: allyDef.isShield,
            ability: allyDef.ability,
            victoryPoints: allyDef.victoryPoints,
          });
        }
      }
      
      if (card) {
        player.discard.push(card);
        addLogEntry(G, ctx, 'Debug', `Added ${cardName} to discard`);
        console.log('[Debug] Added card to discard:', cardName);
      }
      return card;
    },
    
    // Debug: Set player flags
    DebugSetPlayerFlag: ({ G, ctx }, { flag, value }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return INVALID_MOVE;
      
      if (flag in player) {
        player[flag] = value;
        addLogEntry(G, ctx, 'Debug', `Set ${flag} to ${value}`);
        console.log('[Debug] Set', flag, 'to', value);
      }
    },
    
    // Debug: Trigger end game
    DebugTriggerEndGame: ({ G, ctx }, playerId) => {
      if (!G.finalRound) {
        G.finalRound = true;
        G.finalRoundTriggeredBy = playerId || ctx.currentPlayer;
        G.finalRoundTurnsRemaining = ctx.numPlayers - 1;
        addLogEntry(G, ctx, 'Debug', 'End game triggered');
        console.log('[Debug] End game triggered');
      }
    },
    
    // Debug: Add card to dust
    DebugAddCardToDust: ({ G, ctx }, { cardName, cardType = 'resource' }) => {
      let card = null;
      let cardId = Date.now();
      
      if (cardType === 'resource' && cardName === 'Energy Cell') {
        card = createEnergyCell(cardId);
      } else if (cardType === 'resource' && cardName === 'Fusion Fragment') {
        card = createFusionFragment(cardId);
      } else if (cardType === 'ally') {
        const allyDef = CARDS.ALLIES.find(a => a.name === cardName);
        if (allyDef) {
          card = createAlly(cardId, allyDef.name, allyDef.cost, allyDef.subtype, {
            energyGenerated: allyDef.energyGenerated,
            isShield: allyDef.isShield,
            ability: allyDef.ability,
            victoryPoints: allyDef.victoryPoints,
          });
        }
      }
      
      if (card) {
        moveToDust(G, card);
        addLogEntry(G, ctx, 'Debug', `Added ${cardName} to Dust`);
        console.log('[Debug] Added card to Dust:', cardName);
      }
      return card;
    },
    
    // Debug: Clear hand
    DebugClearHand: ({ G, ctx }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return INVALID_MOVE;
      
      const count = player.hand.length;
      player.hand = [];
      addLogEntry(G, ctx, 'Debug', `Cleared ${count} cards from hand`);
      console.log('[Debug] Cleared hand');
    },
    
    // Debug: Reset turn flags
    DebugResetTurnFlags: ({ G, ctx }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      if (!player) return INVALID_MOVE;
      
      player.hasDustedThisTurn = false;
      player.mustDustForRelic = false;
      player.allyActionsAvailable = 1;
      player.powerfulAlliesPlayedThisTurn = 0;
      player.satelliteShieldUsed = false;
      addLogEntry(G, ctx, 'Debug', 'Reset turn flags');
      console.log('[Debug] Reset turn flags');
    },
    
    // Calculate victory points: Relics (4 VP), Fusion Fragments (2 VP), and certain Allies
    CalculateVictoryPoints: ({ G, ctx }) => {
      const playerId = ctx.currentPlayer;
      const player = G.players[playerId];
      
      let vp = 0;
      
      // Relics: 5 VP each (in activeRelics and relics)
      vp += (player.relics.length + player.activeRelics.length) * 5;
      
      // Fusion Fragments: 2 VP each (in deck, hand, and discard)
      const allCards = [
        ...player.deck,
        ...player.hand,
        ...player.discard,
      ];
      
      const fusionFragments = allCards.filter(
        card => card.type === CARD_TYPES.RESOURCE && 
        card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT
      );
      
      vp += fusionFragments.length * 2;
      
      // Certain Allies may have VP (check card properties)
      allCards.forEach(card => {
        if (card.type === CARD_TYPES.ALLY && card.victoryPoints) {
          vp += card.victoryPoints;
        }
      });
      
      player.victoryPoints = vp;
      
      return player.victoryPoints;
    },
  },

  turn: {
    order: {
      first: () => 0,
      next: ({ G, ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    },
    stages: {
      // Stage for target player to respond to attacks (Warhino General, Machboot Chaser, Poisonhand Chancellor, Dustseeker Drones)
      attackResponse: {
        moves: {
          // CRITICAL: BlockWithShield and ResolveAttack must be available in attackResponse stage
          // so players can block or resolve attacks when they're in this stage
          BlockWithShield: blockWithShieldMove,
          ResolveAttack: resolveAttackMove,
          WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
          MachbootChaserSelectCard: machbootChaserSelectCardMove,
          MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
          PoisonhandChancellorSelectCard: poisonhandChancellorSelectCardMove,
          DustseekerDronesSelectCard: dustseekerDronesSelectCardMove,
        },
        // Automatically kick them out of the stage after one move
        moveLimit: 1,
      },
    },
    // End turn if EndTurn was called (tracked in game state)
    // This is evaluated after each move to check if the turn should end
    // Note: In phase-based games, this might be evaluated at different times
    // IMPORTANT: endIf is read-only - cannot mutate G, only return true/false
    endIf: ({ G, ctx }) => {
      // Check if game should end
      if (G.gameOver) {
        console.log('[Turn] endIf: Game over flag set, ending game');
        // Return victory points data for endGame
        const victoryPoints = Object.fromEntries(
          Object.keys(G.players).map(playerId => [playerId, G.players[playerId].victoryPoints || 0])
        );
        return victoryPoints;
      }
      
      // Check if EndTurn move was called - this is a workaround for ctx.events not being available
      // We'll set a flag in G when EndTurn is called
      const shouldEnd = G._endTurnRequested === true;
      console.log('[Turn] endIf evaluated. _endTurnRequested:', G._endTurnRequested, 'shouldEnd:', shouldEnd, 'currentPlayer:', ctx.currentPlayer, 'turn:', ctx.turn);
      if (shouldEnd) {
        console.log('[Turn] endIf: EndTurn was requested, ending turn. Current player:', ctx.currentPlayer, 'Turn:', ctx.turn);
        // Don't reset flag here - endIf is read-only, reset in onEnd instead
        return true;
      }
      return false;
    },
    onEnd: ({ G, ctx }) => {
      // Reset the EndTurn flag when turn ends
      console.log('[Turn] onEnd called. _endTurnRequested:', G._endTurnRequested, 'currentPlayer:', ctx.currentPlayer, 'turn:', ctx.turn);
      if (G._endTurnRequested === true) {
        console.log('[Turn] onEnd: Resetting _endTurnRequested flag');
        G._endTurnRequested = false; // Reset flag for next turn
      }
      
      // Check for game end conditions
      // 1. Check if all players have decked out (edge case)
      if (checkAllPlayersDeckedOut(G, ctx)) {
        endGame(G, ctx);
        return;
      }
      
      // 2. Handle final round turn counting
      if (G.finalRound && G.finalRoundTurnsRemaining !== null && G.finalRoundTurnsRemaining !== undefined) {
        // Decrement turns remaining (current player just finished their turn)
        // Only decrement if this player is not the one who triggered the final round
        const currentPlayerId = ctx.currentPlayer;
        if (currentPlayerId !== G.finalRoundTriggeredBy) {
          G.finalRoundTurnsRemaining = Math.max(0, G.finalRoundTurnsRemaining - 1);
          console.log('[Turn] onEnd: Final round - turns remaining:', G.finalRoundTurnsRemaining);
          addLogEntry(G, ctx, 'Final Round', `Turns remaining: ${G.finalRoundTurnsRemaining}`);
          
          // If no turns remaining, end the game
          if (G.finalRoundTurnsRemaining <= 0) {
            console.log('[Turn] onEnd: Final round complete - ending game');
            endGame(G, ctx);
          }
        }
      }
    },
    onMove: ({ G, ctx, events }) => {
      // After any move, check if we need to set active players for pendingChoice or pendingAttack
      // This is a workaround if ctx.events is not available in move functions
      // CRITICAL: This hook runs after EVERY move, so it will catch pendingAttack set up by moves
      console.log('[Turn onMove] Hook called. pendingChoice:', G.pendingChoice ? 'exists' : 'null', 'pendingAttack:', G.pendingAttack ? 'exists' : 'null', 'events:', events ? 'exists' : 'null', 'activePlayers:', ctx.activePlayers, 'currentPlayer:', ctx.currentPlayer);
      
      // CRITICAL: Check if we need to activate a target player for pendingAttack (shield blocking)
      // When an attack is set up that can be blocked, the target player needs to be active
      // This must work in ALL directions for 2-4 player games:
      // - Any player can attack any other player (player 0→1, 0→2, 1→3, 2→0, etc.)
      // - The target (regardless of which player) must be able to block
      if (G.pendingAttack) {
        console.log('[Turn onMove] pendingAttack detected:', {
          attackerId: G.pendingAttack.attackerId,
          targetId: G.pendingAttack.targetId,
          effect: G.pendingAttack.effect,
          pendingChoice: G.pendingChoice ? 'exists' : 'null'
        });
        
        // Only activate if there's no pendingChoice (pendingChoice means a different flow)
        if (!G.pendingChoice) {
          const targetIdRaw = G.pendingAttack.targetId;
          const attackerIdRaw = G.pendingAttack.attackerId;
          
          // CRITICAL: Normalize IDs to strings for consistent comparison
          // This ensures it works for player IDs: 0, 1, 2, 3 or "0", "1", "2", "3"
          const targetIdStr = String(targetIdRaw);
          const attackerIdStr = String(attackerIdRaw);
          const currentPlayerIdStr = String(ctx.currentPlayer);
          
          console.log('[Turn onMove] Processing pendingAttack activation. Target:', targetIdRaw, 'Attacker:', attackerIdRaw, 'Current:', ctx.currentPlayer);
          
          // Check if target is not already active in attackResponse stage
          // Check both string and number versions of the ID (supports all player IDs 0-3)
          let isTargetActive = false;
          if (ctx.activePlayers) {
            // Check all possible ID formats for the target
            isTargetActive = 
              ctx.activePlayers[targetIdRaw] === 'attackResponse' ||
              ctx.activePlayers[targetIdStr] === 'attackResponse' ||
              ctx.activePlayers[Number(targetIdRaw)] === 'attackResponse';
            console.log('[Turn onMove] Target active status check:', {
              targetIdRaw: ctx.activePlayers[targetIdRaw],
              targetIdStr: ctx.activePlayers[targetIdStr],
              isTargetActive: isTargetActive
            });
          }
          
          // Activate target if they're not the current player and not already active
          // This works for ANY combination of players (not just 0 and 1)
          // CRITICAL: Check all conditions explicitly for debugging
          const isTargetDifferentFromCurrent = targetIdStr !== currentPlayerIdStr;
          const isTargetNotNull = targetIdRaw !== null && targetIdRaw !== undefined;
          
          console.log('[Turn onMove] Activation condition check:', {
            targetIdRaw,
            targetIdStr,
            currentPlayerIdStr,
            isTargetDifferentFromCurrent,
            isTargetNotNull,
            isTargetActive,
            shouldActivate: isTargetNotNull && isTargetDifferentFromCurrent && !isTargetActive
          });
          
          if (isTargetNotNull && isTargetDifferentFromCurrent && !isTargetActive) {
            console.log('[Turn onMove] pendingAttack found - activating target player for blocking. Target:', targetIdRaw, 'Attacker:', attackerIdRaw, 'Current:', ctx.currentPlayer, 'All players:', Object.keys(G.players));
            if (events && events.setActivePlayers) {
              try {
                // CRITICAL: Use the original IDs from pendingAttack (preserve type)
                // This ensures it works for all player combinations (0→1, 0→2, 1→3, 2→0, 3→1, etc.)
                events.setActivePlayers({
                  value: {
                    [attackerIdRaw]: 'default', // Keep attacker active (works for string/number IDs 0-3)
                    [targetIdRaw]: 'attackResponse', // Activate target for blocking (works for string/number IDs 0-3)
                  },
                });
                console.log('[Turn onMove] SUCCESS: Activated target player for blocking. Target:', targetIdRaw, 'Attacker:', attackerIdRaw, 'Effect:', G.pendingAttack.effect);
              } catch (error) {
                console.error('[Turn onMove] ERROR activating target player:', error);
                console.error('[Turn onMove] Error stack:', error.stack);
              }
            } else {
              console.warn('[Turn onMove] events.setActivePlayers not available for pendingAttack. events:', events);
            }
          } else {
            console.log('[Turn onMove] Target already active or is current player. Target:', targetIdRaw, 'Current:', ctx.currentPlayer, 'IsActive:', isTargetActive, 'targetIdStr !== currentPlayerIdStr:', targetIdStr !== currentPlayerIdStr);
          }
        } else {
          console.log('[Turn onMove] pendingAttack exists but pendingChoice also exists - skipping activation (different flow)');
        }
      }
      
      // Check if we need to return control to the current player after a response move
      // This happens when pendingChoice was cleared and a non-current player was in attackResponse stage
      // OR when pendingAttack was cleared (blocked or resolved)
      // CRITICAL: This must work for ALL player combinations (2-4 players)
      if (!G.pendingChoice && !G.pendingAttack && ctx.activePlayers) {
        // Check if there's a non-current player in attackResponse stage
        // Normalize IDs to strings for consistent comparison (handles all player IDs 0-3)
        const currentPlayerId = ctx.currentPlayer;
        const currentPlayerIdStr = String(currentPlayerId);
        const activePlayerEntries = Object.entries(ctx.activePlayers);
        
        // Find any non-current player in attackResponse stage
        // Compare using normalized strings to handle all player IDs correctly
        const nonCurrentPlayerInStage = activePlayerEntries.find(([playerId, stage]) => {
          const playerIdStr = String(playerId);
          return playerIdStr !== currentPlayerIdStr && 
                 String(playerId) !== String(currentPlayerId) &&
                 stage === 'attackResponse';
        });
        
        if (nonCurrentPlayerInStage) {
          console.log('[Turn onMove] Response move completed, returning control to current player:', currentPlayerId, 'from responding player:', nonCurrentPlayerInStage[0]);
          if (events && events.endStage && events.setActivePlayers) {
            try {
              // End the stage for the responding player
              events.endStage();
              // Return control to the current player (works for any player ID 0-3)
              events.setActivePlayers({
                value: { [currentPlayerId]: 'default' },
              });
              console.log('[Turn onMove] SUCCESS: Returned control to current player:', currentPlayerId);
            } catch (error) {
              console.error('[Turn onMove] ERROR returning control:', error);
            }
          }
        }
      }
      
      // Check if we need to set active players for a new pendingChoice
      if (G.pendingChoice) {
        const pendingPlayerId = G.pendingChoice.playerId;
        const currentPlayerId = ctx.currentPlayer;
        
        console.log('[Turn onMove] pendingPlayerId:', pendingPlayerId, 'currentPlayerId:', currentPlayerId, 'choiceType:', G.pendingChoice.choiceType);
        
        // Check if this is a response choice that requires a non-current player to act
        const responseChoices = [
          'warhino_general_select_card_attack',
          'warhino_general_select_card_shield',
          'machboot_chaser_discard',
          'machboot_chaser_confirm_discard',
          'poisonhand_chancellor_discard',
          'dustseeker_drones_dust',
        ];
        
        if (responseChoices.includes(G.pendingChoice.choiceType) && pendingPlayerId !== currentPlayerId) {
          console.log('[Turn onMove] Match found! Setting active player...');
          if (events && events.setActivePlayers) {
            try {
              console.log('[Turn onMove] Calling setActivePlayers for player:', pendingPlayerId, 'stage: attackResponse');
              const result = events.setActivePlayers({
                value: { 
                  [currentPlayerId]: 'default', // Keep current player active
                  [pendingPlayerId]: 'attackResponse' // Activate responding player
                },
              });
              console.log('[Turn onMove] setActivePlayers returned:', result);
              console.log('[Turn onMove] SUCCESS: Set active player for target');
            } catch (error) {
              console.error('[Turn onMove] ERROR calling setActivePlayers:', error);
              console.error('[Turn onMove] Error stack:', error?.stack);
            }
          } else {
            console.warn('[Turn onMove] events.setActivePlayers not available!');
            console.warn('[Turn onMove] events:', events);
            console.warn('[Turn onMove] events.setActivePlayers:', events?.setActivePlayers);
          }
        } else {
          console.log('[Turn onMove] No match - choiceType:', G.pendingChoice.choiceType, 'in responseChoices:', responseChoices.includes(G.pendingChoice.choiceType), 'pendingPlayerId === currentPlayerId:', pendingPlayerId === currentPlayerId);
        }
      }
    },
      onBegin: ({ G, ctx }) => {
        // Reset turn flags at the start of each turn
        if (!ctx || !ctx.currentPlayer) {
          return;
        }
        
        const playerId = ctx.currentPlayer;
        if (G.players && G.players[playerId]) {
          const player = G.players[playerId];
          
          // CRITICAL: Log ALL players' hand sizes at turn start to debug hand persistence issues
          console.log('[Turn Begin] Turn starting for player:', playerId);
          Object.keys(G.players).forEach(pId => {
            const p = G.players[pId];
            if (p) {
              console.log('[Turn Begin] Player', pId, 'hand size:', p.hand.length, 'cards:', p.hand.map(c => c.name).join(', '));
            }
          });
          
          // CRITICAL: Verify activeShield persists across turns
          if (player.activeShield) {
            console.log('[Turn Begin] activeShield persists:', {
              cardName: player.activeShield.card?.name,
              cardId: player.activeShield.card?.id,
              faceDown: player.activeShield.faceDown,
              playerId: playerId
            });
          } else {
            console.log('[Turn Begin] No activeShield for player:', playerId);
          }
          
          player.hasDustedThisTurn = false;
          player.allyActionsAvailable = 1; // Reset to 1 per turn
          console.log('[Turn Begin] Reset allyActionsAvailable to 1 for player:', playerId);
          // Persistence: Reset availableEnergy at turn start
          G.availableEnergy = 0;
          
          // Relic Requirement: All relic owners must Dust 1 card from hand at start of turn
          const totalRelics = (player.relics?.length || 0) + (player.activeRelics?.length || 0);
          if (totalRelics > 0) {
            player.mustDustForRelic = true;
            console.log('[Turn Begin] Player has', totalRelics, 'relic(s) - must dust 1 card from hand');
          } else {
            player.mustDustForRelic = false;
          }
          
          // The Gatekey: First ally played each turn is Efficient
          const hasGatekey = [...(player.relics || []), ...(player.activeRelics || [])].some(r => r.name === 'The Gatekey');
          player.firstAllyIsEfficient = hasGatekey;
          
          // The Overclock: Reset powerful allies played counter
          player.powerfulAlliesPlayedThisTurn = 0;
          
          // The Satellite: Reset shield usage for new round
          player.satelliteShieldUsed = false;
          
          // NOTE: Card drawing is now handled in EndTurn, not here
          // EndTurn draws cards back up to starting hand size when a turn ends
          // This ensures cards are drawn at the correct time (after discarding, before next turn)
          // We only draw here as a fallback if hand is empty (shouldn't happen normally)
          if (player.hand.length === 0) {
            console.warn('[Turn Begin] WARNING: Hand is empty at turn start - drawing cards as fallback');
            drawFiveCards(G, ctx);
          } else {
            console.log('[Turn Begin] Hand already has', player.hand.length, 'cards (drawn by EndTurn)');
          }
        
        // Phase transitions are handled by endIf hooks in each phase
        // Relic Phase endIf will auto-skip to Shield Phase if no relics
        // Shield Phase endIf will auto-skip to Ally Phase if no shield
        // Just set the initial phase to RELIC - the endIf hooks will handle skipping
        G.currentPhase = PHASES.RELIC;
        console.log('[Turn Begin] Starting turn at Relic phase. endIf hooks will handle auto-skipping if needed.');
        
        // Shield activation is now handled in Shield Phase onBegin hook
        // However, as a fallback, also process shield effects here if shield is face-up
        // This ensures shield effects are processed even if Shield Phase onBegin doesn't run
        if (player.activeShield && !player.activeShield.faceDown) {
          const shieldAbility = player.activeShield.card.ability || '';
          if (shieldAbility.toLowerCase().includes('attack:')) {
            console.log('[Turn Begin] Fallback: Processing shield effect for face-up shield:', player.activeShield.card.name);
            processShieldEffect(G, ctx, playerId, player.activeShield.card);
          }
        }
      }
    },
  },
  
  phases: {
    [PHASES.RELIC]: {
      // Auto-Skip Relic Phase: If player has 0 Relics, automatically skip
      // Use endIf to auto-skip before move validation (evaluated before onBegin)
      endIf: ({ G, ctx }) => {
        if (!ctx || !ctx.currentPlayer || !G || !G.players) {
          return false; // Don't skip if context is invalid
        }
        
        const playerId = ctx.currentPlayer;
        const player = G.players[playerId];
        
        if (!player) {
          return false; // Don't skip if player not found
        }
        
        // Skip to next phase if player has no relics
        const hasRelics = player.relics && player.relics.length > 0;
        if (!hasRelics) {
          console.log('[Relic Phase] endIf: Player has no relics, auto-skipping to Shield phase');
          return true; // Skip this phase
        }
        
        // If player must dust for relic requirement and hasn't dusted yet, don't skip
        if (player.mustDustForRelic && !player.hasDustedThisTurn) {
          return false; // Don't skip - player must dust first
        }
        
        return false; // Don't skip, player has relics to activate
      },
      onBegin: ({ G, ctx }) => {
        // Safety checks
        if (!ctx || !ctx.currentPlayer || !G || !G.players) {
          console.warn('[Relic Phase] onBegin: Missing context or game state');
          return;
        }
        
        const playerId = ctx.currentPlayer;
        const player = G.players[playerId];
        
        if (!player) {
          console.warn('[Relic Phase] onBegin: Player not found:', playerId);
          return;
        }
        
        // Check if player has no relics - if so, immediately skip to next phase
        const hasRelics = player.relics && player.relics.length > 0;
        if (!hasRelics) {
          console.log('[Relic Phase] onBegin: Player has no relics, immediately skipping to Shield phase');
          // Use boardgame.io's phase system to transition
          if (ctx.events && ctx.events.endPhase) {
            ctx.events.endPhase();
          }
          return;
        }
        
        // Relic Requirement: If player must dust for relic and hasn't dusted yet, they must dust first
        if (player.mustDustForRelic && !player.hasDustedThisTurn) {
          console.log('[Relic Phase] onBegin - Player has', player.relics.length, 'relic(s) and must dust 1 card from hand before proceeding');
          // Player must dust a card - they can use DustCard move to do this
          // Phase will not end until they dust
          return;
        }
        
        // If we reach here, player has relics and has dusted (if required)
        console.log('[Relic Phase] onBegin - Player has', player.relics.length, 'relic(s) available to activate');
      },
      moves: {
        // Explicitly include global moves to ensure they're available
        PlayCard: playCardMove,
        BuyCard: buyCardMove,
        EndTurn: {
          move: endTurnMove,
          client: true, // Enable events so ctx.events.endTurn() is available
        },
        DustCard: dustCardMove,
        DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
        SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
        WarhinoGeneralDustOpponent: warhinoGeneralDustOpponentMove,
        WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
        WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
        WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
        WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
        MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
        MachbootChaserSelectCard: machbootChaserSelectCardMove,
        MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
        PlayAllEnergyCoins: playAllEnergyCoinsMove,
        UndoMove: undoMove,
        ActivateRelic: ({ G, ctx }, relicIndex) => {
          const playerId = ctx.currentPlayer;
          const player = G.players[playerId];
          
          // Can activate up to 2 relics
          if (player.activeRelics.length >= 2) {
            return INVALID_MOVE;
          }
          
          // Find relic in player's acquired relics
          if (relicIndex < 0 || relicIndex >= player.relics.length) {
            return INVALID_MOVE;
          }
          
          const relic = player.relics[relicIndex];
          if (player.activeRelics.find(r => r.id === relic.id)) {
            return INVALID_MOVE; // Already active
          }
          
          player.activeRelics.push(relic);
          console.log('[Relic Phase] Activated relic:', relic.name);
          
          // Process relic ability when activated
          processRelicAbility(G, ctx, playerId, relic);
        },
        TriggerRelicAbility: ({ G, ctx }, relicIndex) => {
          const playerId = ctx.currentPlayer;
          const player = G.players[playerId];
          
          // Can trigger abilities from active relics
          if (relicIndex < 0 || relicIndex >= player.activeRelics.length) {
            return INVALID_MOVE;
          }
          
          const relic = player.activeRelics[relicIndex];
          processRelicAbility(G, ctx, playerId, relic);
        },
        SkipRelicPhase: ({ G, ctx }) => {
          // Use boardgame.io's phase system to properly transition
          if (ctx.events && ctx.events.endPhase) {
            ctx.events.endPhase();
          } else {
            // Fallback: manually set phase (not ideal but better than nothing)
            G.currentPhase = PHASES.SHIELD;
          }
        },
      },
      start: true,
      next: PHASES.SHIELD,
    },
    
    [PHASES.SHIELD]: {
      // Auto-Skip Shield Phase: If player has no active Shields, automatically skip
      // Use endIf to auto-skip before move validation (evaluated before onBegin)
      endIf: ({ G, ctx }) => {
        if (!ctx || !ctx.currentPlayer || !G || !G.players) {
          return false; // Don't skip if context is invalid
        }
        
        const playerId = ctx.currentPlayer;
        const player = G.players[playerId];
        
        if (!player) {
          return false; // Don't skip if player not found
        }
        
        // Skip to next phase if no active shield
        const hasActiveShield = player.activeShield !== null;
        console.log('[Shield Phase] endIf: Checking for active shield. Has shield:', hasActiveShield, 'Shield name:', player.activeShield?.card?.name);
        if (!hasActiveShield) {
          console.log('[Shield Phase] endIf: No active shield, auto-skipping to Ally phase');
          return true; // Skip this phase
        }
        
        console.log('[Shield Phase] endIf: Active shield found, not skipping. Shield:', player.activeShield.card.name, 'faceDown:', player.activeShield.faceDown);
        return false; // Don't skip, let onBegin handle the flip
      },
      onBegin: ({ G, ctx }) => {
        console.log('[Shield Phase] onBegin called! ctx.phase:', ctx.phase, 'G.currentPhase:', G.currentPhase);
        
        // Safety checks
        if (!ctx || !ctx.currentPlayer || !G || !G.players) {
          console.warn('[Shield Phase] onBegin: Missing context or game state');
          return;
        }
        
        const playerId = ctx.currentPlayer;
        const player = G.players[playerId];
        
        if (!player) {
          console.warn('[Shield Phase] onBegin: Player not found:', playerId);
          return;
        }
        
        // Check if player has no active shield - if so, immediately skip to next phase
        const hasActiveShield = player.activeShield !== null;
        if (!hasActiveShield) {
          console.log('[Shield Phase] onBegin: Player has no active shield, immediately skipping to Ally phase');
          console.warn('[Shield Phase] onBegin: WARNING - Expected shield to exist but it does not! This may indicate a state persistence issue.');
          // Use boardgame.io's phase system to transition
          if (ctx.events && ctx.events.endPhase) {
            ctx.events.endPhase();
          }
          return;
        }
        
        // CRITICAL: Verify shield card object is valid
        if (!player.activeShield.card) {
          console.error('[Shield Phase] onBegin: ERROR - activeShield exists but card is null/undefined! This should not happen.');
          // Clear invalid shield
          player.activeShield = null;
          if (ctx.events && ctx.events.endPhase) {
            ctx.events.endPhase();
          }
          return;
        }
        
        // If we reach here, player has an active shield
        // Log current shield state
        console.log('[Shield Phase] onBegin - Found active shield:', {
          cardName: player.activeShield?.card?.name,
          faceDown: player.activeShield?.faceDown,
          energyGenerated: player.activeShield?.card?.energyGenerated
        });
        
        // CRITICAL: Store card reference before any mutations to ensure it persists
        const shieldCardRef = player.activeShield.card;
        const shieldCardId = shieldCardRef?.id;
        
        // Shield Phase: Shields should already be face-up (flipped at end of previous turn)
        // This is a fallback in case a shield somehow didn't flip, or for shields that are already active
        if (player.activeShield.faceDown === true) {
          // Fallback: If shield is still face-down, flip it now (shouldn't normally happen)
          console.log('[Shield Phase] Fallback: Flipping shield face-up:', player.activeShield.card.name);
          player.activeShield.faceDown = false;
          console.log('[Shield Phase] Shield flipped! New faceDown value:', player.activeShield.faceDown);
          
          // Verify card reference is still valid before processing effect
          if (!player.activeShield.card || player.activeShield.card.id !== shieldCardId) {
            console.warn('[Shield Phase] WARNING: Shield card reference lost during flip! Restoring...');
            if (shieldCardRef) {
              player.activeShield.card = shieldCardRef;
            }
          }
          
          // Process shield written effects when flipped face-up
          processShieldEffect(G, ctx, playerId, player.activeShield.card);
        } else {
          // Shield is already face-up (normal case - was flipped at end of previous turn)
          // Verify card reference is still valid
          if (!player.activeShield.card || player.activeShield.card.id !== shieldCardId) {
            console.warn('[Shield Phase] WARNING: Shield card reference may be invalid! Restoring...');
            if (shieldCardRef) {
              player.activeShield.card = shieldCardRef;
            }
          }
          
          // For shields with attack effects (like Warhino General), trigger the effect every turn
          const shieldAbility = player.activeShield.card.ability || '';
          const hasAttackEffect = shieldAbility.toLowerCase().includes('attack:');
          console.log('[Shield Phase] Shield is face-up. Ability:', shieldAbility, 'Has attack effect:', hasAttackEffect);
          
          if (hasAttackEffect) {
            console.log('[Shield Phase] Shield is face-up with attack effect - triggering ability every turn:', player.activeShield.card.name);
            processShieldEffect(G, ctx, playerId, player.activeShield.card);
            
            // CRITICAL: Verify shield still exists after processing effect
            if (!player.activeShield || !player.activeShield.card) {
              console.error('[Shield Phase] ERROR: Shield disappeared after processing effect! Attempting to restore...');
              if (shieldCardRef) {
                player.activeShield = {
                  card: shieldCardRef,
                  faceDown: false
                };
                console.log('[Shield Phase] Shield restored after effect processing');
              }
            }
          } else {
            // Energy is calculated dynamically in calculateAvailableEnergy
            console.log('[Shield Phase] Shield is already face-up (flipped at end of previous turn). Energy will be calculated in Energy Phase.');
          }
        }
        
        // Final verification that shield still exists
        if (!player.activeShield || !player.activeShield.card) {
          console.error('[Shield Phase] ERROR: Shield is missing at end of onBegin! This should not happen.');
        } else {
          console.log('[Shield Phase] Final shield state:', {
            cardName: player.activeShield.card.name,
            faceDown: player.activeShield.faceDown,
            availableEnergy: G.availableEnergy
          });
        }
      },
      moves: {
        // Explicitly include global moves to ensure they're available
        PlayCard: playCardMove,
        BuyCard: buyCardMove,
        EndTurn: {
          move: endTurnMove,
          client: true, // Enable events so ctx.events.endTurn() is available
        },
        DustCard: dustCardMove,
        DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
        SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
        WarhinoGeneralDustOpponent: warhinoGeneralDustOpponentMove,
        WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
        WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
        WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
        WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
        MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
        MachbootChaserSelectCard: machbootChaserSelectCardMove,
        MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
        PlayAllEnergyCoins: playAllEnergyCoinsMove,
        UndoMove: undoMove,
        BlockWithShield: blockWithShieldMove,
        ResolveAttack: resolveAttackMove,
        // Shield Phase: Active Shield automatically activates (generates Energy/Effects)
        // This happens automatically - active shields provide energy/effects in Energy Phase
        // Player can skip if no active shield or after shield activates
        SkipShieldPhase: ({ G, ctx }) => {
          if (ctx.events && ctx.events.endPhase) {
            ctx.events.endPhase();
          } else {
            G.currentPhase = PHASES.ALLY;
            if (ctx.events && ctx.events.setPhase) {
              ctx.events.setPhase(PHASES.ALLY);
            }
          }
        },
      },
      next: PHASES.ALLY,
    },
    
    [PHASES.ALLY]: {
      moves: {
        // Explicitly include global moves to ensure they're available
        PlayCard: playCardMove,
        BuyCard: buyCardMove,
        EndTurn: {
          move: endTurnMove,
          client: true, // Enable events so ctx.events.endTurn() is available
        },
        DustCard: dustCardMove,
        DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
        SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
        WarhinoGeneralDustOpponent: warhinoGeneralDustOpponentMove,
        WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
        WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
        WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
        WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
        MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
        MachbootChaserSelectCard: machbootChaserSelectCardMove,
        MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
        PlayAllEnergyCoins: playAllEnergyCoinsMove,
        UndoMove: undoMove,
        BlockWithShield: blockWithShieldMove,
        ResolveAttack: resolveAttackMove,
        SkipAllyPhase: ({ G, ctx }) => {
          // Automatically transition to Energy Phase, which will auto-calculate and move to Acquisition
          G.currentPhase = PHASES.ENERGY;
        },
      },
      next: PHASES.ENERGY,
      onEnd: ({ G, ctx }) => {
        // Energy Phase Logic: Automatically calculate energy when Ally Phase ends
        // This ensures energy is totaled before moving to Acquisition Phase
        console.log('[Ally Phase] onEnd: Auto-calculating energy');
        const playerId = ctx.currentPlayer;
        const player = G.players[playerId];
        
        if (!player) return;
        
        // Fix Energy Calculation: Calculate energy dynamically from playArea
        const calculatedEnergy = calculateAvailableEnergy(G, playerId);
        G.availableEnergy = calculatedEnergy;
        console.log('[Ally Phase] onEnd: Final calculated energy (dynamic):', calculatedEnergy);
      },
    },
    
    [PHASES.ENERGY]: {
      // Energy Phase Logic: Automatically calculate energy and transition to Acquisition Phase
      onBegin: ({ G, ctx }) => {
        // Safety checks
        if (!ctx || !ctx.currentPlayer || !G || !G.players) {
          return;
        }
        
        const playerId = ctx.currentPlayer;
        const player = G.players[playerId];
        
        if (!player) return;
        
        console.log('[Energy Phase] onBegin: Auto-calculating energy dynamically');
        console.log('[Energy Phase] onBegin: PlayArea cards:', player.playArea.map(c => ({ name: c.name, type: c.type, id: c.id })));
        
        // Fix Energy Calculation: Calculate energy dynamically from playArea
        const calculatedEnergy = calculateAvailableEnergy(G, playerId);
        G.availableEnergy = calculatedEnergy;
        
        // Count Energy Cells in playArea to verify they're all counted
        const energyCellsInPlayArea = player.playArea.filter(card => 
          card.type === CARD_TYPES.RESOURCE && card.resourceType === RESOURCE_TYPES.ENERGY_CELL
        );
        console.log('[Energy Phase] onBegin: Energy Cells in playArea:', energyCellsInPlayArea.length);
        console.log('[Energy Phase] onBegin: Final calculated energy:', calculatedEnergy);
        
        // Automatically transition to Acquisition Phase
        // Fix Sync Issue: Use ctx.events.endPhase() to keep engine in sync
        if (ctx.events && ctx.events.endPhase) {
          console.log('[Energy Phase] onBegin: Calling ctx.events.endPhase() to transition to Acquisition');
          ctx.events.endPhase();
        } else {
          console.warn('[Energy Phase] onBegin: ctx.events.endPhase() not available, using fallback');
          G.currentPhase = PHASES.ACQUISITION;
        }
      },
      moves: {
        // Explicitly include global moves to ensure they're available
        PlayCard: playCardMove,
        BuyCard: buyCardMove,
        EndTurn: {
          move: endTurnMove,
          client: true, // Enable events so ctx.events.endTurn() is available
        },
        DustCard: dustCardMove,
        DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
        SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
        WarhinoGeneralDustOpponent: warhinoGeneralDustOpponentMove,
        WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
        WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
        WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
        WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
        MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
        MachbootChaserSelectCard: machbootChaserSelectCardMove,
        MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
        PlayAllEnergyCoins: playAllEnergyCoinsMove,
        UndoMove: undoMove,
        BlockWithShield: blockWithShieldMove,
        ResolveAttack: resolveAttackMove,
        // Manual CalculateEnergy (if needed, though onBegin handles it automatically)
        CalculateEnergy: ({ G, ctx }) => {
          // This is now handled automatically in onBegin, but keeping for manual trigger if needed
          if (ctx.events && ctx.events.endPhase) {
            ctx.events.endPhase();
          } else {
            G.currentPhase = PHASES.ACQUISITION;
          }
        },
      },
      next: PHASES.ACQUISITION,
    },
    
    [PHASES.ACQUISITION]: {
      moves: {
        // Explicitly include global moves to ensure they're available
        PlayCard: playCardMove,
        BuyCard: buyCardMove,
        EndTurn: {
          move: endTurnMove,
          client: true, // Enable events so ctx.events.endTurn() is available
        },
        DustCard: dustCardMove,
        DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
        SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
        WarhinoGeneralDustOpponent: warhinoGeneralDustOpponentMove,
        WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
        WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
        WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
        WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
        MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
        MachbootChaserSelectCard: machbootChaserSelectCardMove,
        MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
        UndoMove: undoMove,
        BlockWithShield: blockWithShieldMove,
        ResolveAttack: resolveAttackMove,
        // Phase-specific moves can be added here if needed
        SkipAcquisitionPhase: ({ G, ctx }) => {
          G.currentPhase = PHASES.DISCARD;
        },
        AcquireRelic: ({ G, ctx }, stackId) => {
          // Save state before move
          saveStateSnapshot(G);
          
          const playerId = ctx.currentPlayer;
          const player = G.players[playerId];
          
          if (!G.relicStacks || stackId < 0 || stackId >= G.relicStacks.length) {
            return INVALID_MOVE;
          }
          
          const stack = G.relicStacks[stackId];
          if (!stack.cards || stack.cards.length === 0) {
            return INVALID_MOVE;
          }
          
          // Relics cost 8 Energy
          const relicCost = 8;
          // Market Logic: Use canAfford helper to check if player can afford the relic
          if (!canAfford({ cost: relicCost }, G.availableEnergy)) {
            return INVALID_MOVE;
          }
          
          const acquiredRelic = stack.cards.pop();
          
          // Add log entry
          addLogEntry(G, ctx, 'Acquired Relic', `${acquiredRelic.name} (Cost: 8 Energy)`);
          // Deduct cost from availableEnergy (energy persists until spent)
          G.availableEnergy = (G.availableEnergy || 0) - relicCost;
          
          // Update revealed card
          if (stack.cards.length > 0) {
            stack.revealedCard = stack.cards[stack.cards.length - 1];
          } else {
            // EDGE CASE: Empty Relic Stack - If last relic in a stack is acquired,
            // flip the next relic from the remaining stack to maintain 2 choices
            stack.revealedCard = null;
            
            // Find the other stack
            const otherStack = G.relicStacks.find(s => s.stackId !== stackId);
            if (otherStack && otherStack.cards.length > 0) {
              // Flip the next relic from the remaining stack to occupy the empty stack
              const nextRelic = otherStack.cards.pop();
              stack.cards.push(nextRelic);
              stack.revealedCard = nextRelic;
              console.log('[AcquireRelic] Empty Relic Stack Edge Case: Flipped', nextRelic.name, 'from remaining stack to maintain 2 choices');
              addLogEntry(G, ctx, 'Relic Stack', `Empty stack refilled - ${nextRelic.name} revealed`);
            }
          }
          
          player.relics.push(acquiredRelic);
          
          // The Orderhelm: When acquired, may recruit any number of allies with total cost 7 or less
          if (acquiredRelic.name === 'The Orderhelm') {
            // Set up pending choice for player to select allies
            const affordableAllies = G.market
              .filter(stack => stack.cardType === CARD_TYPES.ALLY && stack.cards.length > 0)
              .map(stack => ({
                stackId: stack.stackId,
                card: stack.cards[stack.cards.length - 1],
                cost: stack.cost,
              }))
              .filter(({ cost }) => cost <= 7); // Only allies costing 7 or less
            
            if (affordableAllies.length > 0) {
              G.pendingChoice = {
                playerId: playerId,
                card: acquiredRelic,
                choiceType: 'orderhelm_recruit',
                message: 'The Orderhelm: Recruit any number of allies with total cost 7 or less',
                availableAllies: affordableAllies,
                selectedAllies: [],
                totalCost: 0,
                maxCost: 7,
              };
              console.log('[AcquireRelic] The Orderhelm: Set up pending choice to recruit allies');
            } else {
              addLogEntry(G, ctx, 'Relic Ability', `${acquiredRelic.name}: No affordable allies to recruit`);
            }
          }
          
          // Check for end game trigger: 3rd relic
          // When a player acquires their 3rd relic, trigger final round
          // All other players get one more turn, then game ends
          if (player.relics.length === 3 && !G.finalRound) {
            G.finalRound = true;
            G.finalRoundTriggeredBy = playerId;
            G.finalRoundTurnsRemaining = ctx.numPlayers - 1; // Other players get one more turn
            addLogEntry(G, ctx, 'End Game Triggered', `${playerId} acquired their 3rd Relic! Final round begins - all other players get one more turn.`);
            console.log('[AcquireRelic] End game triggered: Player', playerId, 'acquired 3rd relic. Final round begins.');
          }
        },
        // Retrieve: Take a card (except Relics) from the Dust Playmat and put it into your hand
        Retrieve: ({ G, ctx }, cardId) => {
          const playerId = ctx.currentPlayer;
          const player = G.players[playerId];
          
          // Find card in Dust
          const cardIndex = G.dust.findIndex(card => card.id === cardId);
          
          if (cardIndex === -1) {
            return INVALID_MOVE;
          }
          
          const card = G.dust[cardIndex];
          
          // Cannot retrieve Relics
          if (card.type === CARD_TYPES.RELIC) {
            return INVALID_MOVE;
          }
          
          // Remove from Dust and add to hand
          G.dust.splice(cardIndex, 1);
          player.hand.push(card);
          
          return card;
        },
        SkipAcquisitionPhase: ({ G, ctx }) => {
          G.currentPhase = PHASES.DISCARD;
        },
      },
      next: PHASES.DISCARD,
    },
    
    [PHASES.DISCARD]: {
      moves: {
        // Explicitly include global moves to ensure they're available
        PlayCard: playCardMove,
        BuyCard: buyCardMove,
        EndTurn: {
          move: endTurnMove,
          client: true, // Enable events so ctx.events.endTurn() is available
        },
        DustCard: dustCardMove,
        DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
        SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
        WarhinoGeneralDustOpponent: warhinoGeneralDustOpponentMove,
        WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
        WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
        WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
        WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
        MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
        MachbootChaserSelectCard: machbootChaserSelectCardMove,
        MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
        UndoMove: undoMove,
        DiscardHand: ({ G, ctx }) => {
          const playerId = ctx.currentPlayer;
          const player = G.players[playerId];
          
          // CRITICAL: Ensure discard pile exists and belongs to the correct player
          if (!player.discard) {
            console.error('[DiscardHand] ERROR: player.discard is undefined! Initializing for player:', playerId);
            player.discard = [];
          }
          // Move all cards in hand to discard
          player.discard.push(...player.hand);
          console.log('[DiscardHand] Moved', player.hand.length, 'cards from hand to discard for player', playerId, '. Discard length:', player.discard.length);
          player.hand = [];
          
          // Move all cards in play area to discard (Energy Coins, Allies, etc.)
          player.discard.push(...player.playArea);
          console.log('[DiscardHand] Moved', player.playArea.length, 'cards from playArea to discard for player', playerId, '. Discard length:', player.discard.length);
          player.playArea = [];
          
          G.currentPhase = PHASES.RESET;
        },
      },
      next: PHASES.RESET,
    },
    
    [PHASES.RESET]: {
      moves: {
        // Explicitly include global moves to ensure they're available
        PlayCard: playCardMove,
        BuyCard: buyCardMove,
        EndTurn: {
          move: endTurnMove,
          client: true, // Enable events so ctx.events.endTurn() is available
        },
        DustCard: dustCardMove,
        DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
        SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
        WarhinoGeneralDustOpponent: warhinoGeneralDustOpponentMove,
        WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
        WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
        WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
        WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
        MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
        MachbootChaserSelectCard: machbootChaserSelectCardMove,
        MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
        UndoMove: undoMove,
        DrawCards: ({ G, ctx }) => {
          const playerId = ctx.currentPlayer;
          const player = G.players[playerId];
          
          // Turn Manager: Reset availableEnergy at start of "End Turn" phase
          G.availableEnergy = 0;
          
          // Draw cards back up to starting hand size (respects The Founder's Ring)
          const hasFoundersRing = [...(player.relics || []), ...(player.activeRelics || [])].some(r => r.name === "The Founder's Ring");
          const targetHandSize = hasFoundersRing ? 6 : (player.startingHandSize || 5);
          
          // Draw cards until hand reaches target size
          while (player.hand.length < targetHandSize) {
            if (!drawCard(player, G, ctx, playerId)) {
              // Can't draw more cards (deck and discard empty)
              break;
            }
          }
          
          G.currentPhase = PHASES.DUST;
        },
      },
      next: PHASES.DUST,
    },
    
    [PHASES.DUST]: {
      // End phase (and turn) if EndTurn was called
      // This is evaluated when the phase begins or when moves are made
      endIf: ({ G, ctx }) => {
        const shouldEnd = G._endTurnRequested === true;
        console.log('[DUST Phase] endIf evaluated. _endTurnRequested:', G._endTurnRequested, 'shouldEnd:', shouldEnd, 'currentPlayer:', ctx.currentPlayer, 'turn:', ctx.turn);
        if (shouldEnd) {
          console.log('[DUST Phase] endIf: EndTurn requested, ending phase and turn');
          G._endTurnRequested = false; // Reset flag
          return true; // End the phase, which should end the turn
        }
        return false;
      },
      onBegin: ({ G, ctx }) => {
        // When DUST phase begins, check if we should end immediately
        console.log('[DUST Phase] onBegin called. _endTurnRequested:', G._endTurnRequested);
        if (G._endTurnRequested === true) {
          console.log('[DUST Phase] onBegin: _endTurnRequested is true, phase should end via endIf');
        }
      },
      moves: {
        // Explicitly include global moves to ensure they're available
        PlayCard: playCardMove,
        BuyCard: buyCardMove,
        EndTurn: {
          move: endTurnMove,
          client: true, // Enable events so ctx.events.endTurn() is available
        },
        DustCard: dustCardMove,
        DiscardFusionFragmentForEnergy: discardFusionFragmentForEnergyMove,
        SkipFusionFragmentDiscard: skipFusionFragmentDiscardMove,
        WarhinoGeneralDustOpponent: warhinoGeneralDustOpponentMove,
        WarhinoGeneralRetrieve: warhinoGeneralRetrieveMove,
        WarhinoGeneralSelectRetrieve: warhinoGeneralSelectRetrieveMove,
        WarhinoGeneralSelectOpponent: warhinoGeneralSelectOpponentMove,
        WarhinoGeneralSelectCard: warhinoGeneralSelectCardMove,
        MachbootChaserSelectOpponent: machbootChaserSelectOpponentMove,
        MachbootChaserSelectCard: machbootChaserSelectCardMove,
        MachbootChaserConfirmDiscard: machbootChaserConfirmDiscardMove,
        UndoMove: undoMove,
        SkipDustPhase: ({ G, ctx }) => {
          // End turn - boardgame.io will handle turn transition automatically
          // If we need to explicitly end the turn, we can use ctx.events.endTurn()
          // but it should be available by default in moves
          if (ctx.events && ctx.events.endTurn) {
            ctx.events.endTurn();
          }
        },
      },
      // When DUST phase ends, check if turn should end
      onEnd: ({ G, ctx }) => {
        console.log('[DUST Phase] onEnd called. _endTurnRequested:', G._endTurnRequested);
      },
      // Cycle back to RELIC for same player if phase doesn't end
      // If endIf returns true, the turn will end instead
      next: PHASES.RELIC,
    },
  },
};

