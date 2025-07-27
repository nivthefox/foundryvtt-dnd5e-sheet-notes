# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial module foundation for FoundryVTT v12+ and D&D 5e system v4.1.2+
- Custom Note item type for D&D 5e system
  - Simple note-taking interface with title and rich text content
  - Extends D&D 5e ItemSheet5e2 for full system compatibility
  - Hides unnecessary UI elements (chat description, tabs)
- Notes tab on character sheets
  - Appears on both PC and NPC character sheets
  - Uses fa-book-open icon to match Foundry's Journal interface
- Category management system
  - Create, edit, and delete note categories
  - Default "Notes" category that cannot be deleted
  - Alphabetical and manual ordering options
  - Categories stored as actor flags
  - Empty categories hidden except in edit mode
  - D&D 5e styled radio buttons for ordering selection