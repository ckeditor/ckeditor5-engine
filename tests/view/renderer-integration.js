/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals document */

import View from '../../src/view/view';
import Position from '../../src/view/position';
import Range from '../../src/view/range';

import createRoot from './_utils/createRoot';
import { parse } from '../../src/dev-utils/view';

describe( 'Renderer\'s integration', () => {
	let view, domRoot, viewRoot;

	beforeEach( () => {
		view = new View();
		viewRoot = createRoot( view.document );
		domRoot = document.createElement( 'div' );
		view.attachDomRoot( domRoot );
	} );

	// #1451
	// <ul><li1>Foo</li1><li2><b>Bar</b></li2></ul>
	// ->
	// <ul><li1>Foo<ul><li2><b>Bar</b><i>Baz</i></li2></ul></li1></ul>
	it( 'renders changes made in detached elements', () => {
		const ul = parse(
			'<container:ul>' +
				'<container:li>Foo</container:li>' +
				'<container:li><attribute:b>Bar</attribute:b>Baz</container:li>' +
			'</container:ul>' );

		// Render the initial content.
		view.change( writer => {
			writer.insert( Position.createAt( viewRoot ), ul );
		} );

		// Make some changes in a detached elements (li1, li2).
		view.change( writer => {
			const li1 = ul.getChild( 0 );
			const li2 = ul.getChild( 1 );

			writer.remove( Range.createIn( ul ) );

			const innerUl = writer.createContainerElement( 'ul' );

			writer.insert( Position.createAt( innerUl ), li2 );
			writer.insert( Position.createAt( li1, 'end' ), innerUl );

			const i = writer.createAttributeElement( 'i' );

			writer.wrap( Range.createFromParentsAndOffsets( li2, 1, li2, 2 ), i );

			writer.insert( Position.createAt( ul ), li1 );
		} );

		expect( domRoot.innerHTML ).to.equal( '<ul><li>Foo<ul><li><b>Bar</b><i>Baz</i></li></ul></li></ul>' );
	} );
} );
