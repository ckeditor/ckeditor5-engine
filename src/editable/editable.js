/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Represents a single editable.
 *
 * @class Editable
 * @extends Model
 */

CKEDITOR.define( [ 'model', 'editablecollection' ], function( Model, EditableCollection ) {
	class Editable extends Model {
		/**
		 * Creates a new instance of the Editable class.
		 * @constructor
		 */
		constructor( ViewClass ) {
			/**
			 * Whether the editable is in read-write or read-only mode.
			 *
			 * @property {Boolean} isEditable
			 */
			this.set( 'isEditable', true );

			/**
			 * Whether the editable is focused.
			 *
			 * @property {Boolean} isFocused
			 */
			this.set( 'isFocused', false );

			/**
			 * The parent editable of this editable
			 *
			 * @readonly
			 * @property {Editable} parent
			 */
			this.set( 'parent' );

			/**
			 * The child editables of this editable.
			 *
			 * @readonly
			 * @property {EditableCollection} editables
			 */
			this.set( 'editables', new EditableCollection( this ) );

			/**
			 * The view of the editable component.
			 *
			 * @readonly
			 * @property {editable/View} view
			 */
			this.set( 'view', new ViewClass( this ) );
		}

		// TODO
		// This will be totally rewritten once we use the UI core lib to implement editables.
		init() {
			return Promise.resolve().then( () => this.view.init() );
		}
	}

	return Editable;
} );