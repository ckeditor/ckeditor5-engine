/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: view */

import Node from '/ckeditor5/engine/view/node.js';
import Text from '/ckeditor5/engine/view/text.js';

describe( 'Element', () => {
	describe( 'constructor', () => {
		it( 'should create element without attributes', () => {
			const text = new Text( 'foo' );

			expect( text ).to.be.an.instanceof( Node );
			expect( text.data ).to.equal( 'foo' );
			expect( text ).to.have.property( 'parent' ).that.is.null;
		} );
	} );

	describe( 'clone', () => {
		it( 'should return new text with same data', () => {
			const text = new Text( 'foo bar' );
			const clone = text.clone();

			expect( clone ).to.not.equal( text );
			expect( clone.data ).to.equal( text.data );
		} );
	} );

	describe( 'isSimilar', () => {
		const text = new Text( 'foo' );

		it( 'should return false when comparing to non-text', () => {
			expect( text.isSimilar( null ) ).to.be.false;
			expect( text.isSimilar( {} ) ).to.be.false;
		} );

		it( 'should return true when the same text node is provided', () => {
			expect( text.isSimilar( text ) ).to.be.true;
		} );

		it( 'sould return true when data is the same', () => {
			const other = new Text( 'foo' );

			expect( text.isSimilar( other ) ).to.be.true;
		} );

		it( 'sould return false when data is not the same', () => {
			const other = text.clone();
			other.data = 'not-foo';

			expect( text.isSimilar( other ) ).to.be.false;
		} );
	} );

	describe( 'setText', () => {
		it( 'should change the text', () => {
			const text = new Text( 'foo' );
			text.data = 'bar';

			expect( text.data ).to.equal( 'bar' );
		} );
	} );

	// This is same set of tests as in engine.model.Text tests. Look there for comments on tests.
	describe( 'unicode support', () => {
		it( 'should normalize strings kept in data', () => {
			let dataCombined = '\u006E\u0303';
			let textN = new Text( dataCombined );

			expect( textN.data ).to.equal( '\u00F1' );
			expect( textN.data.length ).to.equal( 1 );
			expect( textN.size ).to.equal( 1 );
		} );

		it( 'should count surrogate pairs as on character', () => {
			let textPoo = new Text( '\uD83D\uDCA9' );

			expect( textPoo.data ).to.equal( '\uD83D\uDCA9' );
			expect( textPoo.data.length ).to.equal( 2 );
			expect( textPoo.size ).to.equal( 1 );
		} );

		it( 'should count base symbol + combining mark as one symbol even if not normalized', () => {
			let textQ = new Text( 'q\u0323\u0307' );

			expect( textQ.data ).to.equal( 'q\u0323\u0307' );
			expect( textQ.data.length ).to.equal( 3 );
			expect( textQ.size ).to.equal( 1 );
		} );

		it( 'should correctly count whole words combined of base symbols and combining marks', () => {
			let textHamil = new Text( 'நிலைக்கு' );

			expect( textHamil.data.length ).to.equal( 8 );
			expect( textHamil.size ).to.equal( 4 );
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
