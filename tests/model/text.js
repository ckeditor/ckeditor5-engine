/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: model */

import Text from '/ckeditor5/engine/model/text.js';
import Node from '/ckeditor5/engine/model/node.js';
import { jsonParseStringify } from '/tests/engine/model/_utils/utils.js';

describe( 'Text', () => {
	describe( 'constructor', () => {
		it( 'should create text node without attributes', () => {
			let text = new Text( 'bar', { bold: true } );

			expect( text ).to.be.instanceof( Node );
			expect( text ).to.have.property( 'data' ).that.equals( 'bar' );
			expect( Array.from( text.getAttributes() ) ).to.deep.equal( [ [ 'bold', true ] ] );
		} );

		it( 'should create empty text object', () => {
			let empty1 = new Text();
			let empty2 = new Text( '' );

			expect( empty1.data ).to.equal( '' );
			expect( empty2.data ).to.equal( '' );
		} );
	} );

	describe( 'offsetSize', () => {
		it( 'should be equal to the number of characters in text node', () => {
			expect( new Text( '' ).offsetSize ).to.equal( 0 );
			expect( new Text( 'abc' ).offsetSize ).to.equal( 3 );
		} );
	} );

	describe( 'clone', () => {
		it( 'should return a new Text instance, with data and attributes equal to cloned text node', () => {
			let text = new Text( 'foo', { bold: true } );
			let copy = text.clone();

			expect( copy.data ).to.equal( 'foo' );
			expect( Array.from( copy.getAttributes() ) ).to.deep.equal( [ [ 'bold', true ] ] );
		} );
	} );

	describe( 'toJSON', () => {
		it( 'should serialize text node', () => {
			let text = new Text( 'foo', { bold: true } );

			expect( jsonParseStringify( text ) ).to.deep.equal( {
				attributes: [ [ 'bold', true ] ],
				data: 'foo'
			} );
		} );
	} );

	describe( 'fromJSON', () => {
		it( 'should create text node', () => {
			let text = new Text( 'foo', { bold: true } );

			let serialized = jsonParseStringify( text );
			let deserialized = Text.fromJSON( serialized );

			expect( deserialized.data ).to.equal( 'foo' );
			expect( Array.from( deserialized.getAttributes() ) ).to.deep.equal( [ [ 'bold', true ] ] );
		} );
	} );

	// All characters, code points, combined symbols, etc. can be looked up in browsers console to better understand what is going on.
	describe( 'unicode support', () => {
		it( 'should normalize strings kept in data', () => {
			// This is a letter "n" with so-called combining mark, similar to ~, which code point is \u0303.
			// Those two characters together combines to "ñ", but that character already has it's code point: \u00F1.
			let dataCombined = '\u006E\u0303';
			let textN = new Text( dataCombined );

			expect( textN.data ).to.equal( '\u00F1' ); // "ñ" got normalized to \u00F1.
			expect( textN.data.length ).to.equal( 1 ); // It is now just one character.
			expect( textN.offsetSize ).to.equal( 1 ); // And has correct offset size.
		} );

		it( 'should count surrogate pairs as on character', () => {
			// Those two unicode symbols make up one character, popular "pile of poo".
			// They are called "surrogate pairs" because both those character alone does not have any meaning,
			// only together they combine into a special character. It's because "pile of poo's" unicode code point
			// is U+1F4A9. It's has more than 4 digits, and has to be combined of two unicode characters.
			let textPoo = new Text( '\uD83D\uDCA9' );

			expect( textPoo.data ).to.equal( '\uD83D\uDCA9' ); // Nothing changed here, no normalization.
			expect( textPoo.data.length ).to.equal( 2 ); // Nothing changed, data string has two characters.
			expect( textPoo.offsetSize ).to.equal( 1 ); // But it should be seen just as one symbol.
		} );

		it( 'should count base symbol + combining mark as one symbol even if not normalized', () => {
			// This is letter q with two combining marks - combining dot below and combining dot above.
			// Together, they form one symbol, letter q with dots below and above it. However, such symbol
			// does not have its normalized code point. Still, it is seen as one symbol. There are many symbols in
			// different languages that are valid in those languages but are made up of multiple combined characters.
			// Users of those languages see them as one atomic parts, and they should be represented like this.
			// Note: even though the symbol is not normalized to one point, normalization may change the order
			// of combining marks. For example: 'q\u0307\u0323'.normalize() === 'q\u0323\u0307'.
			let textQ = new Text( 'q\u0323\u0307' );

			expect( textQ.data ).to.equal( 'q\u0323\u0307' ); // Nothing changed here, no normalization.
			expect( textQ.data.length ).to.equal( 3 );
			expect( textQ.offsetSize ).to.equal( 1 ); // Combined symbol is seen as one.
		} );

		it( 'should correctly count whole words combined of base symbols and combining marks', () => {
			// Now, we will learn Tamil language. நிலைக்கு apparently means "Restoring".
			// This word is made up of four base symbols and four combining marks: "ந", "ி", "ல", "ை", "க", "்", "க", "ு".
			let textHamil = new Text( 'நிலைக்கு' );

			expect( textHamil.data.length ).to.equal( 8 );
			expect( textHamil.offsetSize ).to.equal( 4 );
		} );

		it( 'should be properly serialized and de-serialized', () => {
			let textQ = new Text( 'நி' );
			let json = jsonParseStringify( textQ );

			expect( json ).to.deep.equal( {
				data: 'நி'
			} );

			let deserialized = Text.fromJSON( json );

			expect( deserialized.data ).to.equal( 'நி' );
			expect( deserialized.offsetSize ).to.equal( 1 );
		} );

		it( 'should return correct extracted parts of data', () => {
			let textHamil = new Text( 'நிலைக்கு' );

			expect( textHamil.getSymbols( 0 ) ).to.equal( 'நி' );
			expect( textHamil.getSymbols( 1 ) ).to.equal( 'லை' );
			expect( textHamil.getSymbols( 2 ) ).to.equal( 'க்' );
			expect( textHamil.getSymbols( 3 ) ).to.equal( 'கு' );

			expect( textHamil.getSymbols( 0, 2 ) ).to.equal( 'நிலை' );
			expect( textHamil.getSymbols( 0, 3 ) ).to.equal( 'நிலைக்' );
			expect( textHamil.getSymbols( 0, 4 ) ).to.equal( 'நிலைக்கு' );

			expect( textHamil.getSymbols( 1, 2 ) ).to.equal( 'லைக்' );
			expect( textHamil.getSymbols( 1, 3 ) ).to.equal( 'லைக்கு' );

			expect( textHamil.getSymbols( 2, 2 ) ).to.equal( 'க்கு' );
		} );
	} );
} );
