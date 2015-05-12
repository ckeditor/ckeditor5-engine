/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, sinon, document */

'use strict';

var modules = bender.amd.require( 'editor', 'editorconfig', 'promise' );

var editor;
var element;
var elementInnerHTML = '<p>Test</p>';

beforeEach( function() {
	var Editor = modules.editor;

	element = document.createElement( 'div' );
	element.innerHTML = elementInnerHTML;
	document.body.appendChild( element );

	editor = new Editor( element );
} );

describe( 'constructor', function() {
	it( 'should create a new editor instance', function() {
		expect( editor ).to.have.property( 'element' ).to.equal( element );
	} );
} );

describe( 'config', function() {
	it( 'should be an instance of EditorConfig', function() {
		var EditorConfig = modules.editorconfig;

		expect( editor.config ).to.be.an.instanceof( EditorConfig );
	} );
} );

describe( 'init', function() {
	it( 'should return a promise that resolves properly', function() {
		var Promise = modules.promise;

		var promise = editor.init();

		expect( promise ).to.be.an.instanceof( Promise );

		return promise;
	} );

	it( 'should return the same promise for successive calls', function() {
		var promise = editor.init();

		expect( editor.init() ).to.equal( promise );
	} );

	it( 'should set the element data into the editor', function() {
		return editor.init().then( function() {
			expect( editor.getData() ).to.equal( elementInnerHTML );
		} );
	} );

	it( 'should set the element data into the editor (textarea)', function() {
		var Editor = modules.editor;

		var data = '<p>Textarea test</p>';

		element = document.createElement( 'textarea' );
		element.value = data;
		document.body.appendChild( element );

		editor = new Editor( element );

		return editor.init().then( function() {
			expect( editor.getData() ).to.equal( data );
		} );
	} );

	it( 'should not set the element data into the editor if data is already set', function() {
		var data = '<p>Another test</p>';

		return editor.setData( data ).then( function() {
			return editor.init().then( function() {
				expect( editor.getData() ).to.equal( data );
			} );
		} );
	} );
} );

describe( 'destroy', function() {
	it( 'should fire "destroy"', function() {
		var spy = sinon.spy();

		editor.on( 'destroy', spy );

		return editor.destroy().then( function() {
			sinon.assert.called( spy );
		} );
	} );

	it( 'should undefine the "element" property', function() {
		return editor.destroy().then( function() {
			expect( editor ).to.not.have.property( 'element' );
		} );
	} );
} );

describe( 'setData', function() {
	it( 'should return a promise that resolves properly', function() {
		var Promise = modules.promise;

		var promise = editor.setData( '' );

		expect( promise ).to.be.an.instanceof( Promise );

		return promise;
	} );

	it( 'should set the editor data', function() {
		var data = '<p>Test</p>';

		return editor.setData( data ).then( function() {
			expect( editor.getData() ).to.equal( data );
		} );
	} );
} );

describe( 'setData', function() {
	it( 'should return a promise that resolves properly', function() {
		var Promise = modules.promise;

		var promise = editor.setData( '' );

		expect( promise ).to.be.an.instanceof( Promise );

		return promise;
	} );

	it( 'should set the editor data', function() {
		var data = '<p>Another test</p>';

		return editor.setData( data ).then( function() {
			expect( editor.getData() ).to.equal( data );
		} );
	} );
} );

describe( 'getData', function() {
	// This is mostly a dup for one of the `init` tests, but it is here for completness as there are no other useful
	// tests for getData().
	it( 'should get the editor data', function() {
		return editor.init().then( function() {
			expect( editor.getData() ).to.equal( elementInnerHTML );
		} );
	} );

	it( 'should return an emtpy string if no data is available', function() {
		expect( editor.getData() ).to.equal( '' );
	} );
} );
