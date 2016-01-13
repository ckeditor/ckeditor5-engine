/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: treemodel */

'use strict';

const modules = bender.amd.require(
	'core/treemodel/text',
	'core/treemodel/attribute',
	'core/treemodel/attributelist'
);

describe( 'Text', () => {
	describe( 'constructor', () => {
		it( 'should create character without attributes', () => {
			const Text = modules[ 'core/treemodel/text' ];
			const Attribute = modules[ 'core/treemodel/attribute' ];
			const AttributeList = modules[ 'core/treemodel/attributelist' ];

			let attrs = [ new Attribute( 'bold', true ) ];
			let text = new Text( 'bar', attrs );

			expect( text ).to.have.property( 'text' ).that.equals( 'bar' );
			expect( text ).to.have.property( 'attrs' ).that.is.instanceof( AttributeList );
			expect( Array.from( text.attrs ) ).to.deep.equal( attrs );
		} );
	} );
} );
