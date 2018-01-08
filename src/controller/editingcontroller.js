/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/controller/editingcontroller
 */

import ViewDocument from '../view/document';
import Mapper from '../conversion/mapper';
import ModelConversionDispatcher from '../conversion/modelconversiondispatcher';
import {
	insertText,
	remove
} from '../conversion/model-to-view-converters';
import { convertSelectionChange } from '../conversion/view-selection-to-model-converters';
import {
	convertRangeSelection,
	convertCollapsedSelection,
	clearAttributes,
	clearFakeSelection
} from '../conversion/model-selection-to-view-converters';

import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

/**
 * Controller for the editing pipeline. The editing pipeline controls {@link ~EditingController#model model} rendering,
 * including selection handling. It also creates {@link ~EditingController#view view document} which build a
 * browser-independent virtualization over the DOM elements. Editing controller also attach default converters.
 *
 * @mixes module:utils/observablemixin~ObservableMixin
 */
export default class EditingController {
	/**
	 * Creates editing controller instance.
	 *
	 * @param {module:engine/model/model~Model} model Editing model.
	 */
	constructor( model ) {
		/**
		 * Editing model.
		 *
		 * @readonly
		 * @member {module:engine/model/model~Model}
		 */
		this.model = model;

		/**
		 * View document.
		 *
		 * @readonly
		 * @member {module:engine/view/document~Document}
		 */
		this.view = new ViewDocument();

		/**
		 * Mapper which describes model-view binding.
		 *
		 * @readonly
		 * @member {module:engine/conversion/mapper~Mapper}
		 */
		this.mapper = new Mapper();

		/**
		 * Model to view conversion dispatcher, which converts changes from the model to {@link #view the editing view}.
		 *
		 * To attach model-to-view converter to the editing pipeline you need to add a listener to this dispatcher:
		 *
		 *		editing.modelToView( 'insert:$element', customInsertConverter );
		 *
		 * Or use {@link module:engine/conversion/buildmodelconverter~ModelConverterBuilder}:
		 *
		 *		buildModelConverter().for( editing.modelToView ).fromAttribute( 'bold' ).toElement( 'b' );
		 *
		 * @readonly
		 * @member {module:engine/conversion/modelconversiondispatcher~ModelConversionDispatcher} #modelToView
		 */
		this.modelToView = new ModelConversionDispatcher( this.model, {
			mapper: this.mapper,
			viewSelection: this.view.selection
		} );

		const doc = this.model.document;

		this.listenTo( doc, 'change', () => {
			this.modelToView.convertChanges( doc.differ );
		}, { priority: 'low' } );

		this.listenTo( model, '_change', () => {
			this.modelToView.convertSelection( doc.selection );
			this.view.render();
		}, { priority: 'low' } );

		// Convert selection from view to model.
		this.listenTo( this.view, 'selectionChange', convertSelectionChange( this.model, this.mapper ) );

		// Attach default model converters.
		this.modelToView.on( 'insert:$text', insertText(), { priority: 'lowest' } );
		this.modelToView.on( 'remove', remove(), { priority: 'low' } );

		// Attach default model selection converters.
		this.modelToView.on( 'selection', clearAttributes(), { priority: 'low' } );
		this.modelToView.on( 'selection', clearFakeSelection(), { priority: 'low' } );
		this.modelToView.on( 'selection', convertRangeSelection(), { priority: 'low' } );
		this.modelToView.on( 'selection', convertCollapsedSelection(), { priority: 'low' } );

		const removedMarkers = new Set();

		this.listenTo( model, 'applyOperation', ( evt, args ) => {
			const operation =  args[ 0 ];

			for ( const marker of model.markers ) {
				if ( removedMarkers.has( marker.name ) ) {
					continue;
				}

				const markerRange = marker.getRange();

				if ( _markerIntersectsWithOperation( marker, operation ) ) {
					removedMarkers.add( marker.name );
					this.modelToView.convertMarkerRemove( marker.name, markerRange );
				}
			}
		}, { priority: 'high' } );

		this.listenTo( model.markers, 'add', ( evt, marker ) => {
			removedMarkers.delete( marker.name );
		} );

		this.listenTo( model.markers, 'remove', ( evt, marker ) => {
			if ( !removedMarkers.has( marker.name ) ) {
				removedMarkers.add( marker.name );
				this.modelToView.convertMarkerRemove( marker.name, marker.getRange() );
			}
		} );

		this.listenTo( model, '_change', () => {
			removedMarkers.clear();
		}, { priority: 'low' } );
	}

	/**
	 * {@link module:engine/view/document~Document#createRoot Creates} a view root
	 * and {@link module:engine/conversion/mapper~Mapper#bindElements binds}
	 * the model root with view root and and view root with DOM element:
	 *
	 *		editing.createRoot( document.querySelector( div#editor ) );
	 *
	 * If the DOM element is not available at the time you want to create a view root, for instance it is iframe body
	 * element, it is possible to create view element and bind the DOM element later:
	 *
	 *		editing.createRoot( 'body' );
	 *		editing.view.attachDomRoot( iframe.contentDocument.body );
	 *
	 * @param {Element|String} domRoot DOM root element or the name of view root element if the DOM element will be
	 * attached later.
	 * @param {String} [name='main'] Root name.
	 * @returns {module:engine/view/containerelement~ContainerElement} View root element.
	 */
	createRoot( domRoot, name = 'main' ) {
		const viewRoot = this.view.createRoot( domRoot, name );
		const modelRoot = this.model.document.getRoot( name );

		this.mapper.bindElements( modelRoot, viewRoot );

		return viewRoot;
	}

	/**
	 * Removes all event listeners attached to the `EditingController`. Destroys all objects created
	 * by `EditingController` that need to be destroyed.
	 */
	destroy() {
		this.view.destroy();
		this.stopListening();
	}
}

mix( EditingController, ObservableMixin );

function _markerIntersectsWithOperation( marker, operation ) {
	const range = marker.getRange();

	if ( operation.type == 'insert' ) {
		return _markerIntersectsWithPosition( range, operation.position );
	} else if ( operation.type == 'move' || operation.type == 'remove' || operation.type == 'reinsert' ) {
		return _markerIntersectsWithPosition( range, operation.targetPosition ) ||
			_markerIntersectsWithPosition( range, operation.sourcePosition );
	} else if ( operation.type == 'rename' ) {
		return range.containsPosition( operation.position );
	} else if ( operation.type == 'marker' && operation.name == marker.name ) {
		return true;
	}

	return false;
}

function _markerIntersectsWithPosition( range, position ) {
	// // This position can't be affected if insertion was in a different root.
	// if ( range.root != position.root ) {
	// 	return false;
	// }
	//
	// if ( range.containsPosition( position ) ) {
	// 	return true;
	// }
	//
	// if ( range.start.parent == position.parent && range.start.offset >= position.offset ) {
	// 	return true;
	// } else if ( compareArrays( position.getParentPath(), range.start.getParentPath() ) == 'prefix' ) {
	// 	const i = position.path.length - 1;
	//
	// 	if ( position.offset <= range.start.path[ i ] ) {
	// 		return true;
	// 	}
	// }
	//
	// return false;
	return !range.start._getTransformedByInsertion( position, 1, true ).isEqual( range.start );
}