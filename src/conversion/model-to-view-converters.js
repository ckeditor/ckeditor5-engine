/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ViewElement from '../view/element';
import ViewAttributeElement from '../view/attributeelement';
import ViewText from '../view/text';
import ViewRange from '../view/range';
import ViewPosition from '../view/position';
import ViewTreeWalker from '../view/treewalker';
import viewWriter from '../view/writer';

/**
 * Contains model to view converters for
 * {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher}.
 *
 * @module engine/conversion/model-to-view-converters
 */

/**
 * Function factory, creates a converter that converts node insertion changes from the model to the view.
 * The view element that will be added to the view depends on passed parameter. If {@link module:engine/view/element~Element} was passed,
 * it will be cloned and the copy will be inserted. If `Function` is provided, it is passed all the parameters of the
 * dispatcher's {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher#event:insert insert event}.
 * It's expected that the function returns a {@link module:engine/view/element~Element}.
 * The result of the function will be inserted to the view.
 *
 * The converter automatically consumes corresponding value from consumables list, stops the event (see
 * {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher}) and bind model and view elements.
 *
 *		modelDispatcher.on( 'insert:paragraph', insertElement( new ViewElement( 'p' ) ) );
 *
 *		modelDispatcher.on(
 *			'insert:myElem',
 *			insertElement( ( data, consumable, conversionApi ) => {
 *				let myElem = new ViewElement( 'myElem', { myAttr: true }, new ViewText( 'myText' ) );
 *
 *				// Do something fancy with myElem using data/consumable/conversionApi ...
 *
 *				return myElem;
 *			}
 *		) );
 *
 * @param {module:engine/view/element~Element|Function} elementCreator View element, or function returning a view element, which
 * will be inserted.
 * @returns {Function} Insert element event converter.
 */
export function insertElement( elementCreator ) {
	return ( evt, data, consumable, conversionApi ) => {
		const viewElement = ( elementCreator instanceof ViewElement ) ?
			elementCreator.clone( true ) :
			elementCreator( data, consumable, conversionApi );

		if ( !viewElement ) {
			return;
		}

		if ( !consumable.consume( data.item, 'insert' ) ) {
			return;
		}

		const viewPosition = conversionApi.mapper.toViewPosition( data.range.start );

		conversionApi.mapper.bindElements( data.item, viewElement );
		viewWriter.insert( viewPosition, viewElement );
	};
}

/**
 * Function factory, creates a default model-to-view converter for text insertion changes.
 *
 * The converter automatically consumes corresponding value from consumables list and stops the event (see
 * {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher}).
 *
 *		modelDispatcher.on( 'insert:$text', insertText() );
 *
 * @returns {Function} Insert text event converter.
 */
export function insertText() {
	return ( evt, data, consumable, conversionApi ) => {
		if ( !consumable.consume( data.item, 'insert' ) ) {
			return;
		}

		const viewPosition = conversionApi.mapper.toViewPosition( data.range.start );
		const viewText = new ViewText( data.item.data );

		viewWriter.insert( viewPosition, viewText );
	};
}

/**
 * Function factory, creates a default model-to-view converter for node remove changes.
 *
 *		modelDispatcher.on( 'remove', remove() );
 *
 * @returns {Function} Remove event converter.
 */
export function remove() {
	return ( evt, data, conversionApi ) => {
		// Find view range start position by mapping model position at which the remove happened.
		const viewStart = conversionApi.mapper.toViewPosition( data.position );

		// Find view range end by providing to mapper view container and expected model offset.
		// Get the offset from passed model position and passed length of removed content.
		const viewContainer = conversionApi.mapper.toViewElement( data.position.parent );
		const viewEnd = conversionApi.mapper._findPositionIn( viewContainer, data.position.offset + data.length );

		const viewRange = new ViewRange( viewStart, viewEnd );

		// Trim the range to remove in case some UI elements are on the view range boundaries.
		const removed = viewWriter.remove( viewRange.getTrimmed() );

		// After the range is removed, unbind all view elements from the model.
		for ( const child of ViewRange.createIn( removed ).getItems() ) {
			conversionApi.mapper.unbindViewElement( child );
		}
	};
}

