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

	window.editorDocument = document;
	window.document.body.appendChild( debugRootElement );

	drawTree();

	document.on( 'changesDone', () => {
		drawTree();
	} );

	function drawTree() {
		let hasOpenSelection = false;
		let currentBlockTextLength = 0;

		let parsedStart = false;
		let parsedEnd = false;
		let startSelectionText = null;
		let endSelectionText = null;

		while ( debugRootElement.firstChild ) {
			debugRootElement.removeChild( debugRootElement.firstChild );
		}

		const rootList = makeElement( 'ol' );
		prepareTreeElement( rootList );

		let indent = 1;

		const treeWalker = new TreeWalker( {
			boundaries: Range.createIn( document.getRoot() )
		} );

		const selectionRange = document.selection.getFirstRange();

		for ( const node of treeWalker ) {
			const listElement = makeElement( 'li', { classList: 'ck-editor__code-line' } );

			// Decrease the indent if element is closing the block.
			if ( node.type === 'elementEnd' ) {
				indent -= 1;
			}

			if ( node.item instanceof Element ) {
				// Append selection at the end of element.
				if ( selectionRange.start.parent === node.item && currentBlockTextLength === selectionRange.start.offset ) {
					const selectionElement = makeElement( 'span', { classList: 'ck-editor__selection' } );
					selectionElement.appendChild( new Text( '[]' ) );
					const previousElement = rootList.lastChild.previousElementSibling;
					const textNode = previousElement.firstElementChild;

					if ( !textNode.classList.contains( 'ck-editor__element' ) ) {
						if ( textNode.nextSibling ) {
							previousElement.insertBefore( selectionElement, textNode.nextSibling );
						} else {
							previousElement.appendChild( selectionElement );
						}
					}
				} else if (
					!document.selection.isCollapsed &&
					editorDocument.selection.getFirstRange().end.parent == node.item && !selectionRange.end.textNode && selectionRange.end.nodeBefore &&
					selectionRange.start.textNode !== selectionRange.end.textNode
				) {
					// The selection is at the end of the previous node.
					const previousElement = rootList.lastChild.previousSibling;
					const textNode = previousElement.firstElementChild;

					const selectionElement = makeElement( 'span', { classList: 'ck-editor__selection' } );
					selectionElement.appendChild( new Text( ']' ) );

					if ( textNode.nextSibling ) {
						previousElement.insertBefore( selectionElement, textNode.nextSibling );
					} else {
						previousElement.appendChild( selectionElement );
					}
				}

				insertBlockElement( node, listElement );
			} else if ( node.item instanceof TextProxy ) {
				insertTextElement( node, listElement );
			}

			// Increase the indent if element is opening the block.
			if ( node.type === 'elementStart' ) {
				indent += 1;
			}
		}

		debugRootElement.appendChild( rootList );

		function insertSelectionForElement( selectedElement, listElement ) {
			const selectionElement = makeElement( 'span', { classList: 'ck-editor__selection' } );

			if ( hasOpenSelection ) {
				selectionElement.appendChild( new Text( ']' ) );

				if ( selectedElement.nextSibling ) {
					listElement.insertBefore( selectionElement, selectedElement.nextSibling );
				} else {
					listElement.appendChild( selectionElement );
				}
			}

			if ( !hasOpenSelection ) {
				selectionElement.appendChild( new Text( '[' ) );

				listElement.insertBefore( selectionElement, selectedElement );
				hasOpenSelection = true;
			}
		}

		function insertBlockElement( node, listElement ) {
			const blockElementName = makeElement( 'span', { classList: 'ck-editor__element' } );

			// Add attribute labels for opening block element.
			if ( node.type === 'elementStart' ) {
				currentBlockTextLength = 0;
				createAttributeLabels( node.item.getAttributes(), listElement );
			}

			let elementContent;

			if ( node.type === 'elementStart' ) {
				elementContent = '<' + node.item.name + '>';
			} else {
				elementContent = '</' + node.item.name + '>';
			}

			// Prepare name or content for given model element.
			blockElementName.appendChild( new Text( elementContent ) );

			// Append element to the list.
			listElement.insertBefore( blockElementName, listElement.firstChild );

			const indentElement = new Text( ' '.repeat( 4 * indent ) );
			listElement.insertBefore( indentElement, blockElementName );

			if ( document.selection.getSelectedElement() === node.item ) {
				insertSelectionForElement( blockElementName, listElement );
			}

			rootList.insertBefore( listElement, rootList.lastChild );
		}

		function insertTextElement( node, listElement ) {

			let itemValue = makeElement( 'span' );
			let elementName;
			let elementContent;

			itemValue.classList.add( 'ck-editor__text' );
			elementName = '$text';

			// if ( selectionRange ) {
			// 	if ( !parsedStart ) {
			// 		const start = document.selection.getFirstRange().start;
			// 		startSelectionText = start.textNode || start.nodeAfter;
			// 	}
			//
			// 	if ( !parsedStart ) {
			// 		if ( startSelectionText === node.item.textNode ) {
			// 			parsedStart = true;
			//
			// 			const beforeSelectionSpan = makeElement( 'span', {
			// 				classList: [
			// 					'ck-editor__text',
			// 					'ck-editor__text--first'
			// 				]
			// 			} );
			// 			const afterSelectionSpan = makeElement( 'span', {
			// 				classList: [
			// 					'ck-editor__text',
			// 					'ck-editor__text--last'
			// 				]
			// 			} );
			//
			// 			const beforeSelectionText = new Text( node.item.data.substr( 0, selectionStart.offset ) );
			// 			const afterSelectionText = new Text( node.item.data.substr( selectionStart.offset ) );
			//
			// 			beforeSelectionSpan.appendChild( beforeSelectionText );
			// 			afterSelectionSpan.appendChild( afterSelectionText );
			//
			// 			const selectionElement = makeElement( 'span', { classList: 'ck-editor__selection' } );
			//
			// 			if ( selectionRange.start.nodeAfter === selectionRange.end.nodeAfter &&
			// 				selectionRange.start.offset === selectionRange.end.offset
			// 			) {
			// 				selectionElement.appendChild( new Text( '[]' ) );
			// 			} else {
			// 				selectionElement.appendChild( new Text( '[' ) );
			// 			}
			//
			// 			listElement.appendChild( beforeSelectionSpan );
			// 			listElement.appendChild( selectionElement );
			// 			listElement.appendChild( afterSelectionSpan );
			//
			// 			itemValue = null;
			// 		} else {
			// 			elementContent = node.item.data;
			//
			// 			// Prepare name or content for given model element.
			// 			itemValue.appendChild( new Text( elementContent ) );
			// 		}
			// 	} else {
			// 		elementContent = node.item.data;
			//
			// 		// Prepare name or content for given model element.
			// 		itemValue.appendChild( new Text( elementContent ) );
			// 	}
			//
			// 	if ( !parsedEnd ) {
			// 		const selectionElement = makeElement( 'span', { classList: 'ck-editor__selection' } );
			// 		selectionElement.appendChild( new Text( ']' ) );
			//
			// 		if ( document.selection.getFirstRange().end === node.item.textNode ) {
			// 			const beforeSelectionSpan = makeElement( 'span', {
			// 				classList: [
			// 					'ck-editor__text',
			// 					'ck-editor__text--first'
			// 				]
			// 			} );
			// 			const afterSelectionSpan = makeElement( 'span', {
			// 				classList: [
			// 					'ck-editor__text',
			// 					'ck-editor__text--last'
			// 				]
			// 			} );
			//
			// 			if ( document.selection.getFirstRange().end === selectionStart.textNode ) {
			// 				const selectionStartElement = listElement.querySelector( '.ck-editor__selection' );
			// 				if ( selectionRange.isCollapsed ) {
			// 					if ( selectionStartElement.nextSibling ) {
			// 						listElement.insertBefore( selectionElement, selectionStartElement.nextSibling );
			// 					} else {
			// 						listElement.appendChild( selectionElement );
			// 					}
			// 				} else {
			// 					const textNode = selectionStartElement.nextSibling.firstChild;
			// 					const offset = selectionRange.end.textNode.document.selection.getFirstRange().end.offset - selectionStart.offset;
			//
			// 					const beforeSelectionText = new Text( textNode.wholeText.substr( 0, offset ) );
			// 					const afterSelectionText = new Text( textNode.wholeText.substr( offset ) );
			//
			// 					beforeSelectionSpan.appendChild( beforeSelectionText );
			// 					afterSelectionSpan.appendChild( afterSelectionText );
			//
			// 					selectionStartElement.nextSibling.parentElement.removeChild( selectionStartElement.nextSibling );
			//
			// 					listElement.appendChild( beforeSelectionSpan );
			// 					listElement.appendChild( selectionElement );
			// 					listElement.appendChild( afterSelectionSpan );
			//
			// 					itemValue = null;
			// 				}
			// 			} else {
			// 				const offset = selectionRange.end.textNode.document.selection.getFirstRange().end.offset - selectionRange.end.textNode.startOffset;
			// 				const beforeSelectionText = new Text( node.item.data.substr( 0, offset ) );
			// 				const afterSelectionText = new Text( node.item.data.substr( offset ) );
			//
			// 				beforeSelectionSpan.appendChild( beforeSelectionText );
			// 				afterSelectionSpan.appendChild( afterSelectionText );
			//
			// 				listElement.appendChild( beforeSelectionSpan );
			// 				listElement.appendChild( selectionElement );
			// 				listElement.appendChild( afterSelectionSpan );
			//
			// 				itemValue = null;
			// 			}
			// 		}
			// 	}
			//
			// 	if ( parsedStart && parsedEnd ) {
			// 		selectionRange = null;
			// 	}
			//
			// } else {
			elementContent = node.item.data;

			// Prepare name or content for given model element.
			itemValue.appendChild( new Text( elementContent ) );
			// }

			// if (parsedStart) {
			// 	elementContent = node.item.data;
			//
			// 	// Prepare name or content for given model element.
			// 	itemValue.appendChild( new Text( elementContent ) );
			// }

			// Add attribute labels for $text element.
			createAttributeLabels( node.item.getAttributes(), listElement );

			// Append element to the list.
			if ( itemValue ) {
				listElement.insertBefore( itemValue, listElement.firstChild );
			}

			const indentElement = new Text( ' '.repeat( 4 * indent ) );
			listElement.insertBefore( indentElement, listElement.firstChild );

			const selectionElement = makeElement( 'span', { classList: 'ck-editor__selection' } );
			const selectionRange = document.selection.getFirstRange();

			const isSelectionCollapsed = document.selection.isCollapsed;

			selectionElement.appendChild( new Text( isSelectionCollapsed ? '[]' : '[' ) );

			// Check whether current node contains a selection.
			if ( (selectionRange.start.textNode || selectionRange.start.nodeAfter) === node.item.textNode ) {
				if ( selectionRange.start.offset === 0 ) {
					// Add the selection at the beginning of the text.
					listElement.insertBefore( selectionElement, itemValue );
				} else if ( !selectionRange.start.textNode && selectionRange.start.nodeBefore ) {
					// The selection is at the end of the previous node.
					const previousElement = rootList.lastChild.previousSibling;
					const textNode = previousElement.firstElementChild;

					if ( textNode.nextSibling ) {
						previousElement.insertBefore( selectionElement, textNode.nextSibling );
					} else {
						previousElement.appendChild( selectionElement );
					}
				} else {
					// The selection is at the middle of current node.
					const beforeSelectionSpan = makeElement( 'span', { classList: 'ck-editor__text' } );
					const afterSelectionSpan = beforeSelectionSpan.cloneNode( true );

					// An offset from the selection is counted at the beginning of the element. We need to calculate offset for given node.
					// After that we can split text in given node and add the selection.
					const beforeSelectionText = new Text( node.item.data.substr( 0, selectionRange.start.offset - currentBlockTextLength ) );
					const afterSelectionText = new Text( node.item.data.substr( selectionRange.start.offset - currentBlockTextLength ) );

					beforeSelectionSpan.appendChild( beforeSelectionText );
					afterSelectionSpan.appendChild( afterSelectionText );

					// Add before selection, selection and after selection nodes.
					listElement.insertBefore( beforeSelectionSpan, itemValue );
					listElement.insertBefore( selectionElement, itemValue );
					listElement.insertBefore( afterSelectionSpan, itemValue );

					// Remove current text node.
					itemValue.parentElement.removeChild( itemValue );
				}
			}

			if ( !isSelectionCollapsed ) {
				const selectionElement = makeElement( 'span', { classList: 'ck-editor__selection' } );
				selectionElement.appendChild( new Text( ']' ) );

				if ( node.item.textNode === selectionRange.end.textNode ) {
					// End of the selection is in the same element where the selection is being beginning.

					// The selection is at the middle of current node.
					const beforeSelectionSpan = makeElement( 'span', { classList: 'ck-editor__text' } );
					const afterSelectionSpan = beforeSelectionSpan.cloneNode( true );

					// An offset from the selection is counted at the beginning of the element. We need to calculate offset for given node.
					// After that we can split text in given node and add the selection.
					const beforeSelectionText = new Text( node.item.data.substr( 0, selectionRange.end.offset - selectionRange.start.offset - currentBlockTextLength ) );
					const afterSelectionText = new Text( node.item.data.substr( selectionRange.end.offset - selectionRange.start.offset - currentBlockTextLength ) );

					beforeSelectionSpan.appendChild( beforeSelectionText );
					afterSelectionSpan.appendChild( afterSelectionText );

					// Add before selection, selection and after selection nodes.
					listElement.insertBefore( beforeSelectionSpan, itemValue );
					listElement.insertBefore( selectionElement, itemValue );
					listElement.insertBefore( afterSelectionSpan, itemValue );

					// Remove current text node.
					itemValue.parentElement.removeChild( itemValue );
				}
			}

			currentBlockTextLength += node.item.data.length;
			rootList.insertBefore( listElement, rootList.lastChild );
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
