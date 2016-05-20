/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import ViewDocument from './view/document.js';
import Mapper from './conversion/mapper.js';
import ModelConversionDispatcher from './conversion/modelconversiondispatcher.js';
import { insertText, remove, move } from './conversion/model-to-view-converters.js';

export default class EditingController {
	constructor( modelDocument ) {
		this.model = modelDocument;
		this.view = new ViewDocument();
		this.mapper = new Mapper();

		this.toView = new ModelConversionDispatcher( {
			writer: this.view.writer,
			mapper: this.mapper
		} );

		this.model.on( 'change', ( evt, type, changeInfo ) => {
			this.toView.convertChange( type, changeInfo );
		} );

		this.toView.on( 'insert:$text', insertText() );
		this.toView.on( 'remove', remove() );
		this.toView.on( 'move', move() );

		modelDocument.on( 'changesDone', () => this.view.render() );
	}

	destroy() {}
}
