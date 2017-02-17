/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import Range from '../model/range';
import Element from '../model/element';
import TextProxy from '../model/textproxy';
import Document from '../model/document';
import TreeWalker from '../model/treewalker';

export default function graphicalModelRepresentation( document ) {
	if ( !( document instanceof Document ) ) {
		throw new Error( 'Given document should be an instance of Engine.Model.Document.' );
	}

	const debugRootElement = makeElement( 'div', { classList: 'ck-editor__code' } );

	window.document.body.appendChild( debugRootElement );

	drawTree();

	document.on( 'change', () => {
		drawTree();
	} );

	function drawTree() {
		const documentRoot = document.getRoot();

		while ( debugRootElement.firstChild ) {
			debugRootElement.removeChild( debugRootElement.firstChild );
		}

		const rootList = makeElement( 'ol' );
		const openRoot = makeElement( 'li', { classList: 'ck-editor__code-line' } );
		const closeRoot = openRoot.cloneNode( true );
		const openSpanRoot = makeElement( 'span', { classList: 'ck-editor__element' } );
		const closeSpanRoot = openSpanRoot.cloneNode( true );

		// Prepare the $root labels.
		openSpanRoot.appendChild( new Text( '<$root>' ) );
		closeSpanRoot.appendChild( new Text( '</$root>' ) );

		// Prepare the $root elements.
		openRoot.appendChild( openSpanRoot );
		closeRoot.appendChild( closeSpanRoot );

		// Append $root elements to the list.
		rootList.appendChild( openRoot );
		rootList.appendChild( closeRoot );

		let indent = 1;

		const treeWalker = new TreeWalker( {
			boundaries: Range.createIn( documentRoot )
		} );

		for ( const treeItem of treeWalker ) {
			const listElement = makeElement( 'li', { classList: 'ck-editor__code-line' } );

			// Decrease the indent if element is closing the block.
			if ( treeItem.type === 'elementEnd' ) {
				indent -= 1;
			}

			const itemValue = makeElement( 'span' );
			let elementName;
			let elementContent;

			if ( treeItem.item instanceof Element ) {
				itemValue.classList.add( 'ck-editor__element' );
				elementName = treeItem.item.name;

				// Add attribute labels for opening block element.
				if ( treeItem.type === 'elementStart' ) {
					createAttributeLabels( treeItem.item.getAttributes(), listElement );
				}

				if ( treeItem.type === 'elementStart' ) {
					elementContent = '<' + elementName + '>';
				} else {
					elementContent = '</' + elementName + '>';
				}
			} else if ( treeItem.item instanceof TextProxy ) {
				itemValue.classList.add( 'ck-editor__text' );

				elementName = '$text';
				elementContent = treeItem.item.data;

				// Add attribute labels for $text element.
				createAttributeLabels( treeItem.item.getAttributes(), listElement );
			}

			// Prepare name or content for given model element.
			itemValue.appendChild( new Text( elementContent ) );

			// Append element to the list.
			listElement.insertBefore( itemValue, listElement.firstChild );
			listElement.insertBefore( new Text( ' '.repeat( 4 * indent ) ), itemValue );

			rootList.insertBefore( listElement, rootList.lastChild );

			// Increase the indent if element is opening the block.
			if ( treeItem.type === 'elementStart' ) {
				indent += 1;
			}
		}

		debugRootElement.appendChild( rootList );
	}
}

/**
 * @param {String} elementName Name of HTML element that will be created.
 * @param {Object} parameters Additional parameters of created element.
 * @param {String|Array} parameters.classList
 * @returns {Element}
 */
function makeElement( elementName, parameters = {} ) {
	const element = window.document.createElement( elementName );

	if ( parameters.classList ) {
		if ( Array.isArray( parameters.classList ) ) {
			element.classList.add( ...parameters.classList );
		} else {
			element.classList.add( parameters.classList );
		}
	}

	return element;
}

/**
 * @param {Map} attributes Map with element's attributes.
 * @param {HTMLElement} listElement Graphical representation of the model entry.
 */
function createAttributeLabels( attributes, listElement ) {
	for ( let [ attr, value ] of attributes ) {
		const attributeSpan = makeElement( 'span', {
			classList: [
				'ck-editor__text-badge',
				`ck-editor__text-badge--${ attr }`
			]
		} );

		attributeSpan.appendChild( new Text( `${ attr }:${ value }` ) );
		listElement.appendChild( attributeSpan );
	}
}
