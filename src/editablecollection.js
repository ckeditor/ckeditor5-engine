/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Represents a collection of editables.
 *
 * @class EditableCollection
 * @extends Collection
 */

CKEDITOR.define( [ 'collection' ], function( Collection ) {
	class EditableCollection extends Collection {
		/**
		 * Creates a new instance of the EditableCollection class.
		 *
		 * @constructor
		 */
		constructor( parentEditable ) {
			this.set( 'parent', parentEditable );
		}

		add( editable ) {
			if ( this.parent ) {
				editable.parent = this.parent;
			}

			super( editable );
		}

		get current() {
			return this._current || ( this.length && this.get( 0 ) ) || null;
		}

		set current( current ) {
			this._current = current;
		}
	}

	return EditableCollection;
} );