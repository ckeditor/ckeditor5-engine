/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, sinon, document, setTimeout */

'use strict';

var modules = bender.amd.require( 'editor', 'plugin' );

var editor;
var element;

beforeEach( function() {
	editor = getEditor();
} );

function getEditor( config ) {
	element = document.createElement( 'div' );
	document.body.appendChild( element );

	var Editor = modules.editor;

	var editor = new Editor();

	if ( config ) {
		editor.config.set( config );
	}

	return editor;
}

// Define fake plugins to be used in tests.

CKEDITOR.define( 'plugin!A', [ 'plugin' ], function( Plugin ) {
	return Plugin.extend( {
		init: sinon.spy().named( 'A' )
	} );
} );

CKEDITOR.define( 'plugin!B', [ 'plugin' ], function( Plugin ) {
	return Plugin.extend( {
		init: sinon.spy().named( 'B' )
	} );
} );

CKEDITOR.define( 'plugin!C', [ 'plugin', 'plugin!B' ], function( Plugin ) {
	return Plugin.extend( {
		init: sinon.spy().named( 'C' )
	} );
} );

CKEDITOR.define( 'plugin!D', [ 'plugin', 'plugin!C' ], function( Plugin ) {
	return Plugin.extend( {
		init: sinon.spy().named( 'D' )
	} );
} );

CKEDITOR.define( 'plugin!E', [ 'plugin' ], function( Plugin ) {
	return Plugin.extend( {} );
} );

// Synchronous plugin that depends on an asynchronous one.
CKEDITOR.define( 'plugin!F', [ 'plugin', 'plugin!async' ], function( Plugin ) {
	return Plugin.extend( {
		init: sinon.spy().named( 'F' )
	} );
} );

var asyncSpy = sinon.spy().named( 'async-call-spy' );

CKEDITOR.define( 'plugin!async', [ 'plugin', 'promise' ], function( Plugin, Promise ) {
	return Plugin.extend( {
		init: sinon.spy( function() {
			return new Promise( function( resolve ) {
				setTimeout( function() {
					asyncSpy();
					resolve();
				}, 0 );
			} );
		} )
	} );
} );

///////////////////

describe( 'init', function() {
	it( 'should fill `plugins`', function() {
		var Plugin = modules.plugin;

		editor = getEditor( {
			plugins: 'A,B'
		} );

		expect( editor.plugins.length ).to.equal( 0 );

		return editor.init().then( function() {
			expect( editor.plugins.length ).to.equal( 2 );

			expect( editor.plugins.get( 'A' ) ).to.be.an.instanceof( Plugin );
			expect( editor.plugins.get( 'B' ) ).to.be.an.instanceof( Plugin );
		} );
	} );

	it( 'should initialize plugins in the right order', function() {
		editor = getEditor( {
			plugins: 'A,D'
		} );

		return editor.init().then( function() {
			sinon.assert.callOrder(
				editor.plugins.get( 'A' ).init,
				editor.plugins.get( 'B' ).init,
				editor.plugins.get( 'C' ).init,
				editor.plugins.get( 'D' ).init
			);
		} );
	} );

	it( 'should initialize plugins in the right order, waiting for asynchronous ones', function() {
		editor = getEditor( {
			plugins: 'A,F'
		} );

		return editor.init().then( function() {
			sinon.assert.callOrder(
				editor.plugins.get( 'A' ).init,
				editor.plugins.get( 'async' ).init,
				asyncSpy,	// This one is called with delay by the async init
				editor.plugins.get( 'F' ).init
			);
		} );
	} );

	it( 'should not fail if loading a plugin that doesn\'t define init()', function() {
		editor = getEditor( {
			plugins: 'E'
		} );

		return editor.init();
	} );
} );

describe( 'plugins', function() {
	it( 'should be empty on new editor', function() {
		expect( editor.plugins.length ).to.equal( 0 );
	} );
} );
