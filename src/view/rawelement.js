/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module engine/view/rawelement
 */

import Element from './element';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import Node from './node';

/**
 * @extends module:engine/view/element~Element
 */
export default class RawElement extends Element {
	/**
	 * Creates new instance of UIElement.
	 *
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-rawelement-cannot-add` when third parameter is passed,
	 * to inform that usage of UIElement is incorrect (adding child nodes to UIElement is forbidden).
	 *
	 * @see module:engine/view/downcastwriter~DowncastWriter#createUIElement
	 * @protected
	 * @param {String} name Node name.
	 * @param {Object|Iterable} [attributes] Collection of attributes.
	 */
	constructor( name, attributes, children ) {
		super( name, attributes, children );

		/**
		 * Returns `null` because filler is not needed for UIElements.
		 *
		 * @method #getFillerOffset
		 * @returns {null} Always returns null.
		 */
		this.getFillerOffset = getFillerOffset;
	}

	/**
	 * @inheritDoc
	 */
	is( type, name = null ) {
		if ( !name ) {
			return type == 'rawElement' || super.is( type );
		} else {
			return ( type == 'rawElement' && name == this.name ) || super.is( type, name );
		}
	}

	/**
	 * Overrides {@link module:engine/view/element~Element#_insertChild} method.
	 * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-rawelement-cannot-add` to prevent adding any child nodes
	 * to UIElement.
	 *
	 * @protected
	 */
	_insertChild( index, nodes ) {
		if ( nodes && ( nodes instanceof Node || Array.from( nodes ).length > 0 ) ) {
			/**
			 * Cannot add children to {@link module:engine/view/rawelement~UIElement}.
			 *
			 * @error view-rawelement-cannot-add
			 */
			throw new CKEditorError( 'view-rawelement-cannot-add: Cannot add child nodes to UIElement instance.' );
		}
	}

	/**
	 * Renders this {@link module:engine/view/rawelement~UIElement} to DOM. This method is called by
	 * {@link module:engine/view/domconverter~DomConverter}.
	 * Do not use inheritance to create custom rendering method, replace `render()` method instead:
	 *
	 *		const myUIElement = downcastWriter.createUIElement( 'span' );
	 *		myUIElement.render = function( domDocument ) {
	 *			const domElement = this.toDomElement( domDocument );
	 *			domElement.innerHTML = '<b>this is ui element</b>';
	 *
	 *			return domElement;
	 *		};
	 *
	 * @param {Document} domDocument
	 * @returns {HTMLElement}
	 */
	render( domDocument ) {
		return this.toDomElement( domDocument );
	}

	/**
	 * Creates DOM element based on this view UIElement.
	 * Note that each time this method is called new DOM element is created.
	 *
	 * @param {Document} domDocument
	 * @returns {HTMLElement}
	 */
	toDomElement( domDocument ) {
		const domElement = domDocument.createElement( this.name );

		for ( const key of this.getAttributeKeys() ) {
			domElement.setAttribute( key, this.getAttribute( key ) );
		}

		return domElement;
	}
}

// Returns `null` because block filler is not needed for UIElements.
//
// @returns {null}
function getFillerOffset() {
	return null;
}
