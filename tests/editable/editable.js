/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, document, sinon */

'use strict';

var modules = bender.amd.require( 'editable', 'editablecollection', 'config' );

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

	it( 'should set the `view` property', function() {
		expect( 'view' in editable ).to.be.true();
	} );

	it( 'should set the `config` property', function() {
		var Config = modules.config;

		expect( editable ).to.have.property( 'config' ).to.be.an.instanceof( Config );
	} );

	it( 'should set the `editables` property', function() {
		var EditableCollection = modules.editablecollection;

		expect( editable ).to.have.property( 'editables' ).to.be.an.instanceof( EditableCollection );
		expect( editable.editables ).to.have.length( 0 );
	} );

	it( 'should accept an Editable instance as parameter', function() {
		var Editable = modules.editable;

		var newEditable = new Editable( editable );

		expect( newEditable ).to.equal( editable );
	} );
} );

describe( 'init', function() {
	it( 'should set the editable view', function() {
		return editable.init().then( function() {
			expect( editable.view ).to.equal( element );
		} );
	} );

	it( 'should call init on children', function() {
		var Editable = modules.editable;

		var childElement = document.createElement( 'div' );
		document.body.appendChild( childElement );

		var child = new Editable( childElement );
		var spy = sinon.spy( child, 'init' );

		editable.editables.add( child );

		return editable.init().then( function() {
			sinon.assert.called( spy );
		} );
	} );

	it( 'should make the element editable', function() {
		return editable.init().then( function() {
			// Use toString() because browsers return the string "true" not a boolean. So, just to be sure.
			expect( element.contentEditable.toString() ).to.equal( 'true' );
		} );
	} );
} );

describe( 'setData', function() {
	it( 'should set the element innerHTML', function() {
		var data = 'TEST';

		return editable.setData( data ).then( function() {
			expect( element.innerHTML ).to.equal( data );
		} );
	} );

	it( 'should set the view innerHTML after init()', function() {
		var data = 'TEST';

		var viewElement = document.createElement( 'div' );
		document.body.appendChild( viewElement );

		editable.view = viewElement;

		return editable.init()
			.then( function() {
				return editable.setData( data );
			} )
			.then( function() {
				expect( viewElement.innerHTML ).to.equal( data );
			} );
	} );
} );

describe( 'getData', function() {
	it( 'should get the element innerHTML', function() {
		var data = 'TEST';

		element.innerHTML = data;

		expect( editable.getData() ).to.equal( data );
	} );

	it( 'should get the view innerHTML after init()', function() {
		var data = 'TEST';

		var viewElement = document.createElement( 'div' );
		viewElement.innerHTML = data;
		document.body.appendChild( viewElement );

		editable.view = viewElement;

		return editable.init()
			.then( function() {
				expect( editable.getData() ).to.equal( data );
			} );
	} );

	it( 'should get the element "value" if it is a textarea', function() {
		var Editable = modules.editable;

		var data = 'TEST';

		var textarea = document.createElement( 'textarea' );
		textarea.value = data;
		document.body.appendChild( textarea );

		editable = new Editable( textarea );

		expect( editable.getData() ).to.equal( data );
	} );
} );

describe( 'parent', function() {
	it( 'should get the parent', function() {
		var Editable = modules.editable;

		var parent = new Editable( document.body.appendChild( document.createElement( 'div' ) ) );

		editable.parent = parent;

		expect( editable.parent ).to.equal( parent );
	} );

	it( 'should set config.parent', function() {
		var Editable = modules.editable;

		var parent = new Editable( document.body.appendChild( document.createElement( 'div' ) ) );

		editable.parent = parent;

		expect( editable.config.parent ).to.equal( parent.config );
	} );
} );

describe( 'isEditable (before init())', function() {
	it( 'should do nothing on set', function() {
		element.contentEditable = true;

		editable.isEditable = false;

		// Use toString() because browsers return the string "true" not a boolean. So, just to be sure.
		expect( element.contentEditable.toString() ).to.equal( 'true' );
	} );

	it( 'should get `false` always', function() {
		element.contentEditable = true;

		// Use toString() because browsers return the string "true" not a boolean. So, just to be sure.
		expect( editable.isEditable ).to.be.false();
	} );
} );

describe( 'isEditable (after init())', function() {
	beforeEach( function() {
		return editable.init();
	} );

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
