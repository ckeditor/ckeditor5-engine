/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, sinon, document */

'use strict';

var modules = bender.amd.require( 'editor', 'editorconfig', 'editable', 'promise' );

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

	it( 'should set the element.data by default', function() {
		var data = '<p>Another test</p>';

		return editor.setData( data ).then( function() {
			expect( element.innerHTML ).to.equal( data );
		} );
	} );

	it( 'should set the element.data by default (textarea)', function() {
		var Editor = modules.editor;

		var data = '<p>Textarea test</p>';

		element = document.createElement( 'textarea' );
		document.body.appendChild( element );

		editor = new Editor( element );

		return editor.setData( data ).then( function() {
			expect( element.value ).to.equal( data );
		} );
	} );

	it( 'should set the editor data even before init', function() {
		var data = '<p>Another test</p>';

		return editor.setData( data ).then( function() {
			return editor.init().then( function() {
				expect( editor.getData() ).to.equal( data );
			} );
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

	it( 'should get the element data by default', function() {
		return editor.init().then( function() {
			expect( editor.getData() ).to.equal( elementInnerHTML );
		} );
	} );

	it( 'should get the element data by default (textarea)', function() {
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
} );

describe( 'editable', function() {
	it( 'should be strictly readonly', function() {
		function test() {
			editor.editable = 'x';
		}

		expect( test ).to.throw( TypeError );
	} );

	it( 'should be kept strictly readonly after setEditable', function() {
		editor.setEditable( element );

		function test() {
			editor.editable = 'x';
		}

		expect( test ).to.throw( TypeError );
	} );
} );

describe( 'setEditable', function() {
	it( 'should accept DOM node', function() {
		var Editable = modules.editable;

		var el = document.createElement( 'div' );

		return editor.setEditable( el ).then( function() {
			expect( editor.editable ).to.be.an.instanceof( Editable );
			expect( editor.editable.element ).to.equal( el );
		} );
	} );

	it( 'should accept Editable instances', function() {
		var Editable = modules.editable;

		var el = document.createElement( 'div' );
		var editable = new Editable( el );

		return editor.setEditable( editable ).then( function() {
			expect( editor.editable ).to.equal( editable );
			expect( editor.editable.element ).to.equal( el );
		} );
	} );

	it( 'should do nothing if the same Editable instance is passed twice', function() {
		var Editable = modules.editable;

		var el = document.createElement( 'div' );
		var editable = new Editable( el );

		return editor.setEditable( editable ).then( function() {
			editor.getData = sinon.spy();

			editor.setEditable( editable ).then( function() {
				sinon.assert.notCalled( editor.getData );
			} );
		} );
	} );

	it( 'should update the editable with the editior data', function() {
		var el = document.createElement( 'div' );

		editor.setEditable( el );

		expect( editor.editable.getData() ).to.equal( elementInnerHTML );
	} );

	it( 'should proxy editor.getData() to editable.getData()', function() {
		editor.setEditable( element );

		editor.editable.getData = function() {
			return 'TEST';
		};

		expect( editor.getData() ).to.equal( 'TEST' );
	} );

	it( 'should proxy editor.setData() to editable.setData()', function() {
		editor.setEditable( element );

		editor.editable.setData = sinon.spy();

		editor.setData( 'TEST' );

		sinon.assert.calledWithExactly( editor.editable.setData, 'TEST' );
	} );
} );
