/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Represents an editable inside the editor.
 *
 * @class Editable
 */

CKEDITOR.define( [ 'model', 'promise' ], function( Model, Promise ) {
	var Editable = Model.extend( {
		constructor: function Editable( element ) {
			// Accept and Editable instance as parameter as well, for simplification in other parts of the code.
			if ( element instanceof Editable ) {
				return element;
			}

			// Call the base constructor.
			Model.apply( this );

			/**
			 * The DOM element managed by this editable.
			 *
			 * @readonly
			 * @property {HTMLElement}
			 */
			this.element = element;

			this.isEditable = true;

			return this;
		},

		/**
		 * Sets the editable data.
		 *
		 * @param {String} data The data to be set into the editable.
		 * @returns {Promise} A promise that resolves as soon as the data is processed and fully loaded inside the
		 * editable.
		 */
		setData: function( data ) {
			this.element.innerHTML = data;

			return Promise.resolve();
		},

		/**
		 * Gets the current editable data.
		 *
		 * @returns {String} The data.
		 */
		getData: function() {
			return this.element.innerHTML;
		}
	} );

	/**
	 * @member Editable
	 */
	Object.defineProperties( Editable.prototype, {
		/**
		 * Indicates whether or not the editable has editing enabled.
		 *
		 * @property {Boolean}
		 */
		isEditable: {
			get: function() {
				return ( this.element.contentEditable.toString() == 'true' );
			},

			set: function( value ) {
				this.element.contentEditable = value;
			}
		}
	} );

	return Editable;
} );
