# Running List of Known Bugs

This document tracks all known bugs in the Dust to Dust game.

---

## High Priority

_No high priority bugs currently tracked._

---

## Medium Priority

_No medium priority bugs currently tracked._

---

## Low Priority

_No low priority bugs currently tracked._

---

## Fixed

1. **Dusting Bug** (Fixed): Dusting only worked once. When a player's turn ended (by pressing End Turn), the ability to Dust a card from hand was not reset, persisting with "Already Dusted" and remaining unclickable.
   - **Fix**: Reset `hasDustedThisTurn` in `endTurnMove` function so it resets when turn ends

2. **Efficient Ally Bug** (Fixed): Playing an Efficient Ally incorrectly prevented playing a Powerful ally afterwards. Efficient allies should not consume Ally Actions and should not prevent playing Powerful allies later.
   - **Fix**: Updated the recovery logic to account for Efficient allies not consuming Ally Actions. The check now properly distinguishes between Efficient allies (which don't consume actions) and non-Efficient allies (which do consume actions) when determining if `allyActionsAvailable` should be reset.

3. **Phase Order Bug** (Fixed): Players could play Energy coins during the Ally phase and mix playing allies and energy coins. This broke cards like Wellspring Portal which need to draw cards while energy coins are still in hand.
   - **Fix**: Added phase restrictions to `playCardMove`:
     - Energy Cells can only be played during ENERGY phase (or RELIC/SHIELD phases for convenience)
     - Ally cards can only be played during ALLY phase (or RELIC/SHIELD phases for convenience)
     - Fusion Fragments can be played during ALLY or ENERGY phases (they don't generate immediate energy)
     - No card playing allowed during ACQUISITION, DISCARD, RESET, or DUST phases

---

## Notes

- Add new bugs with a brief description, steps to reproduce (if applicable), and expected vs actual behavior
- Move bugs to "Fixed" section when resolved (don't delete for historical reference)
- Update priorities as needed