/**
 * Function factory, creates a converter that converts marker adding change to the view ui element.
 * The view ui element that will be added to the view depends on passed parameter. See {@link ~insertElement}.
 * In a case of collapsed range element will not wrap range but separate elements will be placed at the beginning
 * and at the end of the range.
 *
 * **Note:** unlike {@link ~insertElement}, the converter does not bind view element to model, because this converter
 * uses marker as "model source of data". This means that view ui element does not have corresponding model element.
 *
 * @param {module:engine/view/uielement~UIElement|Function} elementCreator View ui element, or function returning a view element, which
 * will be inserted.
 * @returns {Function} Insert element event converter.
 */
export function insertUIElement( elementCreator ) {
	return ( evt, data, conversionApi ) => {
		let viewStartElement, viewEndElement;

		// Create two view elements. One will be inserted at the beginning of marker, one at the end.
		// If marker is collapsed, only "opening" element will be inserted.
		if ( elementCreator instanceof ViewElement ) {
			viewStartElement = elementCreator.clone( true );
			viewEndElement = elementCreator.clone( true );
		} else {
			data.isOpening = true;
			viewStartElement = elementCreator( data, conversionApi );

			data.isOpening = false;
			viewEndElement = elementCreator( data, conversionApi );
		}

		if ( !viewStartElement || !viewEndElement ) {
			return;
		}

		const markerRange = data.markerRange;
		const mapper = conversionApi.mapper;

		// Add "opening" element.
		viewWriter.insert( mapper.toViewPosition( markerRange.start ), viewStartElement );

		// Add "closing" element only if range is not collapsed.
		if ( !markerRange.isCollapsed ) {
			viewWriter.insert( mapper.toViewPosition( markerRange.end ), viewEndElement );
		}

		evt.stop();
	};
}

/**
 * Function factory, creates a default model-to-view converter for removing {@link module:engine/view/uielement~UIElement ui element}
 * basing on marker remove change.
 *
 * @param {module:engine/view/uielement~UIElement|Function} elementCreator View ui element, or function returning
 * a view ui element, which will be used as a pattern when look for element to remove at the marker start position.
 * @returns {Function} Remove ui element converter.
 */
export function removeUIElement( elementCreator ) {
	return ( evt, data, conversionApi ) => {
		let viewStartElement, viewEndElement;

		// Create two view elements. One will be used to remove "opening element", the other for "closing element".
		// If marker was collapsed, only "opening" element will be removed.
		if ( elementCreator instanceof ViewElement ) {
			viewStartElement = elementCreator.clone( true );
			viewEndElement = elementCreator.clone( true );
		} else {
			data.isOpening = true;
			viewStartElement = elementCreator( data, conversionApi );

			data.isOpening = false;
			viewEndElement = elementCreator( data, conversionApi );
		}

		if ( !viewStartElement || !viewEndElement ) {
			return;
		}

		const markerRange = data.markerRange;

		// When removing the ui elements, we map the model range to view twice, because that view range
		// may change after the first clearing.
		if ( !markerRange.isCollapsed ) {
			viewWriter.clear( conversionApi.mapper.toViewRange( markerRange ).getEnlarged(), viewEndElement );
		}

		// Remove "opening" element.
		viewWriter.clear( conversionApi.mapper.toViewRange( markerRange ).getEnlarged(), viewStartElement );

		evt.stop();
	};
}

/**
 * Function factory, creates a converter that converts set/change/remove attribute changes from the model to the view.
 *
 * Attributes from model are converted to the view element attributes in the view. You may provide a custom function to generate
 * a key-value attribute pair to add/change/remove. If not provided, model attributes will be converted to view elements
 * attributes on 1-to-1 basis.
 *
 * **Note:** Provided attribute creator should always return the same `key` for given attribute from the model.
 *
 * The converter automatically consumes corresponding value from consumables list and stops the event (see
 * {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher}).
 *
 *		modelDispatcher.on( 'attribute:customAttr:myElem', setAttribute( ( data ) => {
 *			// Change attribute key from `customAttr` to `class` in view.
 *			const key = 'class';
 *			let value = data.attributeNewValue;
 *
 *			// Force attribute value to 'empty' if the model element is empty.
 *			if ( data.item.childCount === 0 ) {
 *				value = 'empty';
 *			}
 *
 *			// Return key-value pair.
 *			return { key, value };
 *		} ) );
 *
 * @param {Function} [attributeCreator] Function returning an object with two properties: `key` and `value`, which
 * represents attribute key and attribute value to be set on a {@link module:engine/view/element~Element view element}.
 * The function is passed all the parameters of the
 * {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher#event:addAttribute}
 * or {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher#event:changeAttribute} event.
 * @returns {Function} Set/change attribute converter.
 */
