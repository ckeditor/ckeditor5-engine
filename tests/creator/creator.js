/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

var modules = bender.amd.require( 'creator' );

///////////////////

describe( 'getDataFromElement', () => {
	[ 'textarea', 'template', 'div' ].forEach( ( elementName ) => {
		it( 'should return the content of a ' + elementName, function() {
			var Creator = modules.creator;

			var data = Creator.getDataFromElement( document.getElementById( 'getData-' + elementName ) );
			expect( data ).to.equal( '<b>foo</b>' );
		} );
	} );
} );

describe( 'setDataInElement', () => {
	[ 'textarea', 'template', 'div' ].forEach( ( elementName ) => {
		it( 'should set the content of a ' + elementName, () => {
			var Creator = modules.creator;
			var el = document.createElement( elementName );
			var expectedData = '<b>foo</b>';

			Creator.setDataInElement( el, expectedData );

			var actualData = Creator.getDataFromElement( el );
			expect( actualData ).to.equal( actualData );
		} );
	} );
} );