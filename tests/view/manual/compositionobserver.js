/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console, window, document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classic';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

ClassicEditor.create( document.querySelector( '#editor' ), {
	plugins: [ Typing, Paragraph ]
} )
.then( editor => {
	window.editor = editor;

	const viewDocument = editor.editing.view;

	viewDocument.on( 'compositionstart', ( evt, data ) => console.log( 'compositionstart', data ) );
	viewDocument.on( 'compositionupdate', ( evt, data ) => console.log( 'compositionupdate', data ) );
	viewDocument.on( 'compositionend', ( evt, data ) => console.log( 'compositionend', data ) );
	viewDocument.focus();
} )
.catch( err => {
	console.error( err.stack );
} );
