/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals HTMLElement */

'use strict';

/**
 * Manages a list of CKEditor plugins, including loading, initialization and destruction.
 *
 * @class PluginCollection
 * @extends Collection
 */

CKEDITOR.define( [ 'collection', 'editable' ], function( Collection, Editable ) {
	var EditableCollection = Collection.extend( {
		/**
		 * Creates an instance of the PluginCollection class, initializing it with a set of plugins.
		 *
		 * @constructor
		 */
		constructor: function EditableCollection( parent ) {
			// Call the base constructor.
			Collection.apply( this );

			this.parent = parent;

			var current;

			/**
			 * Points to the current default editable in the collection. It defaults to the first editable available
			 * editable (`collection.get( 0 )`).
			 *
			 * @property {Editable} current
			 */
			Object.defineProperty( this, 'current', {
				get: function() {
					return current || ( this.length && this.get( 0 ) ) || null;
				},

				set: function( value ) {
					current = value;
				}
			} );
		},

		/**
		 * Adds an editable to the collection.
		 *
		 * @param {Editable|HTMLElement} editableOrElement The editable to be added or an element which the
		 * editable to be added is created from.
		 */
		add: function( editableOrElement ) {
			var editable = editableOrElement;

			if ( editableOrElement instanceof HTMLElement ) {
				editable = new Editable( editableOrElement );
			}

			if ( this.parent ) {
				editable.parent = this.parent;
			}

			// Call the original implementation.
			Collection.prototype.add.call( this, editable );
		}
	} );

	return EditableCollection;
} );
