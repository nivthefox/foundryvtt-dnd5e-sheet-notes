import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        foundry: 'readonly',
        game: 'readonly',
        canvas: 'readonly',
        ui: 'readonly',
        Hooks: 'readonly',
        CONFIG: 'readonly',
        Dialog: 'readonly',
        ChatMessage: 'readonly',
        Actor: 'readonly',
        Item: 'readonly',
        Macro: 'readonly',
        User: 'readonly',
        Folder: 'readonly',
        JournalEntry: 'readonly',
        JournalEntryPage: 'readonly',
        RollTable: 'readonly',
        Playlist: 'readonly',
        Scene: 'readonly',
        Combat: 'readonly',
        CombatTracker: 'readonly',
        Compendium: 'readonly',
        WorldCollection: 'readonly',
        FormApplication: 'readonly',
        Application: 'readonly',
        Roll: 'readonly',
        libWrapper: 'readonly',
        FormDataExtended: 'readonly',
        TextEditor: 'readonly',
        fromUuid: 'readonly',
        fromUuidSync: 'readonly',
        ActiveEffect: 'readonly',
        CONST: 'readonly',
        KeyboardManager: 'readonly',
        ContextMenu: 'readonly',
        loadTemplates: 'readonly',
        renderTemplate: 'readonly',
        getTemplate: 'readonly',
        SortingHelpers: 'readonly',
        DragDrop: 'readonly'
      }
    }
  },
  {
    ignores: ['dist/', 'node_modules/', 'packs/']
  },
  {
    rules: {
      'no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_' 
      }],
      'no-console': ['warn', { 
        allow: ['warn', 'error', 'debug'] 
      }],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { 
        'avoidEscape': true 
      }],
      'indent': ['error', 2],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always']
    }
  }
];