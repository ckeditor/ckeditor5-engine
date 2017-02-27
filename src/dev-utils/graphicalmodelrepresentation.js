/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* global: window, document */

import { getData } from './model';

export default function graphicalModelRepresentation( editor ) {
	const debugRootElement = makeElement( 'div', { classList: 'ck-editor__code' } );
	window.document.body.appendChild( debugRootElement );

	drawTree();

	editor.document.on( 'changesDone', () => {
		drawTree();
	} );

	function drawTree() {
		// Clear the debug element.
		while ( debugRootElement.firstChild ) {
			debugRootElement.removeChild( debugRootElement.firstChild );
		}

		// Prepare new list.
		const rootList = makeElement( 'ol' );
		prepareTreeElement( rootList );
		debugRootElement.appendChild( rootList );

		const editorData = getData( editor.document, { validXML: true } );
		const documentAsXml = new DOMParser().parseFromString( `<root>${ editorData }</root>`, 'text/xml' );
		const tree = window.document.createTreeWalker( documentAsXml );
		let lastElementName;
		let indent = 0;

		while ( tree.nextNode() ) {
			const currentNode = tree.currentNode;

			if ( !isElement( currentNode ) && !isText( currentNode ) ) {
				continue;
			}

			if ( isElement( currentNode ) ) {
				const currentElementName = getElementName( currentNode );

				// Does not parse root element. It has done manually.
				if ( currentElementName === '$root' ) {
					continue;
				}

				if ( lastElementName ) {
					closePreviousElement();
				} else {
					indent += 1;
				}

				lastElementName = currentElementName;

				const listElement = makeElement( 'li', { classList: 'ck-editor__code-line' } );
				const elementLabel = makeElement( 'span', { classList: 'ck-editor__element' } );

				elementLabel.appendChild( new window.Text( `<${ currentElementName }>` ) );
				listElement.appendChild( getIndent() );
				listElement.appendChild( elementLabel );
				rootList.insertBefore( listElement, rootList.lastChild );
			} else {
				const listElement = makeElement( 'li', { classList: 'ck-editor__code-line' } );
				const elementLabel = makeElement( 'span', { classList: 'ck-editor__text' } );

				elementLabel.appendChild( new window.Text( getText( currentNode ).wholeText ) );
				listElement.appendChild( getIndent( indent + 1 ) );
				listElement.appendChild( elementLabel );
				rootList.insertBefore( listElement, rootList.lastChild );
			}
		}

		if ( lastElementName ) {
			closePreviousElement();
			indent -= 1;
		}

		function getIndent( defaultIndent = indent ) {
			return new window.Text( ' '.repeat( defaultIndent * 4 ) );
		}

		function closePreviousElement() {
			const listElement = makeElement( 'li', { classList: 'ck-editor__code-line' } );
			const elementLabel = makeElement( 'span', { classList: 'ck-editor__element' } );
			elementLabel.appendChild( new window.Text( `</${ lastElementName }>` ) );
			listElement.appendChild( getIndent() );
			listElement.appendChild( elementLabel );

			rootList.insertBefore( listElement, rootList.lastChild );
		}

		function getText( node ) {
			if ( node instanceof window.Text ) {
				return node;
			}

			return node.firstChild;
		}

		function isText( node ) {
			if ( node instanceof window.Text ) {
				return true;
			}

			if ( node instanceof window.Element && getElementName( node ) !== 'model-text-with-attributes' ) {
				return true;
			}

			return false;
		}

		function isElement( node ) {
			if ( !(node instanceof window.Element) ) {
				return false;
			}

			return getElementName( node ) !== 'model-text-with-attributes';
		}

		function getElementName( node ) {
			if ( node.nodeName === 'root' ) {
				return '$root';
			}

			return node.nodeName;
		}
	}
}

// @param {String} elementName Name of HTML element that will be created.
// @param {Object} parameters Additional parameters of created element.
// @param {String|Array} parameters.classList
// @returns {Element}
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

// @param {Iterable.<*>} attributes Map with element's attributes.
// @param {HTMLElement} listElement Graphical representation of the model entry.
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

// @param {HTMLElement} rootList
function prepareTreeElement( rootList ) {
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
}
