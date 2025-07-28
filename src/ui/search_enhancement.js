/**
 * Search Enhancement for item-list-controls
 * Extends the D&D 5e search functionality to include note content
 */

/**
 * Register libWrapper enhancement for ItemListControlsElement to enable content searching in notes
 * Uses libWrapper to extend the _applyFilters method to show notes that match content but not titles
 */
export function registerSearchEnhancement() {
  // Use libWrapper to enhance item-list-controls search for content matching
  libWrapper.register('dnd5e-sheet-notes', 'dnd5e.applications.components.ItemListControlsElement.prototype._applyFilters', function(wrapped) {
    // Call the original method first
    const result = wrapped();

    // Check if this is our notes search and we have content matches to show
    if (this.getAttribute('for') === 'notes' && this.app?._notesContentMatches?.size > 0) {
      const searchTerm = this.app._filters.notes.name;
      if (searchTerm) {
        // Find hidden notes that should be shown due to content matches
        this.list.querySelectorAll('.item[data-item-id]').forEach(el => {
          const noteId = el.dataset.itemId;
          if (this.app._notesContentMatches.has(noteId) && el.hidden) {
            el.hidden = false;
            // Show parent section too
            const section = el.closest('.items-section');
            if (section) section.hidden = false;
          }
        });
      }
    }

    return result;
  }, 'WRAPPER');
}
