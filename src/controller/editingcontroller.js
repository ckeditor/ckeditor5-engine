/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/controller/editingcontroller
 */

import ModelDiffer from '../model/differ';
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
	 * @param {module:engine/model/document~Document} model Document model.
	 */
	constructor( model ) {
		/**
		 * Document model.
		 *
		 * @readonly
		 * @member {module:engine/model/document~Document}
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

		// Model differ object. It's role is to buffer changes done on model and then calculates a diff of those changes.
		// The diff is then passed to model conversion dispatcher which generates proper events and kicks-off conversion.
		const modelDiffer = new ModelDiffer();

		// Before an operation is applied on model, buffer the change in differ.
		this.listenTo( this.model, 'operation', ( evt, operation ) => {
			if ( operation.isDocumentOperation ) {
				modelDiffer.bufferOperation( operation );
			}
		} );

		// Buffer marker changes.
		// This is not covered in buffering operations because markers may change outside of them (when they
		// are modified using `document.markers` collection, not through `MarkerOperation`).
		this.listenTo( this.model.markers, 'add', ( evt, marker ) => {
			// Whenever a new marker is added, buffer that change.
			modelDiffer.bufferMarkerChange( marker.name, null, marker.getRange() );

			// Whenever marker changes, buffer that.
			marker.on( 'change', ( evt, oldRange ) => {
				modelDiffer.bufferMarkerChange( marker.name, oldRange, marker.getRange() );
			} );
		} );

		this.listenTo( this.model.markers, 'remove', ( evt, marker ) => {
			// Whenever marker is removed, buffer that change.
			modelDiffer.bufferMarkerChange( marker.name, marker.getRange(), null );
		} );

		// When all changes are done, get the model diff containing all the changes and convert them to view and then render to DOM.
		this.listenTo( this.model, 'changesDone', () => {
			// First, before the view is changed, remove from the view markers which has changed.
			this.modelToView.removeMarkers( modelDiffer.getMarkersToRemove() );

			// Calculate a diff between old model and new model. Then convert those changes to the view.
			this.modelToView.convertBufferedChanges( modelDiffer.getChanges() );

			// After the view is updated, convert markers which has changed.
			this.modelToView.addMarkers( modelDiffer.getMarkersToAdd() );

			// Reset model diff object. When next operation is applied, new diff will be created.
			modelDiffer.reset();

			// After the view is ready, convert selection from model to view.
			this.modelToView.convertSelection( this.model.selection );

			// When everything is converted to the view, render it to DOM.
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
		const modelRoot = this.model.getRoot( name );

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