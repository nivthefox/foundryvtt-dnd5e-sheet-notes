# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**5e Sheet Notes & Trackers** - A FoundryVTT module for D&D 5th Edition that adds a comprehensive Notes tab to character sheets, featuring integrated note-taking and custom tracker functionality.

**Technology Stack:** FoundryVTT v12+, D&D 5e System v4.1.2+, ES Modules, Rollup, SCSS, lib-wrapper  
**Architecture:** Feature-based architecture focused on character sheet enhancement

## Core Development Principles

### 1. Investigation First
- Examine existing character sheet structure before modifications
- Understand D&D 5e system's sheet implementation
- Document findings before planning

### 2. Planning Requires Approval  
- Create implementation plans for review
- NO CODE in plans - only approach and structure
- Always ask "Does this plan look correct?"
- Never proceed without explicit approval

### 3. Test-Driven Development
- Write Playwright tests for user interactions
- Test sheet rendering and tab switching
- Verify data persistence across sheet operations

### 4. Command Structure
Commands are organized in `.claude/commands/` by category:
- `/feature:investigate issue=1` - Collaborative investigation with runtime checks
- `/feature:plan issue=1` - Create implementation plan (requires approval)
- `/feature:implement issue=1` - Implement based on plan and tests
- `/test:playwright issue=1` - Write integration tests

### 5. Build Verification
- Always run `npm run build` before committing
- Ensure `npm run lint` passes
- Test in actual Foundry environment

## Quick Reference

```bash
# Development
npm run build          # Full build (lint + code + styles)
npm run watch          # Watch all files for changes
npm run lint           # ESLint check

# Testing
npm test               # Run Playwright tests
npm run test:headed    # Run with browser visible
```

## Project Structure

```
src/
├── main.js           # Module entry point
├── lang/             # Localization files
├── styles/           # SCSS stylesheets
└── types.js          # Type definitions

dist/                 # Build output (gitignored)
├── main.js
├── styles/
└── lang/
```

## Current Milestones

### Milestone 1: Core Notes Functionality
- Add Notes tab to character sheets (#1)
- Actor-JournalEntryPage linking system (#2)
- Category management system (#3)
- Category management dialog (#4)
- Display pages organized by category (#5)
- Drag-drop between categories (#7)
- Bidirectional drag-drop with Journals (#8)
- Context menu actions (#10)

### Milestone 2: Tracker System
- Custom TrackerPage JournalEntryPage type
- Support for string, number, and enum value types
- Integration with Notes tab

## Critical Guidelines

- **lib-wrapper required** - Use for all sheet modifications
- **Preserve existing functionality** - Don't break core sheet features
- **Respect user data** - Handle deletion and cleanup gracefully
- **Follow D&D 5e patterns** - Match existing UI/UX conventions
- **Test PC and NPC sheets** - Both must work correctly

## Code Style

- **Imports:** Use ES modules with relative paths
- **DOM:** Modern APIs only, no jQuery
- **CSS:** Use SCSS, follow D&D 5e system conventions
- **Patterns:** Follow existing D&D 5e sheet patterns
- **Security:** Never expose user data inappropriately

## Key Integration Points

- **Character Sheets:** ActorSheet5eCharacter, ActorSheet5eNPC
- **Tab System:** Sheet's existing tab navigation
- **Data Storage:** Actor document for categories and associations
- **Journal System:** JournalEntry and JournalEntryPage documents

---

*This CLAUDE.md file helps maintain consistency and quality when developing the 5e Sheet Notes & Trackers module.*