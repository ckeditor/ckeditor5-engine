/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import CKEditorError from '../ckeditorerror.js';

/**
 * Class implementin a UI component factory.
 *
 * Factories of specific UI components can be registered under their unique names. Registered
 * components can be later instantiated by providing the name of the component. The model is shared between all
 * instances of that component and has to be provided upon registering its factory.
 *
 * The main use case for the component factory is the {@link core.EditorUI#featureComponents} factory.
 *
 * @class core.ui.ComponentFactory
 */

export default class ComponentFactory {
	/**
	 * @constructor
	 * @param {core.Editor} editor The editor instance.
	 */
	constructor( editor ) {
		/**
		 * @readonly
		 * @type {core.Editor}
		 */
		this.editor = editor;

		/**
		 * @private
		 * @type {Map}
		 */
		this._components = new Map();
	}

	/**
	 * Registers a component factory.
	 *
	 * @param {String} name The name of the component.
	 * @param {Function} ControllerClass The component controller constructor.
	 * @param {Function} ViewClass The component view constructor.
	 * @param {core.ui.Model} model The model of the component.
	 */
	add( name, ControllerClass, ViewClass, model ) {
		if ( this._components.get( name ) ) {
			throw new CKEditorError(
				'componentfactory-item-exists: The item already exists in the component factory.', { name }
			);
		}

		this._components.set( name, {
			ControllerClass,
			ViewClass,
			model
		} );
	}

	/**
	 * Creates a component instance.
	 *
	 * @param {String} name The name of the component.
	 * @returns {core.ui.Controller} The instantiated component.
	 */
	create( name ) {
		const component = this._components.get( name );

		const model = component.model;
		const view = new component.ViewClass( model );
		const controller = new component.ControllerClass( this.editor, model, view );

		return controller;
	}
}
