/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals HTMLTextAreaElement */

'use strict';

/**
 * Represents an editable inside the editor.
 *
 * @class Editable
 * @extends Model
 */

CKEDITOR.define( [ 'model', 'config', 'editablecollection', 'promise' ], function( Model, Config, EditableCollection, Promise ) {
	var Editable = Model.extend( {
		/**
		 * Creates an instance of the Editable class.
		 *
		 * @constructor
		 * @param {HTMLElement|Editable} element The DOM element that will be linked to this editable. If an editable is
		 * provided, that same editable is returned by the constructor.
		 */
		constructor: function Editable( element ) {
			// We need to renew the module request because of cross-reference with Editable<->EditableCollection.
			EditableCollection = CKEDITOR.require( 'editablecollection' );

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
			 * @property {HTMLElement} element
			 */
			this.set( 'element', element );

			/**
			 * The DOM element that represents the editable view.
			 *
			 * @readonly
			 * @property {HTMLElement} view
			 */
			this.set( 'view' );

			/**
			 * Configurations specific to this editable. It inherits configurations from parent editables.
			 *
			 * @readonly
			 * @property {Config} config
			 */
			this.set( 'config', new Config() );

			/**
			 * The child editables of this editable.
			 *
			 * @readonly
			 * @property {EditableCollection} editables
			 */
			this.set( 'editables', new EditableCollection( this ) );

			return this;
		},

		/**
		 * Initializes the editable.
		 *
		 * The initialization consists of the following procedures:
		 *
		 *  * Setup the editable view.
		 *  * Initialize children.
		 *  * Enable editing in the editable.
		 *
		 * This method should be rarely used as `editor.init` calls it during editor initialization.
		 *
		 * @returns {Promise} A promise that resolves once the initialization is completed.
		 */
		init: function() {
			var that = this;

			this._initPromise = this._initPromise || Promise.resolve()
				.then( setupView )
				.then( initChildren )
				.then( enableEditing );

			return this._initPromise;

			function setupView() {
				if ( !that.view ) {
					// TODO: For now we're simply pointing to the element. Once the Document Model (dm) will be implemented,
					// this will point to a real View object.
					that.view = that.element;
				}
			}

			function initChildren() {
				var promises = [];

				for ( var i = 0; i < that.editables.length; i++ ) {
					promises.push( that.editables.get( i ).init() );
				}

				return Promise.all( promises );
			}

			function enableEditing() {
				that.isEditable = true;
			}
		},

		/**
		 * Sets the editable data.
		 *
		 * @param {String} data The data to be set into the editable.
		 * @returns {Promise} A promise that resolves as soon as the data is processed and fully loaded inside the
		 * editable.
		 */
		setData: function( data ) {
			if ( this.view ) {
				this.view.innerHTML = data;
			} else {
				this.element.innerHTML = data;
			}

			return Promise.resolve();
		},

		/**
		 * Gets the current editable data.
		 *
		 * @returns {String} The data.
		 */
		getData: function() {
			var el = this.view || this.element;

			if ( el instanceof HTMLTextAreaElement ) {
				return el.value;
			}

			return el.innerHTML;
		}
	} );

	/**
	 * @member Editable
	 */
	Object.defineProperties( Editable.prototype, {
		/**
		 * The parent editable of this editable.
		 *
		 * @property {Boolean}
		 */
		parent: {
			set: function( parent ) {
				this.config.parent = parent.config;
				this._parent = parent;
			},

			get: function() {
				return this._parent;
			}
		},

		/**
		 * Indicates whether or not the editable has editing enabled.
		 *
		 * @property {Boolean}
		 */
		isEditable: {
			get: function() {
				return ( this.view && this.view.contentEditable.toString() == 'true' || false );
			},

			set: function( value ) {
				if ( this.view ) {
					this.view.contentEditable = value;
				}
			}
		}
	} );

	return Editable;
} );
