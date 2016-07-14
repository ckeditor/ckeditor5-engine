/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: view, browser-only */

'use strict';

import {
	brFiller,
	nbspFiller,
	inlineFillerLength,
	inlineFiller,
	startsWithFiller,
	isInlineFiller,
	getDataWithoutFiller,
	isBlockFiller
} from '/ckeditor5/engine/view/filler.js';

describe( 'filler', () => {
	describe( 'inlineFiller', () => {
		it( 'should have length equal inlineFillerLength', () => {
			expect( inlineFiller.length ).to.equal( inlineFillerLength );
		} );
	} );

	describe( 'startsWithFiller', () => {
		it( 'should be true for node which contains only filler', () => {
			const node = document.createTextNode( inlineFiller );

			expect( startsWithFiller( node ) ).to.be.true;
		} );

		it( 'should be true for node which starts with filler', () => {
			const node = document.createTextNode( inlineFiller + 'foo' );

			expect( startsWithFiller( node ) ).to.be.true;
		} );

		it( 'should be false for element', () => {
			const node = document.createElement( 'p' );

			expect( startsWithFiller( node ) ).to.be.false;
		} );

		it( 'should be false which contains filler in the middle', () => {
			const node = document.createTextNode( 'x' + inlineFiller + 'x' );

			expect( startsWithFiller( node ) ).to.be.false;
		} );

		it( 'should be false for the node which does not contains filler', () => {
			const node = document.createTextNode( 'foo' );

			expect( startsWithFiller( node ) ).to.be.false;
		} );

		it( 'should be false for the node which does not contains filler, even if it has the same length', () => {
			let text = '';

			for ( let i = 0; i < inlineFillerLength; i++ ) {
				text += 'x';
			}

			const node = document.createTextNode( text );

			expect( startsWithFiller( node ) ).to.be.false;
		} );
	} );

	describe( 'getDataWithoutFiller', () => {
		it( 'should return data without filler', () => {
			const node = document.createTextNode( inlineFiller + 'foo' );

			const dataWithoutFiller = getDataWithoutFiller( node );

			expect( dataWithoutFiller.length ).to.equals( 3 );
			expect( dataWithoutFiller ).to.equals( 'foo' );
		} );

		it( 'should return the same data for data without filler', () => {
			const node = document.createTextNode( 'foo' );

			const dataWithoutFiller = getDataWithoutFiller( node );

			expect( dataWithoutFiller.length ).to.equals( 3 );
			expect( dataWithoutFiller ).to.equals( 'foo' );
		} );
	} );

	describe( 'isInlineFiller', () => {
		it( 'should be true for inline filler', () => {
			const node = document.createTextNode( inlineFiller );

			expect( isInlineFiller( node ) ).to.be.true;
		} );

		it( 'should be false for element which starts with filler', () => {
			const node = document.createTextNode( inlineFiller + 'foo' );

			expect( isInlineFiller( node ) ).to.be.false;
		} );

		it( 'should be false for the node which does not contains filler, even if it has the same length', () => {
			let text = '';

			for ( let i = 0; i < inlineFillerLength; i++ ) {
				text += 'x';
			}

			const node = document.createTextNode( text );

			expect( isInlineFiller( node ) ).to.be.false;
		} );
	} );

	describe( 'isBlockFiller', () => {
		it( 'should return true if the node is an instance of the BR block filler', () => {
			const brFillerInstance = brFiller( document );

			expect( isBlockFiller( brFillerInstance, brFiller ) ).to.be.true;
			// Check it twice to ensure that caching breaks nothing.
			expect( isBlockFiller( brFillerInstance, brFiller ) ).to.be.true;
		} );

		it( 'should return true if the node is an instance of the NBSP block filler', () => {
			const nbspFillerInstance = nbspFiller( document );

			expect( isBlockFiller( nbspFillerInstance, nbspFiller ) ).to.be.true;
			// Check it twice to ensure that caching breaks nothing.
			expect( isBlockFiller( nbspFillerInstance, nbspFiller ) ).to.be.true;
		} );

		it( 'should return false for inline filler', () => {
			expect( isBlockFiller( document.createTextNode( inlineFiller ), brFiller ) ).to.be.false;
			expect( isBlockFiller( document.createTextNode( inlineFiller ), nbspFiller ) ).to.be.false;
		} );
	} );
} );