export function setAttribute( attributeCreator ) {
	attributeCreator = attributeCreator || ( ( value, key ) => ( { value, key } ) );

	return ( evt, data, consumable, conversionApi ) => {
		if ( !consumable.consume( data.item, eventNameToConsumableType( evt.name ) ) ) {
			return;
		}

		const { key, value } = attributeCreator( data.attributeNewValue, data.attributeKey, data, consumable, conversionApi );

		if ( data.attributeNewValue !== null ) {
			conversionApi.mapper.toViewElement( data.item ).setAttribute( key, value );
		} else {
			conversionApi.mapper.toViewElement( data.item ).removeAttribute( key );
		}
	};
}

/**
 * Function factory, creates a converter that converts set/change/remove attribute changes from the model to the view.
 *
 * Attributes from model are converted to a view element that will be wrapping those view nodes that are bound to
 * model elements having given attribute. This is useful for attributes like `bold`, which may be set on text nodes in model
 * but are represented as an element in the view:
 *
 *		[paragraph]              MODEL ====> VIEW        <p>
 *			|- a {bold: true}                             |- <b>
 *			|- b {bold: true}                             |   |- ab
 *			|- c                                          |- c
 *
 * The wrapping node depends on passed parameter. If {@link module:engine/view/element~Element} was passed, it will be cloned and
 * the copy will become the wrapping element. If `Function` is provided, it is passed attribute value and then all the parameters of the
 * {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher#event:addAttribute addAttribute event}.
 * It's expected that the function returns a {@link module:engine/view/element~Element}.
 * The result of the function will be the wrapping element.
 * When provided `Function` does not return element, then will be no conversion.
 *
 * The converter automatically consumes corresponding value from consumables list, stops the event (see
 * {@link module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher}).
 *
 *		modelDispatcher.on( 'attribute:bold', wrapItem( new ViewAttributeElement( 'strong' ) ) );
 *
 * @param {module:engine/view/element~Element|Function} elementCreator View element, or function returning a view element, which will
 * be used for wrapping.
 * @returns {Function} Set/change attribute converter.
 */
export function wrap( elementCreator ) {
	return ( evt, data, consumable, conversionApi ) => {
		// Recreate current wrapping node. It will be used to unwrap view range if the attribute value has changed
		// or the attribute was removed.
		const oldViewElement = ( elementCreator instanceof ViewElement ) ?
			elementCreator.clone( true ) :
			elementCreator( data.attributeOldValue, data, consumable, conversionApi );

		// Create node to wrap with.
		const newViewElement = ( elementCreator instanceof ViewElement ) ?
			elementCreator.clone( true ) :
			elementCreator( data.attributeNewValue, data, consumable, conversionApi );

		if ( !oldViewElement && !newViewElement ) {
			return;
		}

		if ( !consumable.consume( data.item, eventNameToConsumableType( evt.name ) ) ) {
			return;
		}

		let viewRange = conversionApi.mapper.toViewRange( data.range );

		// First, unwrap the range from current wrapper.
		if ( data.attributeOldValue !== null ) {
			viewRange = viewWriter.unwrap( viewRange, oldViewElement );
		}

		// Then wrap with the new wrapper.
		if ( data.attributeNewValue !== null ) {
			viewWriter.wrap( viewRange, newViewElement );
		}
	};
}

/**
 * Function factory, creates a converter that converts model marker add/change/remove to the view.
 *
 * The result of this conversion is different for text nodes and elements.
 *
 * Text nodes are wrapped with {@link module:engine/view/attributeelement~AttributeElement} created from provided
 * highlight descriptor. See {link module:engine/conversion/model-to-view-converters~highlightDescriptorToAttributeElement}.
 *
 * For elements, the converter checks if an element has `addHighlight` and `removeHighlight` functions stored as
 * {@link module:engine/view/element~Element#setCustomProperty custom properties}. If so, it uses them to apply the highlight.
 * In such case, children of that element will not be converted. When `addHighlight` and `removeHighlight` are not present,
 * element is not converted in any special way, instead converter will proceed to convert element's child nodes. Most
 * common case is that the element will be given a special class, style or attribute basing on the descriptor.
 *
 * If the highlight descriptor will not provide `priority` property, `10` will be used.
 *
 * If the highlight descriptor will not provide `id` property, name of the marker will be used.
 *
 * @param {module:engine/conversion/model-to-view-converters~HighlightDescriptor|Function} highlightDescriptor
 * @return {Function}
 */
