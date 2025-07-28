/**
 * Favorite Enhancement System for Notes
 * Handles special behavior when favorited notes are clicked
 */

/**
 * Register libWrapper enhancement for favorites functionality
 */
export function registerFavoriteEnhancement() {
  libWrapper.register('dnd5e-sheet-notes', 
    'dnd5e.applications.actor.ActorSheet5eCharacter2.prototype._onUseFavorite', 
    async function(wrapped, event) {
      if ( !this.isEditable || (event.target.tagName === "INPUT") ) return;
      const { favoriteId } = event.currentTarget.closest("[data-favorite-id]").dataset;
      const favorite = await fromUuid(favoriteId, { relative: this.actor });
      
      if ( (favorite instanceof dnd5e.documents.Item5e) || event.currentTarget.dataset.activityId ) {
        // Special handling for notes - open sheet like containers do
        if ( favorite.type === 'dnd5e-sheet-notes.note' ) {
          return favorite.sheet.render(true);
        }
      }
      
      // Call original method for all other types
      return wrapped(event);
    }, 'MIXED');
}