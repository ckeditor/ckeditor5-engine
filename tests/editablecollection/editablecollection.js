/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, before, document */

'use strict';

var modules = bender.amd.require( 'editablecollection', 'editable' );

var EditableCollection;
var Editable;

before( function() {
	EditableCollection = modules.editablecollection;
	Editable = modules.editable;
} );

describe( 'current', function() {
	it( 'should point to the first available editable by default', function() {
		var el = document.createElement( 'div' );

		var editables = new EditableCollection();

		editables.add( el );

		expect( editables.current ).to.equal( editables.get( 0 ) );
	} );

	it( 'should return the editable that has been set', function() {
		var editables = new EditableCollection();

		editables.add( document.createElement( 'div' ) );
		editables.add( document.createElement( 'div' ) );

		editables.current = editables.get( 1 );

		expect( editables.current ).to.equal( editables.get( 1 ) );
	} );

	it( 'should point to the first available editable if it has been set to `null`', function() {
		var editables = new EditableCollection();

		editables.add( document.createElement( 'div' ) );
		editables.add( document.createElement( 'div' ) );

		editables.current = editables.get( 1 );
		editables.current = null;

		expect( editables.current ).to.equal( editables.get( 0 ) );
	} );

	it( 'should return `null` if not editable is available', function() {
		var editables = new EditableCollection();

		expect( editables.current ).to.be.null();
	} );
} );

describe( 'add', function() {
	it( 'should accept DOM node', function() {
		var el = document.createElement( 'div' );

		var editables = new EditableCollection();

		editables.add( el );

		expect( editables.get( 0 ) ).to.be.an.instanceof( Editable );
		expect( editables.get( 0 ).element ).to.equal( el );
	} );

	it( 'should accept Editable instances', function() {
		var el = document.createElement( 'div' );

		var editables = new EditableCollection();
		var editable = new Editable( el );

		editables.add( editable );

		expect( editables.get( 0 ) ).to.equal( editable );
		expect( editables.get( 0 ).element ).to.equal( el );
	} );
} );