export function highlight( highlightDescriptor ) {
	return ( evt, data, conversionApi ) => {
		// This conversion makes sense only for non-collapsed range.
		if ( data.markerRange.isCollapsed ) {
			return;
		}

		const viewRange = conversionApi.mapper.toViewRange( data.markerRange );
		const type = evt.name.split( ':' )[ 0 ];

		// We will walk through every element in the range to highlight.
		// Walking backwards will ensure that the walker won't break when change is applied inside range.
		const treeWalker = new ViewTreeWalker( {
			boundaries: viewRange,
			startPosition: viewRange.end,
			direction: 'backward'
		} );

		for ( const value of treeWalker ) {
			// Ignore element start so that the same element is not returned twice.
			if ( value.type == 'elementStart' ) {
				continue;
			}

			const viewItem = value.item;

			// Will hold a new position for walker. It will depend on what action has been taken. See below.
			let newPosition;

			if ( viewItem.is( 'textProxy' ) ) {
				// If the item is a text node, use text node highlighting helper.
				// It will return a new position for walker.
				newPosition = _highlightText( viewItem, highlightDescriptor, type, data, conversionApi );
			} else if ( viewItem.is( 'containerElement' ) ) {
				// If the item is container element, use element highlighting helper.
				// Returned position depends on whether the element had custom highlighting enabled.
				// If yes, returned position will be after the element.
				// If no, no position will be returned, so the walker will continue inside the element.
				newPosition = _highlightElement( viewItem, highlightDescriptor, type, data, conversionApi );
			}
			// Skip or step inside other elements (mostly attribute elements).

			// If new position got specified, apply it to the walker.
			if ( newPosition ) {
				if ( newPosition.isBefore( viewRange.start ) ) {
					// If the new position is beyond the range, stop processing.
					break;
				} else {
					treeWalker.position = newPosition;
				}
			}
		}

		evt.stop();
	}
}

// Helper function for `highlight`. Takes care of converting markers on text nodes.
function _highlightText( viewItem, highlightDescriptor, type, data, conversionApi ) {
	const descriptor = _prepareDescriptor( highlightDescriptor, viewItem, data, conversionApi );

	if ( !descriptor ) {
		return;
	}

	const viewElement = createViewElementFromHighlightDescriptor( descriptor );
	const viewRange = ViewRange.createOn( viewItem );
	let viewRangeAfter;

	if ( type == 'addMarker' ) {
		viewRangeAfter = viewWriter.wrap( viewRange, viewElement );
	} else {
		viewRangeAfter = viewWriter.unwrap( viewRange, viewElement );
	}

	return viewRangeAfter.start;
}

// Helper function for `highlight`. Takes care of converting markers on elements.
function _highlightElement( viewItem, highlightDescriptor, type, data, conversionApi ) {
	const descriptor = _prepareDescriptor( highlightDescriptor, viewItem, data, conversionApi );

	if ( !descriptor ) {
		return;
	}

	// Check if highlight is actually removed or added. Choose proper method to call later.
	const highlightHandlingMethod = type == 'addMarker' ? 'addHighlight' : 'removeHighlight';

	// If such method exists, use it to apply highlighting.
	if ( viewItem.getCustomProperty( highlightHandlingMethod ) ) {
		if ( type == 'addMarker' ) {
			viewItem.getCustomProperty( highlightHandlingMethod )( viewItem, descriptor );
		} else {
			viewItem.getCustomProperty( highlightHandlingMethod )( viewItem, descriptor.id );
		}

		// Return position after highlight element, so children of this element will not be processed.
		return ViewPosition.createBefore( viewItem );
	}
}

// Helper function for `highlight`. Prepares the actual descriptor object using value passed to the converter.
function _prepareDescriptor( highlightDescriptor, viewItem, data, conversionApi ) {
	// If passed descriptor is a creator function, call it. If not, just use passed value.
	const descriptor = typeof highlightDescriptor == 'function' ?
		highlightDescriptor( data, viewItem, conversionApi ) :
		highlightDescriptor;

	if ( !descriptor ) {
		return null;
	}

	// Apply default descriptor priority.
	if ( !descriptor.priority ) {
		descriptor.priority = 10;
	}

	// Default descriptor id is marker name.
	if ( !descriptor.id ) {
		descriptor.id = data.markerName;
	}

	return descriptor;
}

