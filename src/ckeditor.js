/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals document, HTMLElement */

'use strict';

/**
 * This is the API entry point. The entire CKEditor code runs under this object.
 *
 * @class CKEDITOR
 * @singleton
 */

CKEDITOR.define( [ 'editor', 'collection', 'promise', 'config' ], function( Editor, Collection, Promise, Config ) {
	var CKEDITOR = {
		/**
		 * A collection containing all editor instances created.
		 *
		 * @readonly
		 * @property {Collection}
		 */
		instances: new Collection(),

		/**
		 * Creates an editor instance for the provided DOM element.
		 *
		 * The creation of editor instances is an asynchronous operation, therefore a promise is returned by this
		 * method.
		 *
		 *		CKEDITOR.create( '#content' );
		 *
		 *		CKEDITOR.create( '#content' ).then( function( editor ) {
		 *			// Manipulate "editor" here.
		 *		} );
		 *
		 * @param {String|HTMLElement|NodeList|HTMLCollection|Array} elements An element selector, an element or a list
		 * of elements, which will be the editables of the created instance.
		 * @returns {Promise} A promise, which will be fulfilled with the created editor.
		 */
		create: function( elements, config ) {
			var that = this;

			return new Promise( function( resolve, reject ) {
				// If a query selector has been passed, transform it into a real element.
				if ( typeof elements == 'string' ) {
					var query = elements;
					elements = document.querySelectorAll( query );

					if ( !elements.length ) {
						reject( new Error( 'No elements found for the query "' + query + '"' ) );
					}
				} else if ( elements instanceof HTMLElement ) {
					// Transform a single element into an array.
					elements = [ elements ];
				}

				if ( !Array.isArray( elements ) ) {
					// Transform "array-like" to pure array.
					elements = Array.prototype.slice.call( elements );
				}

				var editor = new Editor();

				if ( config ) {
					editor.config.set( config );
				}

				elements.forEach( function( element ) {
					editor.editables.add( element );
				} );

				that.instances.add( editor );

				// Remove the editor from `instances` when destroyed.
				editor.once( 'destroy', function() {
					that.instances.remove( editor );
				} );

				resolve(
					// Initializes the editor, which returns a promise.
					editor.init()
						.then( function() {
							// After initialization, return the created editor.
							return editor;
						} )
				);
			} );
		},

		/**
		 * Holds global configuration defaults, which will be used by editor instances when such configurations are not
		 * available on them directly.
		 */
		config: new Config(),

		/**
		 * Gets the full URL path for the specified plugin.
		 *
		 * Note that the plugin is not checked to exist. It is a pure path computation.
		 *
		 * @param {String} name The plugin name.
		 * @returns {String} The full URL path of the plugin.
		 */
		getPluginPath: function( name ) {
			return this.basePath + 'plugins/' + name + '/';
		}
	};

	return CKEDITOR;
} );
