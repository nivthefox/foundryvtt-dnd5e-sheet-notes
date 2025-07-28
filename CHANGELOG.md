# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Collapsible categories - click on category headers to expand/collapse their contents
- Hidden notes count displayed when categories are collapsed

### Changed
- Removed minimum height from category sections for more compact layout
- Default category now uses proper random ID instead of hardcoded key
- Default category only created when needed (when uncategorized notes exist)
- Added version-based migration system for future data updates
- Automatic migration of uncategorized notes to default category when Notes tab is opened
- Default "Notes" category can now be edited (ordering, collapse) but not renamed or deleted
- Improved category control button alignment and spacing

## [1.0.0](https://github.com/nivthefox/foundryvtt-dnd5e-sheet-notes/releases/tag/1.0.0) - 2025-07-27

### Added
- Notes tab on character sheets (PC and NPC)
- Create and organize notes with custom categories
- Drag and drop notes between categories
- Right-click context menu for notes (view, edit, duplicate, delete)
- Rich text editor for note content