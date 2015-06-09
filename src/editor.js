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
	'editablecollection',
	'promise'
], function( Model, EditorConfig, PluginCollection, EditableCollection, Promise ) {
	var Editor = Model.extend( {
		/**
		 * Creates a new instance of the Editor class.
		 *
		 * This constructor should be rarely used. When creating new editor instance use instead the
		 * {@link CKEDITOR#create CKEDITOR.create() method}.
		 *
		 * @constructor
		 */
		constructor: function Editor() {
			// Call the base constructor.
			Model.apply( this );

			/**
			 * Holds all configurations specific to this editor instance.
			 *
			 * This instance of the {@link Config} class is customized so its {@link Config#get} method will retrieve
			 * global configurations available in {@link CKEDITOR.config} if configurations are not found in the
			 * instance itself.
			 *
			 * @readonly
			 * @type {Config} config
			 */
			this.set( 'config', new EditorConfig() );

			/**
			 * The plugins loaded and in use by this editor instance.
			 *
			 * @readonly
			 * @type {PluginCollection} plugins
			 */
			this.set( 'plugins', new PluginCollection( this ) );

			/**
			 * The editables attached to this editor instance.
			 *
			 * @readonly
			 * @type {EditableCollection} editables
			 */
			this.set( 'editables', new EditableCollection() );

			this._creators = {};
		},

		/**
		 * Initializes the editor instance object after its creation.
		 *
		 * The initialization consists of the following procedures:
		 *
		 *  * Loads and initializes the configured plugins.
		 *  * Fires the editor creator.
		 *  * Initializes all editables.
		 *
		 * This method should be rarely used as `CKEDITOR.create` calls it. One should never use the `Editor`
		 * constructor directly.
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
				.then( prepareData )
				.then( fireCreator )
				.then( initEditables )
				.then( loadData );

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

			function prepareData() {
				// At this stage we have the editor initial data at its "pure" form. There are two possibilities:
				//
				//   1. editor.setData() has been called before editor.init() - editor._data has been set. In this case
				//      we don't want to change it because we assume that this is the data the end-developer wants to
				//      have, no matter what.
				//
				//   2. An editable is available. In this case we take the initial data from editable.element. This must
				//      be done at this stage because both fireCreator() and initEditables() will drive the data to
				//      editable.view instead.
				if ( typeof that._data != 'string' ) {
					that._data = that.getData();
				}
			}

			function fireCreator() {
				// Take the name of the creator to use (config or any of the registered ones).
				var creatorName = config.creator || Object.keys( that._creators )[ 0 ];

				if ( creatorName ) {
					// Take the registered class for the given creator name.
					var Creator = that._creators[ creatorName ];

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

			function initEditables() {
				var promises = [];

				for ( var i = 0; i < that.editables.length; i++ ) {
					promises.push( that.editables.get( i ).init() );
				}

				return Promise.all( promises );
			}

			function loadData() {
				// Finally we can set the data into the editor. This will endup into editable.view at this stage.
				return that.setData( that._data );
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
				} );

			return this._destroyPromise;
		},

		/**
		 * Sets the editor data.
		 *
		 * **Attention**: setting the editor data may be an asynchronous operation.
		 *
		 * @param {String} data The data to be set.
		 * @returns {Promise} A promise that resolves once the data is fully loaded in the editor.
		 */
		setData: function( data ) {
			if ( this.editables.current ) {
				this._data = undefined;

				return this.editables.current.setData( data );
			}

			this._data = data;

			return Promise.resolve();
		},

		/**
		 * Gets the editor data.
		 *
		 * @returns {String} The current data.
		 */
		getData: function() {
			if ( this.editables.current ) {
				return this.editables.current.getData();
			}

			return this._data || '';
		},

		/**
		 * Registers a creator into the editor.
		 *
		 * Creators are usually plugins that take the responsibility of bootstrapping the UI of the editor instance.
		 * Therefore this method has little use out of such plugins scope.
		 *
		 * Usually just one creator will be registered but it is possible to have multiple creators available. In such
		 * case, the `creator` configuration must be used to specify which one to use.
		 *
		 * @param {String} name The name of the creator. This is the name used in the `creator` configuration.
		 * @param {Function} creatorClass The JavaScript class (constructor function) that
		 */
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
