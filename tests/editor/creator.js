/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, beforeEach, sinon, document */

'use strict';

var modules = bender.amd.require( 'editor', 'editorconfig', 'plugin', 'promise' );

var editor;
var element;

var creator, creator2;

beforeEach( function() {
	// Creator mocks.
	creator = sinon.spy();
	creator.prototype.create = sinon.spy();
	creator.prototype.destroy = sinon.spy();

	creator2 = sinon.spy();
	creator2.prototype.create = sinon.spy();

	return initEditor( {
		plugins: 'testcreator'
	} );
} );

function initEditor( config ) {
	var Editor = modules.editor;

	element = document.createElement( 'div' );
	document.body.appendChild( element );

	editor = new Editor();

	editor.config.set( config );

	return editor.init();
}

CKEDITOR.define( 'plugin!testcreator', [ 'plugin' ], function( Plugin ) {
	return Plugin.extend( {
		init: function() {
			this.editor.addCreator( 'test', creator );
		}
	} );
} );

CKEDITOR.define( 'plugin!testcreator2', [ 'plugin' ], function( Plugin ) {
	return Plugin.extend( {
		init: function() {
			this.editor.addCreator( 'test2', creator2 );
		}
	} );
} );

///////////////////

describe( 'init', function() {
	it( 'should instantiate the creator and call create()', function() {
		// The creator constructor has been called.
		sinon.assert.calledOnce( creator );
		sinon.assert.calledWith( creator, editor );

		// The create method has been called.
		sinon.assert.calledOnce( creator.prototype.create );
	} );

	it( 'should instantiate any creator when more than one is available', function() {
		initEditor( {
			plugins: 'testcreator,testcreator2'
		} );

		expect( ( creator.called && creator2.callCount === 0 ) || ( creator2.called && creator.callCount === 0 ) )
			.to.be.true();
	} );

	it( 'should throw error is the creator doesn\'t exist', function() {
		var initPromise = initEditor( {
			creator: 'bad',
			plugins: 'testcreator'
		} );

		return initPromise.catch( function( error ) {
			expect( error ).to.be.an.instanceof( Error );
		} );
	} );
} );

describe( 'destroy', function() {
	it( 'should call "destroy" on the creator', function() {
		return editor.destroy().then( function() {
			sinon.assert.calledOnce( creator.prototype.destroy );
		} );
	} );
} );
