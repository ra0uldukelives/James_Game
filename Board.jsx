import React, { useState } from 'react';
import { CARD_TYPES, RESOURCE_TYPES, ALLY_SUBTYPES, calculateVictoryPoints } from './Game';

const Board = ({ G, ctx, moves, playerID }) => {
  const currentPlayerId = ctx.currentPlayer;
  const currentPlayer = G.players[currentPlayerId];
  const isMyTurn = ctx.currentPlayer === playerID;
  // CRITICAL: Use the viewing player's hand, not the current turn player's hand
  // This ensures "Your Hand" shows the correct player's cards even when it's not their turn
  const myPlayer = G.players[playerID];
  const hand = myPlayer ? (myPlayer.hand || []) : [];
  const playArea = myPlayer ? (myPlayer.playArea || []) : [];
  const activeShield = myPlayer ? myPlayer.activeShield : null;
  
  // Debug: Log activeShield state changes
  React.useEffect(() => {
    if (activeShield) {
      console.log('[Board] activeShield state updated:', {
        cardName: activeShield.card?.name,
        cardId: activeShield.card?.id,
        faceDown: activeShield.faceDown,
        handLength: hand.length,
        cardInHand: hand.some(c => c.id === activeShield.card?.id)
      });
    } else {
      console.log('[Board] activeShield is null/undefined');
    }
  }, [activeShield, hand]);
  const relics = currentPlayer.relics || [];
  const market = G.market || [];
  const dust = G.dust || [];
  const relicStacks = G.relicStacks || [];
  const availableEnergy = G.availableEnergy || 0;
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredMarketCard, setHoveredMarketCard] = useState(null);
  const [dustMode, setDustMode] = useState(false);
  const [lastPurchase, setLastPurchase] = useState(null);
  const [viewingDeck, setViewingDeck] = useState(false);
  const [viewingDiscard, setViewingDiscard] = useState(false);
  const [viewingPlayerDiscard, setViewingPlayerDiscard] = useState(null); // null or playerId
  const [shieldPromptCard, setShieldPromptCard] = useState(null); // Card that can be played as Shield
  const [dustPromptCard, setDustPromptCard] = useState(null); // Card selected for dusting confirmation
  const [selectedCardToDust, setSelectedCardToDust] = useState(null); // Card selected for Warhino General dusting
  const [showGameLog, setShowGameLog] = useState(false); // Toggle for game log visibility

  // Clear selected card when pending choice changes or is cleared
  React.useEffect(() => {
    if (!G.pendingChoice || 
        (G.pendingChoice.choiceType !== 'warhino_general_select_card_attack' && 
         G.pendingChoice.choiceType !== 'warhino_general_select_card_shield')) {
      setSelectedCardToDust(null);
    }
  }, [G.pendingChoice]);
  const [errorMessage, setErrorMessage] = useState(null); // Error message to display to player
  
  const hasDustedThisTurn = currentPlayer.hasDustedThisTurn || false;
  const canDust = !hasDustedThisTurn && hand.length > 0;
  const gameLog = G.gameLog || [];

  /**
   * Card Back Template Component
   * 
   * All cards in the game share the same back design
   * Used when cards are face-down (in deck, discard, charging shields, etc.)
   */
  const CardBackTemplate = ({ size = 'normal' }) => {
    const isSmall = size === 'small';
    const cardWidth = isSmall ? 'w-24' : 'w-40';
    const cardHeight = isSmall ? 'h-36' : 'h-56';
    
    // Card back styling - dark, mysterious design with game logo/pattern
    const cardBackGradient = 'bg-gradient-to-br from-gray-800 via-gray-900 to-black';
    const borderColor = 'border-gray-600';
    
    return (
      <div
        className={`card-back ${cardBackGradient} ${cardWidth} ${cardHeight} rounded-lg shadow-xl border-4 ${borderColor} relative overflow-hidden`}
      >
        {/* Decorative pattern/design on card back */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {/* Central emblem/logo area */}
            <div className={`${isSmall ? 'w-16 h-16' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-amber-600 to-yellow-800 border-4 border-amber-400 flex items-center justify-center shadow-lg`}>
              <span className={`${isSmall ? 'text-2xl' : 'text-4xl'} font-bold text-white`}>✦</span>
            </div>
            {/* Game title or pattern */}
            {!isSmall && (
              <div className="mt-4 text-center">
                <div className="text-white text-xs font-bold tracking-wider uppercase">
                  Dust to Dust
                </div>
                <div className="text-gray-400 text-[10px] mt-1">
                  Card Game
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-2 border-amber-400 rounded-sm opacity-50"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-2 border-amber-400 rounded-sm opacity-50"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-2 border-amber-400 rounded-sm opacity-50"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-amber-400 rounded-sm opacity-50"></div>
      </div>
    );
  };

  /**
   * Energy Coin Card Template Component
   * 
   * CSS Classes for easy customization:
   * - .energy-coin-card - Main card container
   * - .energy-coin-value - Energy value indicator (center, large)
   * - .energy-coin-title - Card title (top)
   * - .energy-coin-symbol - Energy symbol/icon area
   * 
   * Card Properties:
   * - energyValue: Always 1 for Energy Coins
   * - name: "Energy Cell" or "Energy Coin"
   */
  const EnergyCoinTemplate = ({ card, size = 'normal', onClick = null, showDetails = true, isSelected = false }) => {
    if (!card || card.type !== CARD_TYPES.RESOURCE || card.resourceType !== RESOURCE_TYPES.ENERGY_CELL) {
      return null;
    }

    const isSmall = size === 'small';
    const cardWidth = isSmall ? 'w-24' : 'w-40';
    const cardHeight = isSmall ? 'h-36' : 'h-56';
    
    // Energy Coin styling - blue/cyan gradient with gold accents
    const cardGradient = 'bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600';
    const borderColor = 'border-cyan-300';
    const energyValue = card.energyValue || 1;

    return (
      <div
        className={`energy-coin-card ${cardGradient} ${cardWidth} ${cardHeight} rounded-lg shadow-xl transform transition hover:scale-110 hover:shadow-2xl active:scale-95 border-4 ${
          isSelected ? 'border-yellow-400 ring-4 ring-yellow-300 ring-opacity-50' : borderColor
        } relative ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={(e) => {
          console.log('[EnergyCoinTemplate] onClick triggered for card:', card.id, card.name);
          e.preventDefault();
          e.stopPropagation();
          if (onClick) {
            // Verify card.id exists before calling onClick
            if (card.id === undefined || card.id === null) {
              console.error('[EnergyCoinTemplate] card.id is undefined or null for card:', card);
              return;
            }
            onClick();
          }
        }}
        onMouseEnter={() => showDetails && setHoveredCard(card)}
        onMouseLeave={() => showDetails && setHoveredCard(null)}
      >
        {/* Card Title - Top */}
        <div className={`energy-coin-title absolute ${isSmall ? 'top-2' : 'top-3'} left-1/2 transform -translate-x-1/2 w-full px-2`}>
          <div className={`text-white font-bold text-center ${isSmall ? 'text-xs' : 'text-sm'} leading-tight drop-shadow-lg`}>
            {card.name}
          </div>
        </div>

        {/* Energy Symbol/Icon Area - Center */}
        <div className={`energy-coin-symbol absolute ${isSmall ? 'top-12' : 'top-16'} left-1/2 transform -translate-x-1/2`}>
          <div className={`${isSmall ? 'w-12 h-12' : 'w-20 h-20'} rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 border-4 border-white shadow-lg flex items-center justify-center`}>
            <span className={`${isSmall ? 'text-2xl' : 'text-4xl'} font-bold text-white`}>⚡</span>
          </div>
        </div>

        {/* Energy Value - Below Symbol */}
        <div className={`energy-coin-value absolute ${isSmall ? 'top-24' : 'top-32'} left-1/2 transform -translate-x-1/2`}>
          <div className={`${isSmall ? 'w-10 h-10' : 'w-16 h-16'} rounded-full bg-black bg-opacity-60 text-white font-bold ${isSmall ? 'text-lg' : 'text-2xl'} flex items-center justify-center border-2 border-white border-opacity-50 shadow-lg`}>
            {energyValue}
          </div>
        </div>

        {/* Energy Label - Bottom */}
        <div className={`absolute ${isSmall ? 'bottom-2' : 'bottom-4'} left-1/2 transform -translate-x-1/2`}>
          <div className={`text-white ${isSmall ? 'text-xs' : 'text-sm'} font-semibold bg-black bg-opacity-50 px-3 py-1 rounded-full border border-white border-opacity-30`}>
            Energy
          </div>
        </div>
      </div>
    );
  };

  /**
   * Fusion Fragment Card Template Component
   * 
   * CSS Classes for easy customization:
   * - .fusion-fragment-card - Main card container
   * - .fusion-fragment-vp - Victory points indicator (center, large)
   * - .fusion-fragment-title - Card title (top)
   * - .fusion-fragment-symbol - Fragment symbol/icon area
   * 
   * Card Properties:
   * - victoryPoints: Always 2 for Fusion Fragments
   * - name: "Fusion Fragment"
   * Note: When played, goes to play area. VP counted at game end.
   * Some Ally cards may interact with Fusion Fragments.
   */
  const FusionFragmentTemplate = ({ card, size = 'normal', onClick = null, showDetails = true, isSelected = false }) => {
    if (!card || card.type !== CARD_TYPES.RESOURCE || card.resourceType !== RESOURCE_TYPES.FUSION_FRAGMENT) {
      return null;
    }

    const isSmall = size === 'small';
    const cardWidth = isSmall ? 'w-24' : 'w-40';
    const cardHeight = isSmall ? 'h-36' : 'h-56';
    
    // Fusion Fragment styling - purple/pink gradient with violet accents
    const cardGradient = 'bg-gradient-to-br from-purple-500 via-pink-400 to-purple-600';
    const borderColor = 'border-pink-300';
    const victoryPoints = card.victoryPoints || 2;

    return (
      <div
        className={`fusion-fragment-card ${cardGradient} ${cardWidth} ${cardHeight} rounded-lg shadow-xl transform transition hover:scale-110 hover:shadow-2xl active:scale-95 border-4 ${
          isSelected ? 'border-yellow-400 ring-4 ring-yellow-300 ring-opacity-50' : borderColor
        } relative ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
        onMouseEnter={() => showDetails && setHoveredCard(card)}
        onMouseLeave={() => showDetails && setHoveredCard(null)}
      >
        {/* Card Title - Top */}
        <div className={`fusion-fragment-title absolute ${isSmall ? 'top-2' : 'top-3'} left-1/2 transform -translate-x-1/2 w-full px-2`}>
          <div className={`text-white font-bold text-center ${isSmall ? 'text-xs' : 'text-sm'} leading-tight drop-shadow-lg`}>
            {card.name}
          </div>
        </div>

        {/* Fragment Symbol/Icon Area - Center */}
        <div className={`fusion-fragment-symbol absolute ${isSmall ? 'top-12' : 'top-16'} left-1/2 transform -translate-x-1/2`}>
          <div className={`${isSmall ? 'w-12 h-12' : 'w-20 h-20'} rounded-full bg-gradient-to-br from-violet-300 to-purple-400 border-4 border-white shadow-lg flex items-center justify-center`}>
            <span className={`${isSmall ? 'text-2xl' : 'text-4xl'} font-bold text-white`}>✦</span>
          </div>
        </div>

        {/* Victory Points Value - Below Symbol */}
        <div className={`fusion-fragment-vp absolute ${isSmall ? 'top-24' : 'top-32'} left-1/2 transform -translate-x-1/2`}>
          <div className={`${isSmall ? 'w-10 h-10' : 'w-16 h-16'} rounded-full bg-black bg-opacity-60 text-white font-bold ${isSmall ? 'text-lg' : 'text-2xl'} flex items-center justify-center border-2 border-white border-opacity-50 shadow-lg`}>
            {victoryPoints}
          </div>
        </div>

        {/* VP Label - Bottom */}
        <div className={`absolute ${isSmall ? 'bottom-2' : 'bottom-4'} left-1/2 transform -translate-x-1/2`}>
          <div className={`text-white ${isSmall ? 'text-xs' : 'text-sm'} font-semibold bg-black bg-opacity-50 px-3 py-1 rounded-full border border-white border-opacity-30`}>
            Victory Points
          </div>
        </div>
      </div>
    );
  };

  /**
   * Horizontal Relic Card Template Component - for Market/Stack display
   * 
   * Horizontal orientation to distinguish from other game cards
   * Shows relic symbol on left, name and ability in center, VP on right
   */
  const HorizontalRelicCardTemplate = ({ card, size = 'normal', onClick = null, showDetails = true, isSelected = false, isActive = false }) => {
    if (!card || card.type !== CARD_TYPES.RELIC) {
      return null;
    }

    const isSmall = size === 'small';
    // Horizontal orientation: wider than tall
    const cardWidth = isSmall ? 'w-48' : 'w-64';
    const cardHeight = isSmall ? 'h-24' : 'h-32';
    
    // Relic styling - amber/gold gradient with mystical appearance
    const cardGradient = 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600';
    const borderColor = isActive ? 'border-yellow-300' : 'border-amber-300';
    const victoryPoints = card.victoryPoints || 5; // Relics worth 5 VP
    const ability = card.ability || '';

    return (
      <div
        className={`relic-card-horizontal ${cardGradient} ${cardWidth} ${cardHeight} rounded-lg shadow-xl transform transition hover:scale-105 hover:shadow-2xl active:scale-95 border-4 ${
          isSelected ? 'border-yellow-400 ring-4 ring-yellow-300 ring-opacity-50' : borderColor
        } relative flex items-center ${
          onClick ? 'cursor-pointer' : ''
        } ${isActive ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}`}
        onClick={onClick}
        onMouseEnter={() => showDetails && setHoveredCard(card)}
        onMouseLeave={() => showDetails && setHoveredCard(null)}
      >
        {/* Left: Relic Symbol/Icon */}
        <div className="flex-shrink-0 px-3">
          <div className={`${isSmall ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 border-4 border-white shadow-lg flex items-center justify-center`}>
            <span className={`${isSmall ? 'text-xl' : 'text-3xl'} font-bold text-amber-800`}>✦</span>
          </div>
        </div>

        {/* Center: Card Info */}
        <div className="flex-1 flex flex-col justify-center px-2 min-w-0">
          {/* Card Title */}
          <div className="text-white font-bold text-center leading-tight drop-shadow-lg mb-1">
            <div className={`${isSmall ? 'text-xs' : 'text-sm'} truncate`}>
              {card.name}
            </div>
          </div>
          
          {/* Ability Text - truncated for horizontal display */}
          {ability && !isSmall && (
            <div className="text-white text-[10px] text-center leading-tight px-1 line-clamp-2">
              {ability}
            </div>
          )}
        </div>

        {/* Right: Victory Points */}
        <div className="flex-shrink-0 px-3">
          <div className={`bg-yellow-600 bg-opacity-80 text-white ${isSmall ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1.5'} font-bold rounded-full border border-white border-opacity-50`}>
            {victoryPoints} VP
          </div>
        </div>

        {/* Active indicator - top right corner */}
        {isActive && (
          <div className="absolute top-1 right-1 z-10">
            <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
              ACTIVE
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Relic Card Template Component (Vertical - for player's relic zone)
   * 
   * CSS Classes for easy customization:
   * - .relic-card - Main card container
   * - .relic-card-title - Card title (top center)
   * - .relic-card-vp - Victory points indicator (bottom)
   * - .relic-card-symbol - Relic symbol/icon area
   * 
   * Card Properties:
   * - name: Relic name
   * - description: Relic description/effect
   * - victoryPoints: Always 5 for Relics
   */
  const RelicCardTemplate = ({ card, size = 'normal', onClick = null, showDetails = true, isSelected = false, isActive = false, horizontal = false }) => {
    if (!card || card.type !== CARD_TYPES.RELIC) {
      return null;
    }

    const isSmall = size === 'small';
    const isHorizontal = horizontal || size === 'small'; // Default to horizontal for small, or when explicitly set
    
    // Horizontal orientation dimensions
    if (isHorizontal) {
      const cardWidth = isSmall ? 'w-48' : 'w-80';
      const cardHeight = isSmall ? 'h-24' : 'h-32';
      
      // Relic styling - amber/gold gradient with mystical appearance
      const cardGradient = 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600';
      const borderColor = isActive ? 'border-yellow-300' : 'border-amber-300';
      const victoryPoints = 5; // Relics always worth 5 VP
      const ability = card.ability || card.description || '';

      return (
        <div
          className={`relic-card ${cardGradient} ${cardWidth} ${cardHeight} rounded-lg shadow-xl transform transition hover:scale-105 hover:shadow-2xl active:scale-95 border-4 ${
            isSelected ? 'border-yellow-400 ring-4 ring-yellow-300 ring-opacity-50' : borderColor
          } relative flex flex-row items-center ${
            onClick ? 'cursor-pointer' : ''
          } ${isActive ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}`}
          onClick={onClick}
          onMouseEnter={() => showDetails && setHoveredCard(card)}
          onMouseLeave={() => showDetails && setHoveredCard(null)}
        >
          {/* Left: Relic Symbol/Icon */}
          <div className="flex-shrink-0 px-3 flex items-center justify-center">
            <div className={`${isSmall ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 border-3 border-white shadow-lg flex items-center justify-center`}>
              <span className={`${isSmall ? 'text-xl' : 'text-2xl'} font-bold text-amber-800`}>✦</span>
            </div>
          </div>

          {/* Center: Title and Ability */}
          <div className="flex-1 flex flex-col justify-center px-2 py-2 min-w-0">
            {/* Card Title */}
            <div className="relic-card-title mb-1">
              <div className={`text-white font-bold ${isSmall ? 'text-xs' : 'text-sm'} leading-tight drop-shadow-lg truncate`}>
                {card.name}
              </div>
            </div>
            
            {/* Ability Text */}
            {ability && (
              <div className="relic-card-ability">
                <div className={`text-white ${isSmall ? 'text-[9px]' : 'text-[10px]'} leading-tight line-clamp-2 bg-black bg-opacity-40 px-2 py-1 rounded`}>
                  {ability}
                </div>
              </div>
            )}
          </div>

          {/* Right: Stats */}
          <div className="flex-shrink-0 px-3 flex flex-col items-center justify-center gap-1">
            {/* Victory Points */}
            <div className="relic-card-vp">
              <div className={`text-white ${isSmall ? 'text-xs' : 'text-sm'} font-semibold bg-black bg-opacity-60 px-2 py-1 rounded-full border border-white border-opacity-30`}>
                {victoryPoints} VP
              </div>
            </div>
            
            {/* Energy Generated (if any) */}
            {card.energyGenerated !== undefined && card.energyGenerated > 0 && (
              <div className={`text-white ${isSmall ? 'text-[10px]' : 'text-xs'} font-semibold bg-blue-600 bg-opacity-80 px-2 py-0.5 rounded-full border border-white border-opacity-30`}>
                +{card.energyGenerated} ⚡
              </div>
            )}
            
            {/* Active indicator */}
            {isActive && (
              <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                ACTIVE
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Vertical orientation (for player's acquired relics)
    const cardWidth = isSmall ? 'w-24' : 'w-40';
    const cardHeight = isSmall ? 'h-36' : 'h-56';
    
    // Relic styling - amber/gold gradient with mystical appearance
    const cardGradient = 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600';
    const borderColor = isActive ? 'border-yellow-300' : 'border-amber-300';
    const victoryPoints = 5; // Relics always worth 5 VP

    return (
      <div
        className={`relic-card ${cardGradient} ${cardWidth} ${cardHeight} rounded-lg shadow-xl transform transition hover:scale-110 hover:shadow-2xl active:scale-95 border-4 ${
          isSelected ? 'border-yellow-400 ring-4 ring-yellow-300 ring-opacity-50' : borderColor
        } relative ${
          onClick ? 'cursor-pointer' : ''
        } ${isActive ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}`}
        onClick={onClick}
        onMouseEnter={() => showDetails && setHoveredCard(card)}
        onMouseLeave={() => showDetails && setHoveredCard(null)}
      >
        {/* Active indicator - top */}
        {isActive && (
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
              ACTIVE
            </div>
          </div>
        )}

        {/* Card Title - Top */}
        <div className={`relic-card-title absolute ${isSmall ? 'top-2' : 'top-3'} left-1/2 transform -translate-x-1/2 w-full px-2 ${isActive ? 'top-8' : ''}`}>
          <div className={`text-white font-bold text-center ${isSmall ? 'text-xs' : 'text-sm'} leading-tight drop-shadow-lg`}>
            {card.name}
          </div>
        </div>

        {/* Relic Symbol/Icon Area - Center */}
        <div className={`relic-card-symbol absolute ${isSmall ? 'top-12' : 'top-20'} left-1/2 transform -translate-x-1/2`}>
          <div className={`${isSmall ? 'w-12 h-12' : 'w-20 h-20'} rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 border-4 border-white shadow-lg flex items-center justify-center`}>
            <span className={`${isSmall ? 'text-2xl' : 'text-4xl'} font-bold text-amber-800`}>✦</span>
          </div>
        </div>

        {/* Victory Points - Bottom */}
        <div className={`relic-card-vp absolute ${isSmall ? 'bottom-2' : 'bottom-4'} left-1/2 transform -translate-x-1/2`}>
          <div className={`text-white ${isSmall ? 'text-xs' : 'text-sm'} font-semibold bg-black bg-opacity-50 px-3 py-1 rounded-full border border-white border-opacity-30`}>
            {victoryPoints} VP
          </div>
        </div>

        {/* Description - if available and not small */}
        {(card.ability || card.description) && !isSmall && (
          <div className="absolute bottom-12 left-2 right-2">
            <div className="text-white text-[10px] text-center bg-black bg-opacity-50 px-2 py-1 rounded leading-tight">
              {card.ability || card.description}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Ally Card Template Component
   * 
   * CSS Classes for easy customization:
   * - .ally-card - Main card container
   * - .ally-card-victory-points - Victory points diamonds (upper left)
   * - .ally-card-cost - Cost badge (top right)
   * - .ally-card-title - Card title (top center)
   * - .ally-card-subtype - Subtype badge (below title)
   * - .ally-card-art - Card art area (center, ample room)
   * - .ally-card-effect - Effect text area (below art)
   * - .ally-card-energy - Energy production indicator (bottom)
   * 
   * Card Properties:
   * - victoryPoints: 0-3 (displayed as white diamonds)
   * - name: Card title
   * - subtype: Efficient, Attack, or Shield
   * - cost: Energy cost to purchase
   * - artUrl: Optional image URL for card art
   * - effectText: Card effect description
   * - energyProduction: Number of energy cells produced (if any)
   */
  const AllyCardTemplate = ({ card, size = 'normal', onClick = null, showDetails = true, isSelected = false }) => {
    if (!card || card.type !== CARD_TYPES.ALLY) return null;

    const isSmall = size === 'small';
    const cardWidth = isSmall ? 'w-24' : 'w-48';
    const cardHeight = isSmall ? 'h-36' : 'h-64';
    
    // Determine card color and border based on subtype
    let cardGradient = 'bg-gradient-to-br from-green-400 to-emerald-500';
    let borderColor = 'border-green-500'; // Default for Efficient
    
    if (card.subtype === ALLY_SUBTYPES.EFFICIENT) {
      cardGradient = 'bg-gradient-to-br from-green-400 to-emerald-500';
      borderColor = 'border-green-500';
    } else if (card.subtype === ALLY_SUBTYPES.ATTACK) {
      cardGradient = 'bg-gradient-to-br from-red-400 to-rose-500';
      borderColor = 'border-red-500'; // Red border for Attack
    } else if (card.subtype === ALLY_SUBTYPES.SHIELD) {
      cardGradient = 'bg-gradient-to-br from-indigo-400 to-blue-500';
      borderColor = 'border-blue-500'; // Blue border for Shield
    }

    const victoryPoints = card.victoryPoints || 0;
    const energyProduction = card.energyGenerated || card.energyProduction || 0;
    const effectText = card.ability || card.effectText || '';

    return (
      <div
        className={`ally-card ${cardGradient} ${cardWidth} ${cardHeight} rounded-lg shadow-xl transform transition hover:scale-110 hover:shadow-2xl active:scale-95 border-4 ${
          isSelected ? 'border-yellow-400 ring-4 ring-yellow-300 ring-opacity-50' : borderColor
        } relative ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
        onMouseEnter={() => showDetails && setHoveredCard(card)}
        onMouseLeave={() => showDetails && setHoveredCard(null)}
      >
        {/* Victory Points - Upper Left (White Diamonds) */}
        <div className={`ally-card-victory-points absolute ${isSmall ? 'top-1 left-1' : 'top-2 left-2'} flex gap-0.5`}>
          {[...Array(Math.min(victoryPoints, 3))].map((_, i) => (
            <div key={i} className={`${isSmall ? 'w-2 h-2' : 'w-3 h-3'} bg-white transform rotate-45 border border-gray-300`} />
          ))}
        </div>

        {/* Cost - Top Right */}
        <div className={`ally-card-cost absolute ${isSmall ? 'top-1 right-1' : 'top-2 right-2'}`}>
          <div className={`bg-black bg-opacity-60 text-white font-bold rounded-full ${isSmall ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} flex items-center justify-center border-2 border-white border-opacity-50`}>
            {card.cost || 0}
          </div>
        </div>

        {/* Card Title - Top Center */}
        <div className={`ally-card-title absolute ${isSmall ? 'top-8' : 'top-2'} left-1/2 transform -translate-x-1/2 ${isSmall ? 'w-full px-1' : 'w-3/4'}`}>
          <div className={`text-white font-bold text-center ${isSmall ? 'text-xs' : 'text-base'} leading-tight drop-shadow-lg`}>
            {card.name}
          </div>
        </div>

        {/* Card Subtype - Below Title */}
        {card.subtype && !isSmall && (
          <div className="ally-card-subtype absolute top-10 left-1/2 transform -translate-x-1/2">
            <div className="text-white text-xs font-semibold text-center capitalize bg-black bg-opacity-40 px-2 py-1 rounded">
              {card.subtype}
            </div>
          </div>
        )}

        {/* Card Art Area - Ample room in center */}
        {!isSmall && (
          <div className="ally-card-art absolute top-16 left-2 right-2 bottom-20 bg-black bg-opacity-20 rounded border border-white border-opacity-20 flex items-center justify-center">
            {card.artUrl ? (
              <img src={card.artUrl} alt={card.name} className="w-full h-full object-cover rounded" />
            ) : (
              <div className="text-white text-xs opacity-50 text-center px-2">
                Card Art
              </div>
            )}
          </div>
        )}

        {/* Card Effect Text - Below Art */}
        {effectText && !isSmall && (
          <div className="ally-card-effect absolute bottom-12 left-2 right-2">
            <div className="text-white text-xs text-center bg-black bg-opacity-50 px-2 py-1 rounded leading-tight">
              {effectText}
            </div>
          </div>
        )}

        {/* Energy Production - Bottom */}
        {energyProduction > 0 && (
          <div className={`ally-card-energy absolute ${isSmall ? 'bottom-1' : 'bottom-2'} left-1/2 transform -translate-x-1/2`}>
            <div className={`bg-blue-600 bg-opacity-80 text-white ${isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-3 py-1'} font-bold rounded-full border border-white border-opacity-50`}>
              +{energyProduction} Energy
            </div>
          </div>
        )}
      </div>
    );
  };

  // Card rendering helper
  const renderCard = (card, size = 'normal', onClick = null, showDetails = true, isSelected = false, faceDown = false) => {
    // If card is face-down, show card back
    if (faceDown) {
      return <CardBackTemplate size={size} />;
    }
    
    if (!card) return null;

    // Use Energy Coin template for Energy Coins
    if (card.type === CARD_TYPES.RESOURCE && card.resourceType === RESOURCE_TYPES.ENERGY_CELL) {
      return <EnergyCoinTemplate card={card} size={size} onClick={onClick} showDetails={showDetails} isSelected={isSelected} />;
    }

    // Use Fusion Fragment template for Fusion Fragments
    if (card.type === CARD_TYPES.RESOURCE && card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT) {
      return <FusionFragmentTemplate card={card} size={size} onClick={onClick} showDetails={showDetails} isSelected={isSelected} />;
    }

    // Use Ally template for Ally cards
    if (card.type === CARD_TYPES.ALLY) {
      return <AllyCardTemplate card={card} size={size} onClick={onClick} showDetails={showDetails} isSelected={isSelected} />;
    }

    // Use Relic template for Relic cards
    if (card.type === CARD_TYPES.RELIC) {
      // All acquired relics are active
      const isActive = true;
      return <RelicCardTemplate card={card} size={size} onClick={onClick} showDetails={showDetails} isSelected={isSelected} isActive={isActive} />;
    }

    const isSmall = size === 'small';
    const width = isSmall ? 'w-20' : 'w-32';
    const height = isSmall ? 'h-28' : 'h-44';
    const textSize = isSmall ? 'text-xs' : 'text-lg';
    const valueSize = isSmall ? 'w-6 h-6 text-xs' : 'w-10 h-10 text-sm';

    // Determine card color based on type
    let cardGradient = 'bg-gradient-to-br from-yellow-400 to-orange-500';
    if (card.type === CARD_TYPES.RESOURCE) {
      if (card.resourceType === RESOURCE_TYPES.ENERGY_CELL) {
        cardGradient = 'bg-gradient-to-br from-blue-400 to-cyan-500';
      } else if (card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT) {
        cardGradient = 'bg-gradient-to-br from-purple-400 to-pink-500';
      }
    } else if (card.type === CARD_TYPES.RELIC) {
      cardGradient = 'bg-gradient-to-br from-amber-400 to-yellow-600';
    }

    return (
      <div
        key={card.id}
        onClick={onClick}
        onMouseEnter={() => showDetails && setHoveredCard(card)}
        onMouseLeave={() => showDetails && setHoveredCard(null)}
        className={`${cardGradient} ${width} ${height} rounded-lg shadow-xl transform transition hover:scale-110 hover:shadow-2xl active:scale-95 flex flex-col items-center justify-center p-2 border-4 ${
          isSelected ? 'border-yellow-400 ring-4 ring-yellow-300 ring-opacity-50' : 'border-white border-opacity-30'
        } ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className={`text-white font-bold ${textSize} text-center mb-1`}>
          {card.name}
        </div>
        {card.cost !== undefined && (
          <div className={`text-white font-semibold bg-black bg-opacity-40 rounded-full ${valueSize} flex items-center justify-center`}>
            {card.cost}
          </div>
        )}
        {card.energyValue && (
          <div className="text-xs text-white mt-1 opacity-90">
            +{card.energyValue} Energy
          </div>
        )}
        {card.victoryPoints && (
          <div className="text-xs text-white mt-1 opacity-90">
            {card.victoryPoints} VP
          </div>
        )}
        {card.subtype && (
          <div className="text-xs text-white mt-1 opacity-80 capitalize">
            {card.subtype}
          </div>
        )}
      </div>
    );
  };

  // Handle playing a card (PlayCard handles Energy Cells automatically)
  const handlePlayCard = (cardId, playAsShield = false) => {
    // Multiplayer Check: Only allow playing cards on your turn
    if (!isMyTurn) {
      console.warn('[Board] handlePlayCard: Not your turn');
      return;
    }
    
    // Card ID Passing: Ensure cardId is valid
    if (cardId === undefined || cardId === null) {
      console.error('[Board] handlePlayCard: cardId is undefined or null');
      return;
    }
    
    console.log('[Board] handlePlayCard called with cardId:', cardId, 'Type:', typeof cardId, 'playAsShield:', playAsShield);
    console.log('[Board] Available moves:', Object.keys(moves));
    console.log('[Board] Current phase:', G.currentPhase);
    
    // Verify PlayCard move exists
    if (!moves.PlayCard) {
      console.error('[Board] PlayCard move not available in current phase');
      return;
    }
    
    try {
      moves.PlayCard(cardId, playAsShield);
      console.log('[Board] PlayCard move called successfully with cardId:', cardId, 'playAsShield:', playAsShield);
      // Clear shield prompt after playing
      setShieldPromptCard(null);
    } catch (error) {
      console.error('[Board] Error calling PlayCard:', error);
    }
  };

  // Handle clicking a card - check if it can be played as Shield
  const handleCardClick = (card) => {
    // Multiplayer Check: Only allow clicking cards on your turn
    if (!isMyTurn) {
      console.warn('[Board] handleCardClick: Not your turn');
      return;
    }
    
    console.log('[Board] handleCardClick called with card:', {
      id: card.id,
      name: card.name,
      type: card.type,
      isShield: card.isShield,
      hasActiveShield: currentPlayer.activeShield !== null
    });
    
    // Check if this is a Powerful Ally and player doesn't have an Ally Action
    if (card.type === CARD_TYPES.ALLY && 
        card.subtype === ALLY_SUBTYPES.POWERFUL && 
        !card.isShield && // Not trying to play as shield (that's handled separately)
        currentPlayer.allyActionsAvailable <= 0 &&
        !currentPlayer.nextPowerfulIsEfficient) {
      // Check if player has any non-Efficient allies or charging shield that would have consumed the action
      const hasNonEfficientAllies = currentPlayer.playArea.some(c => 
        c.type === CARD_TYPES.ALLY && c.subtype !== ALLY_SUBTYPES.EFFICIENT
      );
      const hasChargingShield = currentPlayer.activeShield && currentPlayer.activeShield.faceDown;
      
      // Only show error if action was actually consumed (not just a bug)
      if (hasNonEfficientAllies || hasChargingShield) {
        setErrorMessage('Cannot play Powerful Ally: You have already used your Ally Action this turn. You can play any number of Efficient Allies, but only one Powerful Ally per turn.');
        setTimeout(() => setErrorMessage(null), 5000); // Clear after 5 seconds
        return;
      }
    }
    
    // Check if card can be played as Shield (always show prompt if it's a shield card)
    if (card.type === CARD_TYPES.ALLY && card.isShield) {
      console.log('[Board] Card can be played as Shield - showing prompt');
      // Show prompt to choose whether to play as Shield or as regular Ally
      // This works even if there's already an active shield (allows replacement)
      setShieldPromptCard(card);
    } else {
      console.log('[Board] Playing card normally (not as shield)');
      // Play normally
      handlePlayCard(card.id, false);
    }
  };

  // Handle selecting a card for dusting - shows confirmation prompt
  const handleDustCard = (card) => {
    if (dustMode && canDust) {
      setDustPromptCard(card); // Show confirmation prompt
    }
  };

  // Handle confirming dust action
  const handleConfirmDust = () => {
    if (dustPromptCard && canDust) {
      moves.DustCard(dustPromptCard.id);
      setDustPromptCard(null);
      setDustMode(false); // Exit dust mode after dusting
    }
  };

  // Handle canceling dust action (No button - just close prompt, stay in dust mode)
  const handleCancelDustPrompt = () => {
    setDustPromptCard(null);
    // Stay in dust mode so user can select a different card
  };

  // Handle canceling dust mode entirely (Cancel Dust button)
  const handleCancelDustMode = () => {
    setDustPromptCard(null);
    setDustMode(false);
  };

  // Handle acquiring a relic from the relic stacks
  const handleAcquireRelic = (stackId) => {
    // Multiplayer Check: Only allow acquiring relics on your turn
    if (!isMyTurn) {
      console.warn('[Board] handleAcquireRelic: Not your turn');
      return;
    }
    
    console.log('[Board] handleAcquireRelic called - Attempting to acquire relic:', stackId);
    console.log('[Board] moves.AcquireRelic exists:', !!moves.AcquireRelic);
    console.log('[Board] Available moves:', Object.keys(moves));
    console.log('[Board] Current phase:', G.currentPhase || 'unknown');
    
    if (!moves.AcquireRelic) {
      console.error('[Board] AcquireRelic move not available');
      return;
    }
    
    const stack = relicStacks[stackId];
    if (!stack) {
      console.error('[Board] Relic stack not found at index:', stackId);
      return;
    }
    
    if (!stack.cards || stack.cards.length === 0) {
      console.warn('[Board] Cannot acquire from empty relic stack at index:', stackId);
      return;
    }
    
    // Relics cost 8 Energy
    const relicCost = 8;
    const canBuy = availableEnergy >= relicCost;
    if (!canBuy) {
      console.warn('[Board] Cannot afford relic. Cost:', relicCost, 'Available:', availableEnergy);
      return;
    }
    
    console.log('[Board] Calling AcquireRelic with stackId:', stackId);
    
    try {
      moves.AcquireRelic(stackId);
      console.log('[Board] AcquireRelic move called successfully for stack id:', stackId);
      
      // Store purchase info for visual feedback
      setLastPurchase({
        cardName: stack.revealedCard?.name || 'Relic',
        cost: relicCost,
        timestamp: Date.now()
      });
      
      // Clear purchase message after 3 seconds
      setTimeout(() => {
        setLastPurchase(null);
      }, 3000);
    } catch (error) {
      console.error('[Board] Error calling AcquireRelic:', error);
    }
  };

  // Handle buying a card from the market
  const handleBuyCard = (stackIndex) => {
    // Multiplayer Check: Only allow buying cards on your turn
    if (!isMyTurn) {
      console.warn('[Board] handleBuyCard: Not your turn');
      return;
    }
    
    console.log('[Board] handleBuyCard called - Attempting to buy card:', stackIndex);
    console.log('[Board] moves.BuyCard exists:', !!moves.BuyCard);
    console.log('[Board] Available moves:', Object.keys(moves));
    console.log('[Board] Current phase:', G.currentPhase || 'unknown');
    
    if (!moves.BuyCard) {
      console.error('[Board] BuyCard move not available');
      return;
    }
    
    console.log('[Board] handleBuyCard called with stackIndex:', stackIndex, 'Type:', typeof stackIndex);
    console.log('[Board] Market length:', market.length);
    console.log('[Board] Market stacks:', market.map((s, i) => ({ index: i, stackId: s.stackId, cardName: s.cardName, cardsRemaining: s.cards.length })));
    
    const stack = market[stackIndex];
    if (!stack) {
      console.error('[Board] Stack not found at index:', stackIndex);
      return;
    }
    
    if (!stack.cards || stack.cards.length === 0) {
      console.warn('[Board] Cannot buy from empty stack at index:', stackIndex);
      return;
    }
    
    // Check affordability before attempting purchase
    const canBuy = availableEnergy >= stack.cost;
    if (!canBuy) {
      console.warn('[Board] Cannot afford card. Cost:', stack.cost, 'Available:', availableEnergy);
      return;
    }
    
    console.log('[Board] Calling BuyCard with stackIndex:', stackIndex, 'Stack info:', { 
      stackId: stack.stackId, 
      cardName: stack.cardName, 
      cost: stack.cost,
      cardsRemaining: stack.cards.length 
    });
    
    try {
      moves.BuyCard(stackIndex);
      console.log('[Board] BuyCard move called successfully for stack index:', stackIndex);
      
      // Store purchase info for visual feedback
      setLastPurchase({
        cardName: stack.cardName,
        cost: stack.cost,
        timestamp: Date.now()
      });
      
      // Clear purchase message after 3 seconds
      setTimeout(() => {
        setLastPurchase(null);
      }, 3000);
    } catch (error) {
      console.error('[Board] Error calling BuyCard:', error);
    }
  };

  // Helper function to check if a market stack is affordable
  const canAffordStack = (stack) => {
    if (!stack || stack.cards.length === 0) return false;
    return availableEnergy >= stack.cost;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4 pr-80">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Deckbuilding Game</h1>
          <div className="flex justify-center gap-4 text-sm text-blue-200 flex-wrap">
            <span>
              Current Player: <span className="font-semibold text-yellow-300">Player {parseInt(currentPlayerId) + 1}</span>
              {playerID !== undefined && (
                <>
                  {' | '}
                  <span className="font-semibold">You: Player {parseInt(playerID) + 1}</span>
                  {!isMyTurn && <span className="text-red-300 ml-1">(Not Your Turn)</span>}
                </>
              )}
            </span>
            <span>
              Available Energy: <span className="font-semibold text-green-300">{availableEnergy}</span>
            </span>
            <span>
              Deck: {currentPlayer.deck?.length || 0} | Discard: {currentPlayer.discard?.length || 0}
            </span>
            <span>
              Phase: <span className="font-semibold text-purple-300 capitalize">{ctx.phase || G.currentPhase || 'unknown'}</span>
            </span>
          </div>
        </div>

        {/* Market Section */}
        <div className="mb-6 bg-black bg-opacity-20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">Market (12 Stacks)</h2>
            {G.currentPhase === 'acquisition' && (
              <div className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                Acquisition Phase - Buy cards with your Energy
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {market.map((stack, index) => {
              const isAffordable = canAffordStack(stack);
              const isEmpty = stack.cards.length === 0;
              const topCard = !isEmpty ? stack.cards[stack.cards.length - 1] : null;
              
              return (
                <div key={stack.stackId || index} className="bg-black bg-opacity-20 rounded-lg p-3">
                  {!isEmpty ? (
                    <div className="flex flex-col gap-2">
                      {/* Card Container */}
                      <div
                        className={`relative transition-all ${isMyTurn ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}
                        style={{ pointerEvents: isMyTurn ? 'auto' : 'none' }}
                        onMouseEnter={() => setHoveredMarketCard(stack)}
                        onMouseLeave={() => setHoveredMarketCard(null)}
                        onClick={(e) => {
                          if (!isMyTurn) return;
                          console.log('[Board] Market card clicked! Attempting to buy card:', index, 'Stack:', stack);
                          console.log('[Board] isAffordable:', isAffordable, 'availableEnergy:', availableEnergy, 'stack.cost:', stack.cost);
                          e.preventDefault();
                          e.stopPropagation();
                          handleBuyCard(index);
                        }}
                      >
                        {renderCard(
                          topCard,
                          'small',
                          null, // onClick handled by parent div
                          false
                        )}
                        {/* Stack count indicator */}
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none z-20">
                          {stack.cards.length}
                        </div>
                        {/* Cost indicator */}
                        <div className={`absolute bottom-0 left-0 right-0 text-white text-xs text-center py-1 rounded-b-lg pointer-events-none ${
                          isAffordable 
                            ? 'bg-green-600 bg-opacity-90 font-bold border-2 border-green-400' 
                            : 'bg-black bg-opacity-70'
                        }`}>
                          {stack.cost} Energy
                          {!isAffordable && (
                            <div className="text-[10px] text-red-300 mt-0.5">Can't Afford</div>
                          )}
                        </div>
                        {/* Affordability overlay */}
                        {!isAffordable && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-60 rounded-lg pointer-events-none flex items-center justify-center z-10">
                            <div className="text-red-400 text-xs font-bold bg-black bg-opacity-80 px-2 py-1 rounded">
                              Need {stack.cost - availableEnergy} More
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Card Information within container */}
                      {topCard && topCard.type === CARD_TYPES.ALLY && (
                        <div className="bg-gray-900 bg-opacity-50 rounded-lg p-2 space-y-1.5 text-xs">
                          {/* Subtype and Shield Indicator */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {topCard.subtype && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                topCard.subtype === ALLY_SUBTYPES.EFFICIENT 
                                  ? 'bg-green-600 text-white'
                                  : topCard.subtype === ALLY_SUBTYPES.POWERFUL
                                  ? 'bg-orange-600 text-white'
                                  : topCard.subtype === ALLY_SUBTYPES.ATTACK
                                  ? 'bg-red-600 text-white'
                                  : topCard.subtype === ALLY_SUBTYPES.SHIELD
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-600 text-white'
                              }`}>
                                {topCard.subtype === ALLY_SUBTYPES.EFFICIENT ? 'Efficient' :
                                 topCard.subtype === ALLY_SUBTYPES.POWERFUL ? 'Powerful' :
                                 topCard.subtype === ALLY_SUBTYPES.ATTACK ? 'Attack' :
                                 topCard.subtype === ALLY_SUBTYPES.SHIELD ? 'Shield' :
                                 topCard.subtype}
                              </span>
                            )}
                            {topCard.isShield && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-semibold">
                                🛡️ Shield
                              </span>
                            )}
                          </div>
                          
                          {/* Stats Row */}
                          <div className="flex items-center gap-2 text-white">
                            {topCard.victoryPoints !== undefined && topCard.victoryPoints !== 0 && (
                              <span className="flex items-center gap-1">
                                <span className="text-yellow-400 font-bold text-[10px]">VP:</span>
                                <span className="font-semibold text-[10px]">{topCard.victoryPoints}</span>
                              </span>
                            )}
                            {topCard.energyGenerated !== undefined && topCard.energyGenerated > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="text-blue-400 font-bold text-[10px]">⚡:</span>
                                <span className="font-semibold text-[10px]">+{topCard.energyGenerated}</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Ability Text */}
                          {(topCard.ability || topCard.effectText) && (
                            <div className="text-gray-300 leading-tight pt-1 border-t border-gray-700">
                              <div className="font-semibold text-gray-400 mb-0.5 text-[10px]">Ability:</div>
                              <div className="text-[9px]">{topCard.ability || topCard.effectText}</div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Fusion Fragment Info */}
                      {topCard && topCard.type === CARD_TYPES.RESOURCE && topCard.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT && (
                        <div className="bg-gray-900 bg-opacity-50 rounded-lg p-2 space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-white">
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-400 font-bold text-[10px]">VP:</span>
                              <span className="font-semibold text-[10px]">{topCard.victoryPoints || 2}</span>
                            </span>
                          </div>
                          <div className="text-gray-300 text-[9px] italic">
                            Victory points counted at game end
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-36 rounded-lg bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center">
                      <span className="text-gray-500 text-xs text-center">Empty</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Card Hover Detail */}
        {hoveredMarketCard && hoveredMarketCard.cards.length > 0 && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            {renderCard(hoveredMarketCard.cards[hoveredMarketCard.cards.length - 1], 'normal', null, false, false)}
          </div>
        )}

        {/* Main Game Area */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left: Active Shield and Relic Stacks */}
          <div className="space-y-4">
            {/* Active Shield Slot */}
            <div className="bg-black bg-opacity-20 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-2">Active Shield</h3>
              <div className="min-h-[120px] bg-gray-900 bg-opacity-50 rounded-lg p-4 flex items-center justify-center">
                {activeShield ? (
                  <div className="text-center">
                    {renderCard(
                      activeShield.card,
                      'normal',
                      null,
                      true,
                      false,
                      activeShield.faceDown // Show card back if face-down
                    )}
                    {activeShield.faceDown && (
                      <div className="mt-2 text-xs text-yellow-300 font-semibold">
                        Charging (Face-Down)
                      </div>
                    )}
                    {!activeShield.faceDown && (
                      <div className="mt-2 text-xs text-green-300 font-semibold">
                        Active (Face-Up)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm text-center">
                    No active shield
                  </div>
                )}
              </div>
            </div>

            {/* Relic Stacks - Similar to Market UI */}
            <div className="bg-black bg-opacity-20 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">Relic Stacks (2 Stacks)</h3>
                {G.currentPhase === 'acquisition' && (
                  <div className="bg-amber-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    Acquisition Phase - Acquire relics with 8 Energy
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {relicStacks.map((stack) => {
                  const relicCost = 8;
                  const canAffordRelic = availableEnergy >= relicCost;
                  const isEmpty = !stack.cards || stack.cards.length === 0;
                  const isAcquisitionPhase = G.currentPhase === 'acquisition';
                  const revealedCard = stack.revealedCard;
                  
                  return (
                    <div key={stack.stackId} className="bg-black bg-opacity-20 rounded-lg p-3">
                      {!isEmpty ? (
                        <div className="flex flex-col gap-2">
                          {/* Card Container */}
                          <div
                            className={`relative transition-all ${isAcquisitionPhase && canAffordRelic && isMyTurn ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}
                            style={{ pointerEvents: isAcquisitionPhase && canAffordRelic && isMyTurn ? 'auto' : 'none' }}
                            onMouseEnter={() => setHoveredCard(revealedCard)}
                            onMouseLeave={() => setHoveredCard(null)}
                            onClick={(e) => {
                              if (!isMyTurn || !isAcquisitionPhase || !canAffordRelic) return;
                              e.preventDefault();
                              e.stopPropagation();
                              handleAcquireRelic(stack.stackId);
                            }}
                          >
                            {/* Horizontal Relic Card */}
                            <HorizontalRelicCardTemplate 
                              card={revealedCard} 
                              size="normal"
                              onClick={null}
                              showDetails={false}
                              isSelected={false}
                              isActive={false}
                            />
                            
                            {/* Stack count indicator */}
                            {stack.cards.length > 1 && (
                              <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none z-20">
                                {stack.cards.length}
                              </div>
                            )}
                            
                            {/* Cost indicator */}
                            <div className={`absolute bottom-0 left-0 right-0 text-white text-xs text-center py-1 rounded-b-lg pointer-events-none ${
                              canAffordRelic 
                                ? 'bg-green-600 bg-opacity-90 font-bold border-2 border-green-400' 
                                : 'bg-black bg-opacity-70'
                            }`}>
                              {relicCost} Energy
                              {!canAffordRelic && (
                                <div className="text-[10px] text-red-300 mt-0.5">Can't Afford</div>
                              )}
                            </div>
                            
                            {/* Affordability overlay */}
                            {isAcquisitionPhase && !canAffordRelic && (
                              <div className="absolute inset-0 bg-gray-900 bg-opacity-60 rounded-lg pointer-events-none flex items-center justify-center z-10">
                                <div className="text-red-400 text-xs font-bold bg-black bg-opacity-80 px-2 py-1 rounded">
                                  Need {relicCost - availableEnergy} More
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Relic Information - Similar to Market card info */}
                          {revealedCard && (
                            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-2 space-y-1.5 text-xs">
                              {/* Stats Row */}
                              <div className="flex items-center gap-2 text-white">
                                <span className="flex items-center gap-1">
                                  <span className="text-yellow-400 font-bold text-[10px]">VP:</span>
                                  <span className="font-semibold text-[10px]">5</span>
                                </span>
                                {revealedCard.energyGenerated !== undefined && revealedCard.energyGenerated > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span className="text-blue-400 font-bold text-[10px]">⚡:</span>
                                    <span className="font-semibold text-[10px]">+{revealedCard.energyGenerated}</span>
                                  </span>
                                )}
                              </div>
                              
                              {/* Ability Text */}
                              {revealedCard.ability && (
                                <div className="text-gray-300 leading-tight pt-1 border-t border-gray-700">
                                  <div className="font-semibold text-gray-400 mb-0.5 text-[10px]">Ability:</div>
                                  <div className="text-[9px]">{revealedCard.ability}</div>
                                </div>
                              )}
                              
                              {/* Cost Info */}
                              <div className="text-amber-300 text-[9px] italic pt-1 border-t border-gray-700">
                                Cost: 8 Energy • All relics: 5 VP, Dust 1 card at turn start
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-lg bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">Empty Stack</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Expanded Play Area */}
          <div className="bg-black bg-opacity-20 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-2">Play Area</h3>
            <div className="min-h-[400px] bg-gray-900 bg-opacity-50 rounded-lg p-4">
              {playArea.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm text-center">
                    Cards played from your hand will appear here
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center">
                  {playArea.map((card) => (
                    <div key={card.id}>
                      {renderCard(card, 'normal', null, true, false)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The Dust - Moved below Play Area */}
        <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-bold text-white mb-2">The Dust</h3>
          <div className="min-h-[200px] bg-gray-900 bg-opacity-50 rounded-lg p-2 flex flex-wrap gap-2">
            {dust.length === 0 ? (
              <div className="text-gray-400 text-sm w-full text-center py-8">Empty</div>
            ) : (
              dust.slice(-10).map((card) => (
                <div key={card.id}>
                  {renderCard(card, 'small', null, false)}
                </div>
              ))
            )}
          </div>
          {dust.length > 10 && (
            <div className="text-xs text-gray-400 mt-2 text-center">
              +{dust.length - 10} more cards
            </div>
          )}
        </div>

        {/* Relic Zone - Player's Relics */}
        <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">Relic Zone</h2>
            {ctx.phase === 'relic' && relics.length > 0 && (
              <div className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Relic Phase - Your relics are active
              </div>
            )}
          </div>
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-2">
              Relics ({relics.length})
            </h3>
            <div className="min-h-[150px] flex flex-wrap gap-3 justify-center items-start">
              {relics.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8 w-full">
                  No relics acquired yet. Purchase relics from the Relic Stacks during the Acquisition Phase.
                </div>
              ) : (
                relics.map((relic) => (
                  <div key={relic.id}>
                    {renderCard(relic, 'normal', null, true, false)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Hand Display */}
        <div className="bg-black bg-opacity-20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Your Hand</h2>
              {/* Play All Energy Coins Button */}
              {(() => {
                const energyCoinsCount = hand.filter(card => 
                  card.type === CARD_TYPES.RESOURCE && 
                  card.resourceType === RESOURCE_TYPES.ENERGY_CELL
                ).length;
                const currentPhase = G.currentPhase || ctx.phase;
                const isValidPhase = currentPhase === 'ally' || currentPhase === 'energy' || currentPhase === 'relic' || currentPhase === 'shield';
                
                if (energyCoinsCount > 0 && isValidPhase && moves.PlayAllEnergyCoins) {
                  return (
                    <button
                      onClick={() => {
                        console.log('[Board] PlayAllEnergyCoins clicked');
                        moves.PlayAllEnergyCoins();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95 text-sm"
                    >
                      Play All Energy Coins ({energyCoinsCount})
                    </button>
                  );
                }
                return null;
              })()}
            </div>
            {dustMode && (
              <div className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Select a card to Dust
              </div>
            )}
          </div>
          {hand.length === 0 ? (
            <div className="text-gray-300 text-center py-8">
              Your hand is empty. Draw a card to get started!
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 justify-center">
                {hand.map((card) => (
                  <div key={card.id} className={`relative ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {renderCard(
                      card,
                      'normal',
                      isMyTurn ? (dustMode ? () => handleDustCard(card) : () => handleCardClick(card)) : null,
                      true,
                      false // No selection state
                    )}
                    {dustMode && (
                      <>
                        <div className="absolute -bottom-6 left-0 right-0 text-xs text-orange-300 text-center font-semibold">
                          Click to Dust
                        </div>
                        <div className="absolute top-2 left-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded border-2 border-white">
                          DUST
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Card Hover Detail */}
        {hoveredCard && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            {renderCard(hoveredCard, 'normal', null, false, false)}
          </div>
        )}

        {/* Deck View Modal */}
        {viewingDeck && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Your Deck ({currentPlayer.deck?.length || 0} cards)</h2>
                <button
                  onClick={() => setViewingDeck(false)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {currentPlayer.deck && currentPlayer.deck.length > 0 ? (
                  currentPlayer.deck.map((card) => (
                    <div key={card.id} onMouseEnter={() => setHoveredCard(card)} onMouseLeave={() => setHoveredCard(null)}>
                      {renderCard(card, 'small', null, false, false, true)} {/* faceDown: true - cards in deck are face-down */}
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center text-gray-400 py-8">Deck is empty</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Discard Pile View Modal */}
        {viewingDiscard && viewingPlayerDiscard !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {viewingPlayerDiscard === currentPlayerId ? 'Your' : `Player ${parseInt(viewingPlayerDiscard) + 1}'s`} Discard Pile ({G.players[viewingPlayerDiscard]?.discard?.length || 0} cards)
                </h2>
                <button
                  onClick={() => {
                    setViewingDiscard(false);
                    setViewingPlayerDiscard(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {G.players[viewingPlayerDiscard]?.discard && G.players[viewingPlayerDiscard].discard.length > 0 ? (
                  G.players[viewingPlayerDiscard].discard.map((card) => (
                    <div key={card.id} onMouseEnter={() => setHoveredCard(card)} onMouseLeave={() => setHoveredCard(null)}>
                      {renderCard(card, 'small', null, false, false)}
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center text-gray-400 py-8">Discard pile is empty</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Players' Discard Piles Section */}
        <div className="mt-6 bg-black bg-opacity-20 rounded-lg p-4">
          <h2 className="text-xl font-bold text-white mb-3">All Players' Discard Piles</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(G.players || {}).map((playerId) => {
              const player = G.players[playerId];
              const isCurrentPlayer = playerId === currentPlayerId;
              return (
                <div key={playerId} className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {isCurrentPlayer ? 'You' : `Player ${parseInt(playerId) + 1}`}
                    </h3>
                    <span className="text-sm text-gray-300">
                      {player.discard?.length || 0} cards
                    </span>
                  </div>
                  {player.discard && player.discard.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {player.discard.slice(-5).map((card) => (
                        <div
                          key={card.id}
                          onMouseEnter={() => setHoveredCard(card)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className="cursor-pointer"
                        >
                          {renderCard(card, 'small', null, false, false)}
                        </div>
                      ))}
                      {player.discard.length > 5 && (
                        <div className="flex items-center justify-center w-20 h-28 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500">
                          <span className="text-xs text-gray-400 text-center">
                            +{player.discard.length - 5} more
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-4">Empty</div>
                  )}
                  {player.discard && player.discard.length > 0 && (
                    <button
                      onClick={() => {
                        setViewingDiscard(true);
                        setViewingPlayerDiscard(playerId);
                      }}
                      className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1 rounded"
                    >
                      View All ({player.discard.length} cards)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shield Play Prompt Modal */}
      {shieldPromptCard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md border-4 border-blue-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Play as Shield?
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{shieldPromptCard.name}</div>
                <div className="text-sm text-gray-300">
                  This card can be played as a Shield (face-down) or as a regular Ally.
                </div>
                {currentPlayer.activeShield && (
                  <div className="text-sm text-yellow-300 mt-2 font-semibold">
                    ⚠️ You have an active shield ({currentPlayer.activeShield.card.name}). 
                    Playing as Shield will replace it.
                  </div>
                )}
              </div>
              {shieldPromptCard.ability && (
                <div className="text-xs text-gray-400 text-center mb-4 italic">
                  "{shieldPromptCard.ability}"
                </div>
              )}
              <div className="text-sm text-white text-center space-y-2">
                <div>
                  <span className="font-semibold text-blue-300">As Shield:</span> Face-down, activates next turn, provides {shieldPromptCard.energyGenerated || 0} energy when flipped
                  {currentPlayer.activeShield && (
                    <span className="text-yellow-300"> (replaces current shield)</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-green-300">As Regular Ally:</span> Face-up, provides {shieldPromptCard.energyGenerated || 0} energy immediately
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  // Check if this is a Powerful Shield and player doesn't have an Ally Action
                  if (shieldPromptCard.subtype === ALLY_SUBTYPES.POWERFUL && 
                      currentPlayer.allyActionsAvailable <= 0) {
                    const hasNonEfficientAllies = currentPlayer.playArea.some(c => 
                      c.type === CARD_TYPES.ALLY && c.subtype !== ALLY_SUBTYPES.EFFICIENT
                    );
                    const hasChargingShield = currentPlayer.activeShield && currentPlayer.activeShield.faceDown;
                    
                    if (hasNonEfficientAllies || hasChargingShield) {
                      setErrorMessage('Cannot play Powerful Shield: You have already used your Ally Action this turn. You can play any number of Efficient Allies, but only one Powerful Ally or Shield per turn.');
                      setTimeout(() => setErrorMessage(null), 5000);
                      setShieldPromptCard(null);
                      return;
                    }
                  }
                  handlePlayCard(shieldPromptCard.id, true);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                Yes, Play as Shield
              </button>
              <button
                onClick={() => {
                  // Check if this is a Powerful Ally and player doesn't have an Ally Action
                  if (shieldPromptCard.subtype === ALLY_SUBTYPES.POWERFUL && 
                      currentPlayer.allyActionsAvailable <= 0 &&
                      !currentPlayer.nextPowerfulIsEfficient) {
                    const hasNonEfficientAllies = currentPlayer.playArea.some(c => 
                      c.type === CARD_TYPES.ALLY && c.subtype !== ALLY_SUBTYPES.EFFICIENT
                    );
                    const hasChargingShield = currentPlayer.activeShield && currentPlayer.activeShield.faceDown;
                    
                    if (hasNonEfficientAllies || hasChargingShield) {
                      setErrorMessage('Cannot play Powerful Ally: You have already used your Ally Action this turn. You can play any number of Efficient Allies, but only one Powerful Ally per turn.');
                      setTimeout(() => setErrorMessage(null), 5000);
                      setShieldPromptCard(null);
                      return;
                    }
                  }
                  handlePlayCard(shieldPromptCard.id, false);
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                No, Play Normally
              </button>
              <button
                onClick={() => setShieldPromptCard(null)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dust Card Confirmation Modal */}
      {dustPromptCard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md border-4 border-orange-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Dust Card?
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">Dust {dustPromptCard.name}</div>
                <div className="text-sm text-gray-300">
                  This card will be moved from your hand to The Dust zone.
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleConfirmDust}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                Yes
              </button>
              <button
                onClick={handleCancelDustPrompt}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Attack - Block or Take Attack Modal */}
      {/* Only show if target has an active shield (face-up) - attacker's shield doesn't matter */}
      {/* Normalize to string for comparison (boardgame.io uses string IDs) */}
      {G.pendingAttack && 
       String(G.pendingAttack.targetId) === String(playerID) && 
       currentPlayer.activeShield && 
       !currentPlayer.activeShield.faceDown && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl border-4 border-red-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Attack Incoming!
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2 text-red-400">
                  {G.pendingAttack.card.name}
                </div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingAttack.card.ability}
                </div>
                <div className="text-sm text-yellow-300 font-semibold mb-4">
                  {G.pendingAttack.satelliteBlock 
                    ? 'You can block with The Satellite. Choose to block the attack or take it:'
                    : currentPlayer.activeShield && !currentPlayer.activeShield.faceDown
                    ? 'You have an active shield. Choose to block the attack or take it:'
                    : 'Choose to block the attack or take it:'}
                </div>
              </div>
              
              {/* Show active shield if available */}
              {currentPlayer.activeShield && !currentPlayer.activeShield.faceDown && (
                <div className="mb-4 flex flex-col items-center">
                  <div className="text-white text-sm font-semibold mb-2">
                    Your Active Shield:
                  </div>
                  <div className="transform transition">
                    {renderCard(currentPlayer.activeShield.card, 'normal', null, true, false)}
                  </div>
                </div>
              )}
              
              {/* Show The Satellite if it can block */}
              {G.pendingAttack.satelliteBlock && (
                <div className="mb-4 flex flex-col items-center">
                  <div className="text-white text-sm font-semibold mb-2">
                    The Satellite can block this attack:
                  </div>
                  {relics.find(r => r.name === 'The Satellite') && (
                    <div className="transform transition">
                      {renderCard(relics.find(r => r.name === 'The Satellite'), 'normal', null, true, false)}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-4 justify-center mt-6">
                {(currentPlayer.activeShield && !currentPlayer.activeShield.faceDown) && (
                  <button
                    onClick={() => {
                      console.log('[Board] Blocking attack with shield');
                      if (moves.BlockWithShield) {
                        moves.BlockWithShield();
                      }
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                  >
                    Block with Shield
                  </button>
                )}
                {G.pendingAttack.satelliteBlock && (
                  <button
                    onClick={() => {
                      console.log('[Board] Blocking attack with The Satellite');
                      if (moves.BlockWithShield) {
                        moves.BlockWithShield();
                      }
                    }}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                  >
                    Block with The Satellite
                  </button>
                )}
                <button
                  onClick={() => {
                    console.log('[Board] Taking attack (not blocking)');
                    if (moves.ResolveAttack) {
                      moves.ResolveAttack();
                    }
                  }}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                >
                  Take Attack
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fuseforge Blacksmith - Discard Fusion Fragment Choice Modal */}
      {G.pendingChoice && 
       G.pendingChoice.playerId === playerID && 
       G.pendingChoice.choiceType === 'discard_fusion_fragment' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl border-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Fuseforge Blacksmith Ability
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-yellow-300 font-semibold mb-4">
                  Discard a Fusion Fragment to gain +2 Energy?
                </div>
              </div>
              
              {/* Show Fusion Fragments in hand */}
              {hand.filter(card => 
                card.type === CARD_TYPES.RESOURCE && 
                card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT
              ).length > 0 ? (
                <div className="mb-4">
                  <div className="text-white text-sm font-semibold mb-2 text-center">
                    Select a Fusion Fragment to discard:
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {hand.filter(card => 
                      card.type === CARD_TYPES.RESOURCE && 
                      card.resourceType === RESOURCE_TYPES.FUSION_FRAGMENT
                    ).map((card) => (
                      <div
                        key={card.id}
                        onClick={() => {
                          if (moves.DiscardFusionFragmentForEnergy) {
                            moves.DiscardFusionFragmentForEnergy(card.id);
                          }
                        }}
                        className="cursor-pointer transform transition hover:scale-110 active:scale-95"
                      >
                        {renderCard(card, 'normal', null, true, false)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center mb-4">
                  No Fusion Fragments in hand
                </div>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  if (moves.SkipFusionFragmentDiscard) {
                    moves.SkipFusionFragmentDiscard();
                  }
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                Skip (No Effect)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warhino General - Attack Choice Modal (when played as regular Ally) */}
      {G.pendingChoice && 
       String(G.pendingChoice.playerId) === String(playerID) && 
       G.pendingChoice.choiceType === 'warhino_general_attack' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl border-4 border-red-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Warhino General Ability
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-red-300 font-semibold mb-4">
                  Choose one:
                </div>
              </div>
              
              {/* Show opponent info */}
              {G.pendingChoice.targetId && G.players[G.pendingChoice.targetId] && (
                <div className="mb-4 text-center">
                  <div className="text-white text-sm mb-2">
                    Opponent has {G.players[G.pendingChoice.targetId].hand.length} card(s) in hand
                  </div>
                  <div className="text-white text-sm mb-2">
                    The Dust has {G.dust.length} card(s)
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  if (moves.WarhinoGeneralDustOpponent) {
                    moves.WarhinoGeneralDustOpponent();
                  }
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                Dust Opponent Card
              </button>
              <button
                onClick={() => {
                  if (moves.WarhinoGeneralRetrieve) {
                    moves.WarhinoGeneralRetrieve();
                  }
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                Retrieve 1 from Dust
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warhino General - Shield Choice Modal (when shield is active) */}
      {G.pendingChoice && 
       G.pendingChoice.playerId === playerID && 
       G.pendingChoice.choiceType === 'warhino_general_shield' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl border-4 border-indigo-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Warhino General (Shield) Ability
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-indigo-300 font-semibold mb-4">
                  Your active shield triggers this ability. Choose one:
                </div>
              </div>
              
              {/* Show opponent info */}
              {G.pendingChoice.targetId && G.players[G.pendingChoice.targetId] && (
                <div className="mb-4 text-center">
                  <div className="text-white text-sm mb-2">
                    Opponent has {G.players[G.pendingChoice.targetId].hand.length} card(s) in hand
                  </div>
                  <div className="text-white text-sm mb-2">
                    The Dust has {G.dust.length} card(s)
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  if (moves.WarhinoGeneralDustOpponent) {
                    moves.WarhinoGeneralDustOpponent();
                  }
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                Dust Opponent Card
              </button>
              <button
                onClick={() => {
                  if (moves.WarhinoGeneralRetrieve) {
                    moves.WarhinoGeneralRetrieve();
                  }
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                Retrieve 1 from Dust
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warhino General - Select Card to Dust Modal (for the opponent being forced to dust) */}
      {G.pendingChoice && 
       String(G.pendingChoice.playerId) === String(playerID) && 
       (G.pendingChoice.choiceType === 'warhino_general_select_card_attack' || 
        G.pendingChoice.choiceType === 'warhino_general_select_card_shield') && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl border-4 border-red-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Warhino General - Select Card to Dust
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-red-300 font-semibold mb-4">
                  {selectedCardToDust ? 'Confirm your choice:' : 'You must select a card from your hand to dust:'}
                </div>
              </div>
              
              {/* Show selected card confirmation or card selection */}
              {selectedCardToDust ? (
                <div className="mb-4">
                  <div className="text-white text-center mb-4">
                    <div className="text-lg font-semibold mb-4">You selected:</div>
                    <div className="flex justify-center mb-4">
                      {renderCard(selectedCardToDust, 'normal', null, true, false)}
                    </div>
                    <div className="text-sm text-yellow-300 mb-4">
                      This card will be sent to The Dust. Confirm your choice?
                    </div>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        console.log('[Board] Confirming card selection for dusting:', selectedCardToDust.name, 'cardId:', selectedCardToDust.id);
                        console.log('[Board] moves.WarhinoGeneralSelectCard exists:', !!moves.WarhinoGeneralSelectCard);
                        console.log('[Board] Available moves:', Object.keys(moves || {}));
        console.log('[Board] Current player (ctx.currentPlayer):', ctx.currentPlayer);
        console.log('[Board] This player (playerID):', playerID);
        console.log('[Board] Active players (ctx.activePlayers):', ctx.activePlayers);
        console.log('[Board] Pending choice:', G.pendingChoice);
        console.log('[Board] Pending choice playerId:', G.pendingChoice?.playerId);
                        if (moves.WarhinoGeneralSelectCard) {
                          try {
                            const result = moves.WarhinoGeneralSelectCard(selectedCardToDust.id);
                            console.log('[Board] WarhinoGeneralSelectCard move called, result:', result);
                            // Only clear local state if move succeeded (pendingChoice will be cleared by the move)
                            // The modal will close when G.pendingChoice is null
                          } catch (error) {
                            console.error('[Board] Error calling WarhinoGeneralSelectCard:', error);
                          }
                        } else {
                          console.error('[Board] WarhinoGeneralSelectCard move not available! Server may need restart.');
                        }
                      }}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                    >
                      Confirm - Dust This Card
                    </button>
                    <button
                      onClick={() => setSelectedCardToDust(null)}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                    >
                      Cancel - Choose Different Card
                    </button>
                  </div>
                </div>
              ) : (
                /* Show cards in hand for selection */
                G.players[playerID] && G.players[playerID].hand && G.players[playerID].hand.length > 0 ? (
                  <div className="mb-4">
                    <div className="text-white text-sm font-semibold mb-3 text-center">
                      Cards in your hand ({G.players[playerID].hand.length}):
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center max-h-96 overflow-y-auto p-4 bg-gray-800 rounded-lg">
                      {G.players[playerID].hand.map((card) => {
                        const handleCardClick = (e) => {
                          if (e) {
                            e.stopPropagation();
                            e.preventDefault();
                          }
                          console.log('[Board] Card clicked in Warhino General selection:', card.name, 'cardId:', card.id);
                          setSelectedCardToDust(card);
                        };
                        return (
                          <div
                            key={card.id}
                            onClick={handleCardClick}
                            className="cursor-pointer transform transition hover:scale-110 active:scale-95"
                          >
                            {renderCard(card, 'normal', handleCardClick, true, false)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-white text-center">You have no cards in hand to dust.</div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warhino General - Select Opponent Modal (3+ players, after choosing Dust Opponent Card) */}
      {G.pendingChoice && 
       String(G.pendingChoice.playerId) === String(playerID) && 
       (G.pendingChoice.choiceType === 'warhino_general_select_opponent_attack' || 
        G.pendingChoice.choiceType === 'warhino_general_select_opponent_shield') && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl border-4 border-red-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Warhino General - Select Opponent
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-red-300 font-semibold mb-4">
                  Select an opponent to force to dust a card:
                </div>
              </div>
              
              {/* Show opponent buttons */}
              {G.pendingChoice.opponentIds && G.pendingChoice.opponentIds.length > 0 ? (
                <div className="flex flex-wrap gap-4 justify-center">
                  {G.pendingChoice.opponentIds.map((opponentId) => {
                    const opponent = G.players[opponentId];
                    if (!opponent) return null;
                    const hasShield = opponent.activeShield && !opponent.activeShield.faceDown;
                    return (
                      <button
                        key={opponentId}
                        onClick={() => {
                          if (moves.WarhinoGeneralSelectOpponent) {
                            moves.WarhinoGeneralSelectOpponent(opponentId);
                          }
                        }}
                        className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95 border-2 border-red-400"
                      >
                        <div className="text-lg">Player {parseInt(opponentId) + 1}</div>
                        <div className="text-sm font-normal mt-1">
                          {opponent.hand.length} card(s) in hand
                        </div>
                        {hasShield && (
                          <div className="text-xs font-normal mt-1 text-yellow-300">
                            Has active shield
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-white text-center">No opponents available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Machboot Chaser - Select Opponent Modal (3+ players) */}
      {G.pendingChoice && 
       G.pendingChoice.playerId === playerID && 
       G.pendingChoice.choiceType === 'machboot_chaser_select_opponent' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl border-4 border-orange-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Machboot Chaser - Select Opponent
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-orange-300 font-semibold mb-4">
                  Select a player to attack:
                </div>
              </div>
              
              {/* Show opponent buttons */}
              {G.pendingChoice.opponentIds && G.pendingChoice.opponentIds.length > 0 ? (
                <div className="flex flex-wrap gap-4 justify-center">
                  {G.pendingChoice.opponentIds.map((opponentId) => {
                    const opponent = G.players[opponentId];
                    if (!opponent) return null;
                    const hasShield = opponent.activeShield && !opponent.activeShield.faceDown;
                    return (
                      <button
                        key={opponentId}
                        onClick={() => {
                          if (moves.MachbootChaserSelectOpponent) {
                            moves.MachbootChaserSelectOpponent(opponentId);
                          }
                        }}
                        className="px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95 border-2 border-orange-400"
                      >
                        <div className="text-lg">Player {parseInt(opponentId) + 1}</div>
                        <div className="text-sm font-normal mt-1">
                          {opponent.hand.length} card(s) in hand
                        </div>
                        {hasShield && (
                          <div className="text-xs font-normal mt-1 text-yellow-300">
                            Has active shield
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-white text-center">No opponents available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Machboot Chaser - Select Card to Discard Modal (for the target) */}
      {G.pendingChoice && 
       String(G.pendingChoice.playerId) === String(playerID) && 
       G.pendingChoice.choiceType === 'machboot_chaser_discard' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl border-4 border-orange-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Machboot Chaser - Select Card to Discard
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-orange-300 font-semibold mb-4">
                  You must select a card from your hand to discard:
                </div>
              </div>
              
              {/* Show cards in hand for selection */}
              {G.players[playerID] && G.players[playerID].hand && G.players[playerID].hand.length > 0 ? (
                <div className="mb-4">
                  <div className="text-white text-sm font-semibold mb-3 text-center">
                    Cards in your hand ({G.players[playerID].hand.length}):
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center max-h-96 overflow-y-auto p-4 bg-gray-800 rounded-lg">
                    {G.players[playerID].hand.map((card) => {
                      const handleCardClick = (e) => {
                        if (e) {
                          e.stopPropagation();
                          e.preventDefault();
                        }
                        console.log('[Board] Card clicked in Machboot Chaser discard selection:', card.name, 'cardId:', card.id);
                        if (moves.MachbootChaserSelectCard) {
                          moves.MachbootChaserSelectCard(card.id);
                        }
                      };
                      return (
                        <div
                          key={card.id}
                          onClick={handleCardClick}
                          className="cursor-pointer transform transition hover:scale-110 active:scale-95"
                        >
                          {renderCard(card, 'normal', handleCardClick, true, false)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-white text-center">You have no cards in hand to discard.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Machboot Chaser - Confirm Discard Modal */}
      {G.pendingChoice && 
       G.pendingChoice.playerId === playerID && 
       G.pendingChoice.choiceType === 'machboot_chaser_confirm_discard' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl border-4 border-orange-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Machboot Chaser - Confirm Discard
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-yellow-300 font-semibold mb-4">
                  Selected card (click to change or confirm below):
                </div>
              </div>
              
              {/* Show all cards with selected one highlighted */}
              {G.players[playerID] && G.players[playerID].hand && G.players[playerID].hand.length > 0 ? (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-3 justify-center max-h-96 overflow-y-auto p-4 bg-gray-800 rounded-lg">
                    {G.players[playerID].hand.map((card) => {
                      const isSelected = card.id === G.pendingChoice.selectedCardId;
                      const handleCardClick = (e) => {
                        if (e) {
                          e.stopPropagation();
                          e.preventDefault();
                        }
                        if (isSelected) {
                          // Already selected - do nothing (or could allow re-selecting)
                          return;
                        } else {
                          // Change selection
                          console.log('[Board] Changing selection to:', card.name, 'cardId:', card.id);
                          if (moves.MachbootChaserSelectCard) {
                            moves.MachbootChaserSelectCard(card.id);
                          }
                        }
                      };
                      return (
                        <div
                          key={card.id}
                          onClick={handleCardClick}
                          className={`cursor-pointer transform transition ${isSelected ? 'scale-110 ring-4 ring-yellow-400' : 'hover:scale-105'} active:scale-95`}
                        >
                          {renderCard(card, 'normal', handleCardClick, true, false)}
                        </div>
                      );
                    })}
                  </div>
                  {G.pendingChoice.selectedCardId && (
                    <div className="text-center mt-4">
                      <div className="text-white text-lg font-semibold mb-2">
                        Selected: {G.players[playerID].hand.find(c => c.id === G.pendingChoice.selectedCardId)?.name}
                      </div>
                      <button
                        onClick={() => {
                          if (moves.MachbootChaserConfirmDiscard) {
                            moves.MachbootChaserConfirmDiscard();
                          }
                        }}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                      >
                        Confirm - Discard This Card
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-white text-center">You have no cards in hand to discard.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warhino General - Select Card from Dust Modal (after choosing Retrieve) */}
      {(() => {
        const hasPendingChoice = !!G.pendingChoice;
        const playerIdMatch = G.pendingChoice && String(G.pendingChoice.playerId) === String(playerID);
        const isRetrieveChoice = G.pendingChoice && 
          (G.pendingChoice.choiceType === 'warhino_general_select_retrieve_attack' || 
           G.pendingChoice.choiceType === 'warhino_general_select_retrieve_shield');
        const shouldShow = hasPendingChoice && playerIdMatch && isRetrieveChoice;
        
        if (G.pendingChoice) {
          console.log('[Board] Retrieve selection UI check:', {
            hasPendingChoice,
            pendingChoicePlayerId: G.pendingChoice.playerId,
            pendingChoicePlayerIdType: typeof G.pendingChoice.playerId,
            currentPlayerID: playerID,
            currentPlayerIDType: typeof playerID,
            playerIdMatch,
            choiceType: G.pendingChoice.choiceType,
            isRetrieveChoice,
            shouldShow,
            dustLength: G.dust?.length || 0
          });
        }
        return shouldShow;
      })() && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl border-4 border-blue-500">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Warhino General - Select Card to Retrieve
            </h2>
            <div className="mb-4">
              <div className="text-white text-center mb-4">
                <div className="text-lg font-semibold mb-2">{G.pendingChoice.card.name}</div>
                <div className="text-sm text-gray-300 mb-4">
                  {G.pendingChoice.message}
                </div>
                <div className="text-sm text-blue-300 font-semibold mb-4">
                  Click a card from The Dust to retrieve it:
                </div>
              </div>
              
              {/* Show cards in The Dust */}
              {(() => {
                const nonRelicCards = G.dust ? G.dust.filter(card => card.type !== CARD_TYPES.RELIC) : [];
                console.log('[Board] Retrieve modal - Dust cards:', {
                  totalDust: G.dust?.length || 0,
                  nonRelicCards: nonRelicCards.length,
                  cards: nonRelicCards.map(c => ({ id: c.id, name: c.name, type: c.type }))
                });
                return G.dust && G.dust.length > 0;
              })() ? (
                <div className="mb-4">
                  <div className="text-white text-sm font-semibold mb-3 text-center">
                    Cards in The Dust ({G.dust.length}):
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center max-h-96 overflow-y-auto p-4 bg-gray-800 rounded-lg">
                    {G.dust
                      .filter(card => {
                        const isRetrievable = card.type !== CARD_TYPES.RELIC;
                        if (!isRetrievable) {
                          console.log('[Board] Filtering out relic from retrieve selection:', card.name);
                        }
                        return isRetrievable;
                      })
                      .map((card) => {
                        console.log('[Board] Rendering card in retrieve selection:', card.name, 'cardId:', card.id);
                        const handleCardRetrieveClick = () => {
                          console.log('[Board] Card clicked in Warhino General retrieve selection:', card.name, 'cardId:', card.id);
                          console.log('[Board] moves.WarhinoGeneralSelectRetrieve exists:', !!moves.WarhinoGeneralSelectRetrieve);
                          console.log('[Board] Available moves:', Object.keys(moves));
                          if (moves.WarhinoGeneralSelectRetrieve) {
                            console.log('[Board] Calling WarhinoGeneralSelectRetrieve with cardId:', card.id);
                            try {
                              moves.WarhinoGeneralSelectRetrieve(card.id);
                              console.log('[Board] WarhinoGeneralSelectRetrieve move called successfully');
                            } catch (error) {
                              console.error('[Board] Error calling WarhinoGeneralSelectRetrieve:', error);
                            }
                          } else {
                            console.error('[Board] WarhinoGeneralSelectRetrieve move not available!');
                          }
                        };
                        return (
                        <div
                          key={card.id}
                          className="cursor-pointer transform transition hover:scale-110 active:scale-95"
                        >
                          {renderCard(card, 'normal', handleCardRetrieveClick, true, false)}
                        </div>
                        );
                      })}
                  </div>
                  {G.dust.filter(card => card.type === CARD_TYPES.RELIC).length > 0 && (
                    <div className="text-xs text-gray-400 text-center mt-2">
                      Note: Relics cannot be retrieved
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center mb-4">
                  The Dust is empty - no cards to retrieve
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game Log */}
      <div className="fixed bottom-24 right-4 z-40">
        {/* Toggle Button */}
        <button
          onClick={() => setShowGameLog(!showGameLog)}
          className="mb-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg border-2 border-gray-600 transform transition hover:scale-105 active:scale-95"
        >
          {showGameLog ? 'Hide Log' : 'Show Log'}
        </button>

        {/* Game Log Panel */}
        {showGameLog && (
          <div className="bg-gray-900 border-4 border-gray-700 rounded-lg shadow-2xl w-96 h-96 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 px-4 py-2 border-b-2 border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Game Log</h3>
              <button
                onClick={() => setShowGameLog(false)}
                className="text-gray-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Log Entries - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {gameLog.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No game events yet
                </div>
              ) : (
                gameLog.slice().reverse().map((entry, index) => {
                  const playerNumber = parseInt(entry.playerId) + 1;
                  const playerColor = entry.playerId === currentPlayerId ? 'text-yellow-400' : 'text-blue-400';
                  
                  return (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      className="bg-gray-800 rounded p-2 border-l-4 border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-xs font-semibold ${playerColor}`}>
                          Player {playerNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          Turn {entry.turn}
                        </span>
                      </div>
                      <div className="text-white text-sm font-semibold">
                        {entry.action}
                      </div>
                      {entry.details && (
                        <div className="text-gray-300 text-xs mt-1">
                          {entry.details}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      {/* Right Side Rail - Player Stats and Action Buttons */}
      <div className="fixed top-0 right-0 h-screen w-72 bg-gray-900 bg-opacity-95 border-l-4 border-gray-700 shadow-2xl z-50 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Player Stats */}
          <div className="bg-black bg-opacity-40 rounded-lg p-3">
            <h3 className="text-sm font-bold text-white mb-2">Player Stats</h3>
            <div className="space-y-1 text-xs text-white">
              <div className="flex justify-between">
                <span className="text-blue-300">Energy Pool:</span>
                <span className="font-bold text-green-300">{availableEnergy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Victory Points:</span>
                <span className="font-bold text-yellow-300">{myPlayer ? calculateVictoryPoints(myPlayer) : 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Deck:</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{(myPlayer?.deck && Array.isArray(myPlayer.deck)) ? myPlayer.deck.length : 0}</span>
                  {myPlayer?.deck && Array.isArray(myPlayer.deck) && myPlayer.deck.length > 0 && (
                    <button
                      onClick={() => setViewingDeck(!viewingDeck)}
                      className="text-[10px] bg-blue-600 hover:bg-blue-700 px-1.5 py-0.5 rounded text-white"
                    >
                      {viewingDeck ? 'Hide' : 'View'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Discard:</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{(myPlayer?.discard && Array.isArray(myPlayer.discard)) ? myPlayer.discard.length : 0}</span>
                  {myPlayer?.discard && Array.isArray(myPlayer.discard) && myPlayer.discard.length > 0 && (
                    <button
                      onClick={() => {
                        setViewingDiscard(!viewingDiscard);
                        setViewingPlayerDiscard(viewingDiscard ? null : playerID);
                      }}
                      className="text-[10px] bg-purple-600 hover:bg-purple-700 px-1.5 py-0.5 rounded text-white"
                    >
                      {viewingDiscard && viewingPlayerDiscard === playerID ? 'Hide' : 'View'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Relics:</span>
                <span className="font-semibold">{(myPlayer?.relics && Array.isArray(myPlayer.relics)) ? myPlayer.relics.length : 0}</span>
              </div>
            </div>
          </div>

          {/* Phase-specific actions */}
          <div className="flex flex-col gap-2">
            {ctx.phase === 'relic' && relics.length > 0 && (
              <button
                onClick={() => {
                  console.log('[Board] Skipping Relic Phase');
                  if (moves.SkipRelicPhase) {
                    moves.SkipRelicPhase();
                  }
                }}
                className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95 text-sm"
              >
                Skip Relic Phase → Shield Phase
              </button>
            )}
            {G.currentPhase === 'acquisition' && (
              <button
                onClick={() => {
                  console.log('[Board] Skipping Acquisition Phase');
                  if (moves.SkipAcquisitionPhase) {
                    moves.SkipAcquisitionPhase();
                  }
                }}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95 text-sm"
              >
                Done Buying → Discard Phase
              </button>
            )}
            {hasDustedThisTurn && (
              <div className="text-xs text-gray-400 text-center">
                Already dusted this turn
              </div>
            )}
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                console.log('[Board] Undo button clicked');
                console.log('[Board] moves.UndoMove exists:', !!moves.UndoMove);
                console.log('[Board] Available moves:', Object.keys(moves || {}));
                console.log('[Board] History length:', G.gameStateHistory?.length || 0);
                if (moves.UndoMove) {
                  try {
                    moves.UndoMove();
                    console.log('[Board] UndoMove called successfully');
                  } catch (error) {
                    console.error('[Board] Error calling UndoMove:', error);
                  }
                } else {
                  console.error('[Board] UndoMove not available in moves');
                }
              }}
              disabled={!moves.UndoMove || !G.gameStateHistory || G.gameStateHistory.length === 0}
              className={`w-full px-3 py-2 font-semibold rounded-lg shadow-lg transform transition text-sm ${
                moves.UndoMove && G.gameStateHistory && G.gameStateHistory.length > 0
                  ? 'bg-gray-700 hover:bg-gray-600 text-white hover:scale-105 active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Undo Last Move
            </button>
            <button
              onClick={() => moves.EndTurn()}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95 text-sm"
            >
              End Turn
            </button>
            <button
              onClick={() => dustMode ? handleCancelDustMode() : setDustMode(true)}
              disabled={!canDust}
              className={`w-full px-3 py-2 font-semibold rounded-lg shadow-lg transform transition text-sm ${
                canDust
                  ? dustMode
                    ? 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-105 active:scale-95'
                    : 'bg-gray-600 hover:bg-gray-700 text-white hover:scale-105 active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {dustMode ? 'Cancel Dust' : hasDustedThisTurn ? 'Already Dusted' : 'Dust Card'}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-red-600 border-4 border-red-400 rounded-lg shadow-2xl p-4 max-w-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-white font-bold text-lg">Cannot Play Card</h3>
                </div>
                <p className="text-white text-sm">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-white hover:text-red-200 text-xl font-bold ml-4"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
