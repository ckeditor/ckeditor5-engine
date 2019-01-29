/* globals document, console, window */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ModelRange from '../../../../src/model/range';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';

const OUTER_MODEL = 'speaker';
const INNER_MODEL = 'special-char';

class SpeakerCommand extends Command {
	execute( { speaker } ) {
		const model = this.editor.model;
		const document = model.document;

		model.change( writer => {
			const blocks = Array.from( document.selection.getSelectedBlocks() );
			// NB: This is now private API, but a public equivalent doesn't currently exist
			const range = ModelRange._createFromRanges( blocks.map( block => writer.createRangeOn( block ) ) );
			const commonAncestor = range.getCommonAncestor();

			if ( commonAncestor.is( OUTER_MODEL ) ) {
				writer.setAttributes( { speaker }, commonAncestor );
			} else {
				const newResponsorial = writer.createElement( OUTER_MODEL, { speaker } );
				writer.wrap( range, newResponsorial );
			}
		} );
	}
}

class Speaker extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	static get pluginName() {
		return 'Speaker';
	}

	init() {
		const editor = this.editor;
		editor.commands.add( 'applySpeaker', new SpeakerCommand( editor ) );
		editor.model.schema.register( OUTER_MODEL, {
			allowIn: '$root',
			allowAttributes: [ 'speaker' ],
			isObject: true
		} );
		editor.model.schema.extend( '$block', {
			allowIn: OUTER_MODEL
		} );

		editor.conversion.for( 'editingDowncast' ).elementToElement( {
			model: OUTER_MODEL,
			view: ( modelItem, writer ) => {
				const lines = toWidgetEditable( writer.createEditableElement( 'div', {
					class: 'lines'
				} ), writer );

				return lines;
			}
		} );

		editor.ui.componentFactory.add( OUTER_MODEL, locale => {
			const view = new ButtonView( locale );
			view.set( {
				label: 'Speaker',
				withText: true
			} );
			this.listenTo( view, 'execute', () => editor.execute( 'applySpeaker', { speaker: 'Person 1' } ) );
			return view;
		} );
	}
}

class InsertSpecialCharCommand extends Command {
	execute() {
		const model = this.editor.model;
		model.change( writer => {
			model.insertContent( writer.createElement( INNER_MODEL ), model.document.selection );
		} );
	}
}

class SpecialChar extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	static get pluginName() {
		return 'SpecialChar';
	}

	init() {
		const editor = this.editor;
		editor.commands.add( 'insertSpecial', new InsertSpecialCharCommand( editor ) );
		editor.model.schema.register( INNER_MODEL, {
			allowWhere: '$text',
			isObject: true
		} );

		editor.conversion.for( 'editingDowncast' ).elementToElement( {
			model: INNER_MODEL,
			view: ( modelElement, writer ) => {
				const specialChar = writer.createContainerElement( 'div', { class: 'special-char' } );
				writer.insert( writer.createPositionAt( specialChar, 0 ), writer.createText( 'T' ) );
				return toWidget( specialChar, writer );
			}
		} );

		editor.ui.componentFactory.add( INNER_MODEL, locale => {
			const view = new ButtonView( locale );
			view.set( {
				label: 'Special Char',
				withText: true
			} );
			this.listenTo( view, 'execute', () => editor.execute( 'insertSpecial' ) );
			return view;
		} );
	}
}

ClassicEditor
	.create( document.querySelector( '#editor' ), {
		plugins: [ Essentials, SpecialChar, Speaker, Paragraph ],
		toolbar: [ INNER_MODEL, OUTER_MODEL ]
	} )
	.then( editor => {
		window.editor = editor;
		editor.setData( '' );
	} )
	.catch( err => {
		console.error( err.stack );
	} );
