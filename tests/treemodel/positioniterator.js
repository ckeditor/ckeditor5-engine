/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: treemodel */

'use strict';

const modules = bender.amd.require(
	'core/treemodel/document',
	'core/treemodel/attribute',
	'core/treemodel/element',
	'core/treemodel/character',
	'core/treemodel/text',
	'core/treemodel/positioniterator',
	'core/treemodel/position',
	'core/treemodel/range'
);

describe( 'range iterator', () => {
	let Document, Attribute, Element, Character, Text, PositionIterator, Position, Range;
	let ELEMENT_ENTER, ELEMENT_LEAVE, CHARACTER, TEXT;

	let doc, expectedItems, expectedItemsMerged, root, img1, paragraph, b, a, r, img2, x;

	before( () => {
		Document = modules[ 'core/treemodel/document' ];
		Attribute = modules[ 'core/treemodel/attribute' ];
		Element = modules[ 'core/treemodel/element' ];
		Character = modules[ 'core/treemodel/character' ];
		Text = modules[ 'core/treemodel/text' ];
		PositionIterator = modules[ 'core/treemodel/positioniterator' ];
		Position = modules[ 'core/treemodel/position' ];
		Range = modules[ 'core/treemodel/range' ];

		ELEMENT_ENTER = PositionIterator.ELEMENT_ENTER;
		ELEMENT_LEAVE = PositionIterator.ELEMENT_LEAVE;
		CHARACTER = PositionIterator.CHARACTER;
		TEXT = PositionIterator.TEXT;

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

		let attrBoldTrue = new Attribute( 'bold', true );

		b = new Character( 'b', [ attrBoldTrue ] );
		a = new Character( 'a', [ attrBoldTrue ] );
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

		expectedItemsMerged = [
			{ type: ELEMENT_ENTER, node: img1 },
			{ type: ELEMENT_LEAVE, node: img1 },
			{ type: ELEMENT_ENTER, node: paragraph },
			{ type: TEXT, node: new Text( 'ba', [ attrBoldTrue ] ) },
			{ type: TEXT, node: new Text( 'r' ) },
			{ type: ELEMENT_ENTER, node: img2 },
			{ type: ELEMENT_LEAVE, node: img2 },
			{ type: TEXT, node: new Text( 'x' ) },
			{ type: ELEMENT_LEAVE, node: paragraph }
		];
	} );

	it( 'should return next position', () => {
		let iterator = new PositionIterator( new Position( root, [ 0 ] ) ); // beginning of root
		let i, len;

		for ( i = 0, len = expectedItems.length; i < len; i++ ) {
			expect( iterator.next() ).to.deep.equal( { done: false, value: expectedItems[ i ] } );
		}
		expect( iterator.next() ).to.have.property( 'done' ).that.is.true;
	} );

	it( 'should return previous position', () => {
		let iterator = new PositionIterator( new Position( root, [ 2 ] ) ); // ending of root

		for ( let i = expectedItems.length - 1; i >= 0; i-- ) {
			expect( iterator.previous() ).to.deep.equal( { done: false, value: expectedItems[ i ] } );
		}
		expect( iterator.previous() ).to.have.property( 'done' ).that.is.true;
	} );

	it( 'should return next position in the boundaries', () => {
		let start = new Position( root, [ 1, 0 ] ); // p, 0
		let end = new Position( root, [ 1, 3, 0 ] ); // img, 0

		let iterator = new PositionIterator( new Range( start, end ) );

		let i, len;

		for ( i = 3, len = expectedItems.length; i < 7; i++ ) {
			expect( iterator.next() ).to.deep.equal( { done: false, value: expectedItems[ i ] } );
		}
		expect( iterator.next() ).to.have.property( 'done' ).that.is.true;
	} );

	it( 'should return previous position in the boundaries', () => {
		let start = new Position( root, [ 1, 0 ] ); // p, 0
		let end = new Position( root, [ 1, 3, 0 ] ); // img, 0

		let iterator = new PositionIterator( new Range( start, end ), end );

		let i, len;

		for ( i = 6, len = expectedItems.length; i > 2; i-- ) {
			expect( iterator.previous() ).to.deep.equal( { done: false, value: expectedItems[ i ] } );
		}
		expect( iterator.previous() ).to.have.property( 'done' ).that.is.true;
	} );

	it( 'should return iterate over the range', () => {
		let start = new Position( root, [ 0 ] ); // beginning of root
		let end = new Position( root, [ 2 ] ); // ending of root
		let range = new Range( start, end );

		let i = 0;

		for ( let value of range ) {
			expect( value ).to.deep.equal( expectedItems[ i ] );
			i++;
		}
		expect( i ).to.equal( expectedItems.length );
	} );

	it( 'should merge characters when iterating over the range using next', () => {
		let start = new Position( root, [ 0 ] ); // beginning of root
		let end = new Position( root, [ 2 ] ); // ending of root
		let range = new Range( start, end );

		let iterator = new PositionIterator( range, range.start, true );
		let step = iterator.next();
		let i = 0;

		while ( !step.done ) {
			expect( step.value ).to.deep.equal( expectedItemsMerged[ i ] );
			step = iterator.next();
			i++;
		}

		expect( i ).to.equal( expectedItemsMerged.length );
	} );

	it( 'should merge characters when iterating over the range using previous', () => {
		let start = new Position( root, [ 0 ] ); // beginning of root
		let end = new Position( root, [ 2 ] ); // ending of root
		let range = new Range( start, end );

		let iterator = new PositionIterator( range, range.end, true );
		let step = iterator.previous();
		let i = expectedItemsMerged.length;

		while ( !step.done ) {
			i--;
			expect( step.value ).to.deep.equal( expectedItemsMerged[ i ] );
			step = iterator.previous();
		}

		expect( i ).to.equal( 0 );
	} );
} );
