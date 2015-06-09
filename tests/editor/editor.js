/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, sinon, document */

'use strict';

var modules = bender.amd.require( 'editor', 'editorconfig', 'plugincollection', 'editable', 'editablecollection',
	'promise' );

var editor;
var element;
var elementInnerHTML = '<p>Test</p>';

beforeEach( function() {
	var Editor = modules.editor;

	element = document.createElement( 'div' );
	element.innerHTML = elementInnerHTML;
	document.body.appendChild( element );

	editor = new Editor();
	editor.editables.add( element );
} );

describe( 'constructor', function() {
	it( 'should create a new editor instance', function() {
		var Editor = modules.editor;
		expect( editor ).to.be.an.instanceof( Editor );
	} );
} );

describe( 'config', function() {
	it( 'should be an instance of EditorConfig', function() {
		var EditorConfig = modules.editorconfig;

		expect( editor.config ).to.be.an.instanceof( EditorConfig );
	} );
} );

describe( 'plugins', function() {
	it( 'should be an instance of PluginCollection', function() {
		var PluginCollection = modules.plugincollection;

		expect( editor.plugins ).to.be.an.instanceof( PluginCollection );
	} );

	it( 'should be empty', function() {
		expect( editor.plugins.length ).to.be.empty();
	} );
} );

describe( 'editables', function() {
	it( 'should be an instance of EditableCollection', function() {
		var EditableCollection = modules.editablecollection;

		expect( editor ).to.have.property( 'editables' ).to.be.an.instanceof( EditableCollection );
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

	it( 'should call init() on editables', function() {
		var spy = sinon.spy( editor.editables.get( 0 ), 'init' );

		return editor.init( function() {
			sinon.assert.called( spy );
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

	it( 'should set the element.data by default', function() {
		var data = '<p>Another test</p>';

		return editor.setData( data )
			.then( function() {
				expect( element.innerHTML ).to.equal( data );
			} );
	} );

	it( 'should set the element.data by default (textarea)', function() {
		var Editor = modules.editor;

		var data = '<p>Textarea test</p>';

		element = document.createElement( 'textarea' );
		document.body.appendChild( element );

		editor = new Editor();
		editor.editables.add( element );

		return editor.setData( data )
			.then( function() {
				expect( element.value ).to.equal( data );
			} );
	} );

	it( 'should set the editor data even after init', function() {
		var data = '<p>Another test</p>';

		return editor.setData( data )
			.then( function() {
				return editor.init();
			} )
			.then( function() {
				expect( editor.getData() ).to.equal( data );
			} );
	} );
} );

describe( 'getData', function() {
	// This is mostly a dup for one of the `init` tests, but it is here for completness as there are no other useful
	// tests for getData().
	it( 'should get the editor data', function() {
		expect( editor.getData() ).to.equal( elementInnerHTML );
	} );

	it( 'should get the editable element data by default', function() {
		return editor.init()
			.then( function() {
				expect( editor.getData() ).to.equal( elementInnerHTML );
			} );
	} );

	it( 'should get the editable element data by default (textarea)', function() {
		var Editor = modules.editor;

		var data = '<p>Textarea test</p>';

		element = document.createElement( 'textarea' );
		element.value = data;
		document.body.appendChild( element );

		editor = new Editor();
		editor.editables.add( element );

		return editor.init()
			.then( function() {
				expect( editor.getData() ).to.equal( data );
			} );
	} );
} );

describe( 'editables.current', function() {
	it( 'should proxy editor.getData() to editable.getData()', function() {
		editor.editables.current.getData = function() {
			return 'TEST';
		};

		expect( editor.getData() ).to.equal( 'TEST' );
	} );

	it( 'should proxy editor.setData() to editable.setData()', function() {
		editor.editables.current.setData = sinon.spy();

		editor.setData( 'TEST' );

		sinon.assert.calledWithExactly( editor.editables.current.setData, 'TEST' );
	} );
} );
