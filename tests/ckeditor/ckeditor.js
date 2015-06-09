/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, document */

'use strict';

var modules = bender.amd.require( 'ckeditor', 'editor', 'promise', 'config' );

var element;

beforeEach( function() {
	var CKEDITOR = modules.ckeditor;

	// Destroy all editor instances.
	while ( CKEDITOR.instances.length ) {
		CKEDITOR.instances.get( 0 ).destroy();
	}

	// Remove all created elements.
	while ( ( element = document.querySelector( '.content' ) ) ) {
		element.parentNode.removeChild( element );
	}

	// Create a fresh new element.
	element = createElement();
} );

function createElement() {
	var el = document.createElement( 'div' );
	el.className = 'content';
	document.body.appendChild( el );

	return el;
}

describe( 'create', function() {
	it( 'should return a promise', function() {
		var CKEDITOR = modules.ckeditor;
		var Promise = modules.promise;

		expect( CKEDITOR.create( element ) ).to.be.instanceof( Promise );
	} );

	it( 'should create a new editor instance (passing a single DOM element)', function() {
		var CKEDITOR = modules.ckeditor;
		var Editor = modules.editor;

		return CKEDITOR.create( element ).then( function( editor ) {
			expect( editor ).to.be.instanceof( Editor );
			expect( editor.editables ).to.have.length( 1 );
			expect( editor.editables.current.element ).to.equal( element );
		} );
	} );

	it( 'should create a new editor instance (passing a single-element selector)', function() {
		var CKEDITOR = modules.ckeditor;
		var Editor = modules.editor;

		return CKEDITOR.create( '.content' ).then( function( editor ) {
			expect( editor ).to.be.instanceof( Editor );
			expect( editor.editables ).to.have.length( 1 );
			expect( editor.editables.current.element ).to.equal( element );
		} );
	} );

	it( 'should create a new editor instance (passing a multi-element selector)', function() {
		var CKEDITOR = modules.ckeditor;
		var Editor = modules.editor;

		// Create to additional elements (three in total).
		createElement();
		createElement();

		return CKEDITOR.create( '.content' ).then( function( editor ) {
			expect( editor ).to.be.instanceof( Editor );
			expect( editor.editables ).to.have.length( 3 );
			expect( editor.editables.get( 0 ).element.className ).to.equal( 'content' );
			expect( editor.editables.get( 1 ).element.className ).to.equal( 'content' );
			expect( editor.editables.get( 2 ).element.className ).to.equal( 'content' );
		} );
	} );

	it( 'should create a new editor instance (passing an array)', function() {
		var CKEDITOR = modules.ckeditor;
		var Editor = modules.editor;

		var elements = [ createElement(), createElement() ];

		return CKEDITOR.create( elements ).then( function( editor ) {
			expect( editor ).to.be.instanceof( Editor );
			expect( editor.editables ).to.have.length( 2 );
			expect( editor.editables.get( 0 ).element.className ).to.equal( 'content' );
			expect( editor.editables.get( 1 ).element.className ).to.equal( 'content' );
		} );
	} );

	it( 'should set configurations on the new editor', function() {
		var CKEDITOR = modules.ckeditor;

		return CKEDITOR.create( element, { test: 1 } ).then( function( editor ) {
			expect( editor.config.test ).to.equal( 1 );
		} );
	} );

	it( 'should add the editor to the `instances` collection', function() {
		var CKEDITOR = modules.ckeditor;

		return CKEDITOR.create( element ).then( function( editor ) {
			expect( CKEDITOR.instances ).to.have.length( 1 );
			expect( CKEDITOR.instances.get( 0 ) ).to.equal( editor );
		} );
	} );

	it( 'should remove the editor from the `instances` collection on `destroy` event', function() {
		var CKEDITOR = modules.ckeditor;
		var editor1, editor2;

		// Create the first editor.
		return CKEDITOR.create( element ).then( function( editor ) {
			editor1 = editor;

			// Create the second editor.
			return CKEDITOR.create( createElement() ).then( function( editor ) {
				editor2 = editor;

				// It should have 2 editors.
				expect( CKEDITOR.instances ).to.have.length( 2 );

				// Destroy one of them.
				editor1.destroy();

				// It should have 1 editor now.
				expect( CKEDITOR.instances ).to.have.length( 1 );

				// Ensure that the remaining is the right one.
				expect( CKEDITOR.instances.get( 0 ) ).to.equal( editor2 );
			} );
		} );
	} );

	it( 'should be rejected on element not found', function() {
		var CKEDITOR = modules.ckeditor;

		return CKEDITOR.create( '.undefined' ).then( function() {
			throw new Error( 'It should not enter this function' );
		} ).catch( function( error ) {
			expect( error ).to.be.instanceof( Error );
			expect( error.message ).to.equal( 'No elements found for the query ".undefined"' );
		} );
	} );
} );

describe( 'config', function() {
	it( 'should be an instance of Config', function() {
		var CKEDITOR = modules.ckeditor;
		var Config = modules.config;

		expect( CKEDITOR.config ).to.be.an.instanceof( Config );
	} );
} );
