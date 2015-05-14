/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Represents a single editor instance.
 *
 * @class Editor
 */

CKEDITOR.define( [
	'model',
	'editorconfig',
	'plugincollection',
	'editable',
	'promise'
], function( Model, EditorConfig, PluginCollection, Editable, Promise ) {
	var Editor = Model.extend( {
		/**
		 * Creates a new instance of the Editor class.
		 *
		 * This constructor should be rarely used. When creating new editor instance use instead the
		 * {@link CKEDITOR#create CKEDITOR.create() method}.
		 *
		 * @param {HTMLElement} element The DOM element that will be the source for the created editor.
		 * @constructor
		 */
		constructor: function Editor( element, config ) {
			/**
			 * The original host page element upon which the editor is created. It is only supposed to be provided on
			 * editor creation and is not subject to be modified.
			 *
			 * @readonly
			 * @property {HTMLElement}
			 */
			this.element = element;

			/**
			 * Holds all configurations specific to this editor instance.
			 *
			 * This instance of the {@link Config} class is customized so its {@link Config#get} method will retrieve
			 * global configurations available in {@link CKEDITOR.config} if configurations are not found in the
			 * instance itself.
			 *
			 * @type {Config}
			 */
			this.config = new EditorConfig( config );

			/**
			 * The plugins loaded and in use by this editor instance.
			 *
			 * @type {PluginCollection}
			 */
			this.plugins = new PluginCollection( this );

			this._creators = {};

			Object.defineProperty( this, 'editable', {
				configurable: true
			} );
		},

		/**
		 * Initializes the editor instance object after its creation.
		 *
		 * The initialization consists of the following procedures:
		 *
		 *  * Load and initialize the configured plugins.
		 *  * TODO: Add other procedures here.
		 *
		 * This method should be rarely used as `CKEDITOR.create` calls it one should never use the `Editor` constructor
		 * directly.
		 *
		 * @returns {Promise} A promise that resolves once the initialization is completed.
		 */
		init: function() {
			var that = this;
			var config = this.config;

			// Create and cache a promise that resolves when all initialization procedures get resolved.
			this._initPromise = this._initPromise || Promise.resolve()
				.then( loadPlugins )
				.then( initPlugins )
				.then( fireCreator );

			return this._initPromise;

			function loadPlugins() {
				return that.plugins.load( config.plugins );
			}

			function initPlugins() {
				// Start with a resolved promise.
				var promise = Promise.resolve();

				// Chain it with promises that resolve with the init() call of every plugin.
				for ( var i = 0; i < that.plugins.length; i++ ) {
					promise = promise.then( callInit( i ) );
				}

				// Return the promise chain.
				return promise;

				function callInit( index ) {
					return function() {
						// Returns init(). If it is a promise, the next then() interation will be called only when it
						// will be resolved, enabling asynchronous init().
						return that.plugins.get( index ).init();
					};
				}
			}

			function fireCreator() {
				// Take the name of the creator to use (config or any of the registered ones).
				var creatorName = config.creator || Object.keys( that._creators )[ 0 ];

				if ( creatorName ) {
					// Take the registered class for the given creator name.
					var Creator = that._creators[creatorName];

					if ( !Creator ) {
						throw( new Error( 'The "' + creatorName + '" creator was not found. Check `config.creator`.' ) );
					}

					// Create an instance of the creator.
					that._creator = new Creator( that );

					// Finally fire the creator. It may be asynchronous, returning a promise.
					return that._creator.create();
				}

				return 0;
			}
		},

		/**
		 * Destroys the editor instance, releasing all resources used by it. If the editor replaced an element, the
		 * element will be recovered.
		 *
		 * @fires destroy
		 * @returns {Promise} A promise that resolves once the editor instance is fully destroyed.
		 */
		destroy: function() {
			var that = this;

			this.fire( 'destroy' );

			this._destroyPromise = this._destroyPromise || Promise.resolve()
				.then( function() {
					return that._creator && that._creator.destroy();
				} )
				.then( function() {
					that.element = undefined;
				} );

			return this._destroyPromise;
		},

		setData: function( data ) {
			if ( this._dataTunnel ) {
				return this._dataTunnel.setData( data );
			}

			var element = this.element;

			if ( 'value' in element ) {
				element.value = data;
			} else {
				element.innerHTML = data;
			}

			return Promise.resolve();
		},

		getData: function() {
			if ( this._dataTunnel ) {
				return this._dataTunnel.getData();
			}

			var element = this.element;

			if ( 'value' in element ) {
				return element.value;
			} else {
				return element.innerHTML;
			}
		},

		setEditable: function( newEditable ) {
			// Ensure that we have an instance of Editable (it may be an element).
			newEditable = newEditable && new Editable( newEditable );

			// Do nothing if there is no change on editable.
			if ( this.editable === newEditable ) {
				return Promise.resolve();
			}

			// Save the current data.
			var data = this.getData();

			// Set the new editable as the "data tunnel" for future getData() and setData() calls.
			this._dataTunnel = newEditable;

			// this.editable is a readonly (configurable) property, so defineProperty() must be used to set it.
			Object.defineProperty( this, 'editable', {
				writable: true,		// Needed by PhantomJS.
				value: newEditable
			} );

			// Make the property readonly again.	// Needed by PhantomJS (see above).
			Object.defineProperty( this, 'editable', {
				writable: false
			} );

			// Set the current data into the new editable.
			return this.setData( data );
		},

		addCreator: function( name, creatorClass ) {
			this._creators[ name ] = creatorClass;
		}
	} );

	return Editor;
} );

/**
 * Fired when this editor instance is destroyed. The editor at this point is not usable and this event should be used to
 * perform the clean-up in any plugin.
 *
 * @event destroy
 */