/**
 * Returns the consumable type that is to be consumed in an event, basing on that event name.
 *
 * @param {String} evtName Event name.
 * @returns {String} Consumable type.
 */
export function eventNameToConsumableType( evtName ) {
	const parts = evtName.split( ':' );

	return parts[ 0 ] + ':' + parts[ 1 ];
}

/**
 * Creates `span` {@link module:engine/view/attributeelement~AttributeElement view attribute element} from information
 * provided by {@link module:engine/conversion/model-to-view-converters~HighlightDescriptor} object. If priority
 * is not provided in descriptor - default priority will be used.
 *
 * @param {module:engine/conversion/model-to-view-converters~HighlightDescriptor} descriptor
 * @return {module:engine/conversion/model-to-view-converters~HighlightAttributeElement}
 */
export function createViewElementFromHighlightDescriptor( descriptor ) {
	const viewElement = new HighlightAttributeElement( 'span', descriptor.attributes );

	if ( descriptor.class ) {
		const cssClasses = Array.isArray( descriptor.class ) ? descriptor.class : [ descriptor.class ];
		viewElement.addClass( ...cssClasses );
	}

	if ( descriptor.priority ) {
		viewElement.priority = descriptor.priority;
	}

	viewElement.setCustomProperty( 'highlightDescriptorId', descriptor.id );

	return viewElement;
}

/**
 * Special kind of {@link module:engine/view/attributeelement~AttributeElement} that is created and used in
 * marker-to-highlight conversion.
 *
 * The difference between `HighlightAttributeElement` and {@link module:engine/view/attributeelement~AttributeElement}
 * is {@link module:engine/view/attributeelement~AttributeElement#isSimilar} method.
 *
 * For `HighlightAttributeElement` it checks just `highlightDescriptorId` custom property, that is set during marker-to-highlight
 * conversion basing on {@link module:engine/conversion/model-to-view-converters~HighlightDescriptor} object.
 * `HighlightAttributeElement`s with same `highlightDescriptorId` property are considered similar.
 */
class HighlightAttributeElement extends ViewAttributeElement {
	isSimilar( otherElement ) {
		if ( otherElement.is( 'attributeElement' ) ) {
			return this.getCustomProperty( 'highlightDescriptorId' ) === otherElement.getCustomProperty( 'highlightDescriptorId' );
		}

		return false;
	}
}

/**
 * Object describing how the content highlight should be created in the view.
 *
 * Each text node contained in the highlight will be wrapped with `span` element with CSS class(es), attributes and priority
 * described by this object.
 *
 * Each element can handle displaying the highlight separately by providing `addHighlight` and `removeHighlight` custom
 * properties:
 *  * `HighlightDescriptor` is passed to the `addHighlight` function upon conversion and should be used to apply the highlight to
 *  the element,
 *  * descriptor id is passed to the `removeHighlight` function upon conversion and should be used to remove the highlight of given
 *  id from the element.
 *
 * @typedef {Object} module:engine/conversion/model-to-view-converters~HighlightDescriptor
 *
 * @property {String|Array.<String>} class CSS class or array of classes to set. If descriptor is used to
 * create {@link module:engine/view/attributeelement~AttributeElement} over text nodes, those classes will be set
 * on that {@link module:engine/view/attributeelement~AttributeElement}. If descriptor is applied to an element,
 * usually those class will be set on that element, however this depends on how the element converts the descriptor.
 *
 * @property {String} [id] Descriptor identifier. If not provided, defaults to converted marker's name.
 *
 * @property {Number} [priority] Descriptor priority. If not provided, defaults to `10`. If descriptor is used to create
 * {@link module:engine/view/attributeelement~AttributeElement}, it will be that element's
 * {@link module:engine/view/attributeelement~AttributeElement#priority}. If descriptor is applied to an element,
 * the priority will be used to determine which descriptor is more important.
 *
 * @property {Object} [attributes] Attributes to set. If descriptor is used to create
 * {@link module:engine/view/attributeelement~AttributeElement} over text nodes, those attributes will be set on that
 * {@link module:engine/view/attributeelement~AttributeElement}. If descriptor is applied to an element, usually those
 * attributes will be set on that element, however this depends on how the element converts the descriptor.
 */
