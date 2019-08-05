/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module engine/view/uielement
 */

import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import RawElement from './rawelement';

/**
 * UI element class. It should be used to represent editing UI which needs to be injected into the editing view
 * If possible, you should keep your UI outside the editing view. However, if that is not possible,
 * UI elements can be used.
 *
 * How a UI element is rendered is in your control (you pass a callback to
 * {@link module:engine/view/downcastwriter~DowncastWriter#createUIElement `downcastWriter#createUIElement()`}).
 * The editor will ignore your UI element – the selection cannot be placed in it, it is skipped (invisible) when
 * the user modifies the selection by using arrow keys and the editor does not listen to any mutations which
 * happen inside your UI elements.
 *
 * The limitation is that you cannot convert a model element to a UI element. UI elements need to be
 * created for {@link module:engine/model/markercollection~Marker markers} or as additinal elements
 * inside normal {@link module:engine/view/containerelement~ContainerElement container elements}.
 *
 * To create a new UI element use the
 * {@link module:engine/view/downcastwriter~DowncastWriter#createUIElement `downcastWriter#createUIElement()`} method.
 *
 * @extends module:engine/view/element~Element
 */
export default class UIElement extends RawElement {
	/**
	 * @inheritDoc
	 */
	is( type, name = null ) {
		if ( !name ) {
			return type == 'uiElement' || super.is( type );
		} else {
			return ( type == 'uiElement' && name == this.name ) || super.is( type, name );
		}
	}
}

/**
 * This function injects UI element handling to the given {@link module:engine/view/document~Document document}.
 *
 * A callback is added to {@link module:engine/view/document~Document#event:keydown document keydown event}.
 * The callback handles the situation when right arrow key is pressed and selection is collapsed before a UI element.
 * Without this handler, it would be impossible to "jump over" UI element using right arrow key.
 *
 * @param {module:engine/view/view~View} view View controller to which the quirks handling will be injected.
 */
export function injectUiElementHandling( view ) {
	view.document.on( 'keydown', ( evt, data ) => jumpOverUiElement( evt, data, view.domConverter ) );
}

// Selection cannot be placed in a `UIElement`. Whenever it is placed there, it is moved before it. This
// causes a situation when it is impossible to jump over `UIElement` using right arrow key, because the selection
// ends up in ui element (in DOM) and is moved back to the left. This handler fixes this situation.
function jumpOverUiElement( evt, data, domConverter ) {
	if ( data.keyCode == keyCodes.arrowright ) {
		const domSelection = data.domTarget.ownerDocument.defaultView.getSelection();
		const domSelectionCollapsed = domSelection.rangeCount == 1 && domSelection.getRangeAt( 0 ).collapsed;

		// Jump over UI element if selection is collapsed or shift key is pressed. These are the cases when selection would extend.
		if ( domSelectionCollapsed || data.shiftKey ) {
			const domParent = domSelection.focusNode;
			const domOffset = domSelection.focusOffset;

			const viewPosition = domConverter.domPositionToView( domParent, domOffset );

			// In case if dom element is not converted to view or is not mapped or something. Happens for example in some tests.
			if ( viewPosition === null ) {
				return;
			}

			// Skip all following ui elements.
			let jumpedOverAnyUiElement = false;

			const nextViewPosition = viewPosition.getLastMatchingPosition( value => {
				if ( value.item.is( 'uiElement' ) ) {
					// Remember that there was at least one ui element.
					jumpedOverAnyUiElement = true;
				}

				// Jump over ui elements, jump over empty attribute elements, move up from inside of attribute element.
				if ( value.item.is( 'uiElement' ) || value.item.is( 'attributeElement' ) ) {
					return true;
				}

				// Don't jump over text or don't get out of container element.
				return false;
			} );

			// If anything has been skipped, fix position.
			// This `if` could be possibly omitted but maybe it is better not to mess with DOM selection if not needed.
			if ( jumpedOverAnyUiElement ) {
				const newDomPosition = domConverter.viewPositionToDom( nextViewPosition );

				if ( domSelectionCollapsed ) {
					// Selection was collapsed, so collapse it at further position.
					domSelection.collapse( newDomPosition.parent, newDomPosition.offset );
				} else {
					// Selection was not collapse, so extend it instead of collapsing.
					domSelection.extend( newDomPosition.parent, newDomPosition.offset );
				}
			}
		}
	}
}
