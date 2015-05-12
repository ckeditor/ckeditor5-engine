/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, sinon, document */

'use strict';

var modules = bender.amd.require( 'editor', 'editorconfig', 'promise' );

var editor;
var element;

beforeEach( function() {
	var Editor = modules.editor;

	element = document.createElement( 'div' );
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
