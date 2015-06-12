/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals describe, it, expect, bender */

'use strict';

var modules = bender.amd.require( 'mixin' );

describe( 'Mixin', function() {
	it( 'should expose all properties', function() {
		var Mixin = modules.mixin;

		var source = new Mixin( {
			a: 1,
			b: 'test',
			c: function() {
				return 'ok';
			}
		} );

		expect( source ).to.have.property( 'a' ).to.equal( 1 );
		expect( source ).to.have.property( 'b' ).to.equal( 'test' );
		expect( source ).to.have.property( 'c' ).to.be.a( 'function' );
		expect( source.c() ).to.equal( 'ok' );
	} );

	it( 'should copy all properties to the target', function() {
		var Mixin = modules.mixin;

		var source = new Mixin( {
			a: 1,
			b: 'test',
			c: function() {
				return 'ok';
			}
		} );

		var target = { custom: 1 };

		source.mixin( target );

		expect( target ).to.have.property( 'a' ).to.equal( 1 );
		expect( target ).to.have.property( 'b' ).to.equal( 'test' );
		expect( target ).to.have.property( 'c' ).to.be.a( 'function' );
		expect( target.c() ).to.equal( 'ok' );
		expect( target ).to.have.property( 'custom' ).to.equal( 1 );
	} );

	it( 'should not copy the `mixin` method', function() {
		var Mixin = modules.mixin;

		var source = new Mixin( { a: 1 } );

		var target = {};

		source.mixin( target );

		expect( target ).to.not.have.property( 'mixin' );
	} );
} );
