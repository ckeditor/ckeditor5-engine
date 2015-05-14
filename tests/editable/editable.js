/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, document */

'use strict';

var modules = bender.amd.require( 'editable' );

var editable;
var element;
var elementInnerHTML = '<p>Test</p>';

beforeEach( function() {
	var Editable = modules.editable;

	element = document.createElement( 'div' );
	element.innerHTML = elementInnerHTML;
	document.body.appendChild( element );

	editable = new Editable( element );
} );

describe( 'constructor', function() {
	it( 'should set the `element` property', function() {
		expect( editable ).to.have.property( 'element' ).to.equal( element );
	} );

	it( 'should accept an Editable instance as parameter', function() {
		var Editable = modules.editable;

		var newEditable = new Editable( editable );

		expect( newEditable ).to.equal( editable );
	} );

	it( 'should make the element editable', function() {
		// Use toString() because browsers return the string "true" not a boolean. So, just to be sure.
		expect( element.contentEditable.toString() ).to.equal( 'true' );
	} );
} );

describe( 'setData', function() {
	it( 'should set the element innerHTML', function() {
		var data = 'TEST';

		return editable.setData( data ).then( function() {
			expect( element.innerHTML ).to.equal( data );
		} );
	} );
} );

describe( 'setData', function() {
	it( 'should get the element innerHTML', function() {
		var data = 'TEST';

		element.innerHTML = data;

		expect( editable.getData() ).to.equal( data );
	} );
} );

describe( 'isEditable', function() {
	it( 'should set element.contentEditable (false)', function() {
		element.contentEditable = true;

		editable.isEditable = false;

		// Use toString() because browsers return the string "true" not a boolean. So, just to be sure.
		expect( element.contentEditable.toString() ).to.equal( 'false' );
	} );

	it( 'should set element.contentEditable (true)', function() {
		element.contentEditable = false;

		editable.isEditable = true;

		// Use toString() because browsers return the string "true" not a boolean. So, just to be sure.
		expect( element.contentEditable.toString() ).to.equal( 'true' );
	} );

	it( 'should get the element.contentEditable (false)', function() {
		element.contentEditable = false;

		// Use toString() because browsers return the string "true" not a boolean. So, just to be sure.
		expect( editable.isEditable ).to.be.false();
	} );

	it( 'should get the element.contentEditable (true)', function() {
		element.contentEditable = true;

		// Use toString() because browsers return the string "true" not a boolean. So, just to be sure.
		expect( editable.isEditable ).to.be.true();
	} );
} );
