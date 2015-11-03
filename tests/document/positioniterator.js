/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: document */

'use strict';

var modules = bender.amd.require(
	'document/document',
	'document/element',
	'document/character',
	'document/positioniterator',
	'document/position',
	'document/range' );

describe( 'range iterator', function() {
	var Document, Element, Character, PositionIterator, Position, Range;

	var doc, expectedItems, root, img1, paragraph, b, a, r, img2, x;
	var ELEMENT_ENTER, ELEMENT_LEAVE, CHARACTER;

	before( function() {
		Document = modules[ 'document/document' ];
		Element = modules[ 'document/element' ];
		Character = modules[ 'document/character' ];
		PositionIterator = modules[ 'document/positioniterator' ];
		Position = modules[ 'document/position' ];
		Range = modules[ 'document/range' ];

		ELEMENT_ENTER = PositionIterator.ELEMENT_ENTER;
		ELEMENT_LEAVE = PositionIterator.ELEMENT_LEAVE;
		CHARACTER = PositionIterator.CHARACTER;

		doc = new Document();
		root = doc.createRoot( 'root' );

		// root
		//  |- img1
		//  |- p
		//     |- B
		//     |- A
		//     |- R
		//     |
		//     |- img2
		//     |
		//     |- X

		b = new Character( 'b' );
		a = new Character( 'a' );
		r = new Character( 'r' );
		img2 = new Element( 'img2' );
		x = new Character( 'x' );

		paragraph = new Element( 'p', [], [ b, a, r, img2, x ] );
		img1 = new Element( 'img1' );

		root.insertChildren( 0, [ img1, paragraph ] );

		expectedItems = [
				{ type: ELEMENT_ENTER, node: img1 },
				{ type: ELEMENT_LEAVE, node: img1 },
				{ type: ELEMENT_ENTER, node: paragraph },
				{ type: CHARACTER, node: b },
				{ type: CHARACTER, node: a },
				{ type: CHARACTER, node: r },
				{ type: ELEMENT_ENTER, node: img2 },
				{ type: ELEMENT_LEAVE, node: img2 },
				{ type: CHARACTER, node: x },
				{ type: ELEMENT_LEAVE, node: paragraph }
			];
	} );

	it( 'should return next position', function() {
		var iterator = new PositionIterator( new Position( [ 0 ], root ) ); // beginning of root
		var i, len;

		for ( i = 0, len = expectedItems.length; i < len; i++ ) {
			expect( iterator.next() ).to.deep.equal( { done: false, value: expectedItems[ i ] } );
		}
		expect( iterator.next() ).to.have.property( 'done' ).that.is.true;
	} );

	it( 'should return previous position', function() {
		var iterator = new PositionIterator( new Position( [ 2 ], root ) ); // ending of root

		for ( var i = expectedItems.length - 1; i >= 0; i-- ) {
			expect( iterator.previous() ).to.deep.equal( { done: false, value: expectedItems[ i ] } );
		}
		expect( iterator.previous() ).to.have.property( 'done' ).that.is.true;
	} );

	it( 'should return next position in the boundaries', function() {
		var start = new Position( [ 1, 0 ], root ); // p, 0
		var end = new Position( [ 1, 3, 0 ], root ); // img, 0

		var iterator = new PositionIterator( new Range( start, end ) );

		var i, len;

		for ( i = 3, len = expectedItems.length; i < 7; i++ ) {
			expect( iterator.next() ).to.deep.equal( { done: false, value: expectedItems[ i ] } );
		}
		expect( iterator.next() ).to.have.property( 'done' ).that.is.true;
	} );

	it( 'should return previous position in the boundaries', function() {
		var start = new Position( [ 1, 0 ], root ); // p, 0
		var end = new Position( [ 1, 3, 0 ], root ); // img, 0

		var iterator = new PositionIterator( new Range( start, end ), end );

		var i, len;

		for ( i = 6, len = expectedItems.length; i > 2; i-- ) {
			expect( iterator.previous() ).to.deep.equal( { done: false, value: expectedItems[ i ] } );
		}
		expect( iterator.previous() ).to.have.property( 'done' ).that.is.true;
	} );

	it( 'should return iterate over the range', function() {
		var start = new Position( [ 0 ], root ); // begging of root
		var end = new Position( [ 2 ], root ); // ending of root
		var range = new Range( start, end );

		var i = 0;
		var value;

		for ( value of range ) {
			expect( value ).to.deep.equal( expectedItems[ i ] );
			i++;
		}
		expect( i ).to.equal( expectedItems.length );
	} );
} );
