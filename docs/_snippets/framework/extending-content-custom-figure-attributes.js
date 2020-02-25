/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals ClassicEditor, console, window, document */

import { CS_CONFIG } from '@ckeditor/ckeditor5-cloud-services/tests/_utils/cloud-services-config';

/**
 * Plugin that converts custom attributes for elements that are wrapped in <figure> in the view.
 */
class CustomFigureAttributes {
	constructor( editor ) {
		this.editor = editor;
	}

	/**
	 * Setups conversion and extends table & image features schema.
	 *
	 * Schema extending must be done in the afterInit() call because plugins define their schema in init().
	 */
	afterInit() {
		const editor = this.editor;

		// Define converters for the id attribute on <img> and <table>.
		setupCustomAttributeConversion( 'img', 'image', 'id', editor );
		setupCustomAttributeConversion( 'table', 'table', 'id', editor );

		// Define conversion for <img> and <table> classes.
		// Classes require additional attention (can't be covered with the above helper)
		// because classes (and inline styles as well) are treated granularly.
		// In order to convert all at once, we need a small trick implemented by this helper.
		setupCustomClassConversion( 'img', 'image', editor );
		setupCustomClassConversion( 'table', 'table', editor );
	}
}

/**
 * Sets up a conversion for a custom attribute on view elements contained inside a <figure>.
 *
 * This method:
 *
 * * Adds proper schema rules.
 * * Adds an upcast converter.
 * * Adds a downcast converter.
 */
function setupCustomAttributeConversion( viewElementName, modelElementName, viewAttribute, editor ) {
	const modelAttribute = `custom${ viewAttribute }`;

	editor.model.schema.extend( modelElementName, { allowAttributes: [ modelAttribute ] } );

	editor.conversion.for( 'upcast' ).add(
		upcastCustomAttribute( viewElementName, viewAttribute, modelAttribute )
	);
	editor.conversion.for( 'downcast' ).add(
		downcastCustomAttribute( modelElementName, viewElementName, viewAttribute, modelAttribute )
	);
}

/**
 * Returns the custom attribute upcast converter.
 */
function upcastCustomAttribute( viewElementName, viewAttribute, modelAttribute ) {
	return dispatcher => dispatcher.on( `element:${ viewElementName }`, ( evt, data, conversionApi ) => {
		const viewItem = data.viewItem;
		const modelRange = data.modelRange;

		const modelElement = modelRange && modelRange.start.nodeAfter;

		if ( !modelElement ) {
			return;
		}

		conversionApi.writer.setAttribute( modelAttribute, viewItem.getAttribute( viewAttribute ), modelElement );
	} );
}

/**
 * Returns the custom attribute downcast converter.
 */
function downcastCustomAttribute( modelElementName, viewElementName, viewAttribute, modelAttribute ) {
	return dispatcher => dispatcher.on( `insert:${ modelElementName }`, ( evt, data, conversionApi ) => {
		const modelElement = data.item;

		const viewFigure = conversionApi.mapper.toViewElement( modelElement );
		const viewElement = findViewChild( viewFigure, viewElementName, conversionApi );

		if ( !viewElement ) {
			return;
		}

		conversionApi.writer.setAttribute( viewAttribute, modelElement.getAttribute( modelAttribute ), viewElement );
	} );
}

/**
 * Sets up a conversion that preserves classes on <img> and <table> elements.
 *
 * This method:
 *
 * * Adds proper schema rules.
 * * Adds an upcast converter (from img/table to their respective model element).
 * * Adds a downcast converter.
 */
function setupCustomClassConversion( viewElementName, modelElementName, editor ) {
	editor.model.schema.extend( modelElementName, {
		allowAttributes: [ 'customClass' ] }
	);

	editor.conversion.for( 'upcast' ).add( upcastCustomClasses( viewElementName ) );

	editor.conversion.for( 'downcast' ).add(
		downcastCustomClassesToFigureChild( viewElementName, modelElementName )
	);
}

/**
 * Creates an upcast converter that will pass all classes from the view element to the model element.
 */
function upcastCustomClasses( viewElementName ) {
	return dispatcher => dispatcher.on( `element:${ viewElementName }`, ( evt, data, conversionApi ) => {
		const viewItem = data.viewItem;
		const modelRange = data.modelRange;

		const modelElement = modelRange && modelRange.start.nodeAfter;

		if ( !modelElement ) {
			return;
		}

		// The upcast conversion picks up classes from the base element and from the <figure> element so it should be extensible.
		const currentAttributeValue = modelElement.getAttribute( 'customClass' ) || [];

		currentAttributeValue.push( ...viewItem.getClassNames() );

		conversionApi.writer.setAttribute( 'customClass', currentAttributeValue, modelElement );
	} );
}

/**
 * Downcast custom classes to the given child of the <figure> element.
 */
function downcastCustomClassesToFigureChild( viewFigureChildName, modelElementName ) {
	return dispatcher => dispatcher.on( `insert:${ modelElementName }`, ( evt, data, conversionApi ) => {
		const modelElement = data.item;

		const viewFigure = conversionApi.mapper.toViewElement( modelElement );

		if ( !viewFigure ) {
			return;
		}

		const viewElement = findViewChild( viewFigure, viewFigureChildName, conversionApi );

		conversionApi.writer.addClass( modelElement.getAttribute( 'customClass' ), viewElement );
	} );
}

/**
 * Helper method that searches for a given view element in all children of the model element.
 *
 * @param {module:engine/view/item~Item} viewElement
 * @param {String} viewElementName
 * @param {module:engine/conversion/downcastdispatcher~DowncastConversionApi} conversionApi
 * @return {module:engine/view/item~Item}
 */
function findViewChild( viewElement, viewElementName, conversionApi ) {
	const viewChildren = Array.from( conversionApi.writer.createRangeIn( viewElement ).getItems() );

	return viewChildren.find( item => item.is( viewElementName ) );
}

ClassicEditor
	.create( document.querySelector( '#snippet-custom-figure-attributes' ), {
		cloudServices: CS_CONFIG,
		extraPlugins: [ CustomFigureAttributes ],
		toolbar: {
			viewportTopOffset: window.getViewportTopOffsetConfig()
		}
	} )
	.then( editor => {
		window.editor = editor;
	} )
	.catch( err => {
		console.error( err.stack );
	} );
