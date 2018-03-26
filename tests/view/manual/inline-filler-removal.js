/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console, window, document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';

import ArticlePluginSet from '@ckeditor/ckeditor5-core/tests/_utils/articlepluginset';

ClassicEditor
	.create( document.querySelector( '#editor' ), {
		plugins: [ ArticlePluginSet ],
		toolbar: [ 'bold', 'italic', 'link', 'bulletedList', 'blockQuote', 'undo', 'redo' ]
	} )
	.then( editor => {
		window.editor = editor;

		let fillerRemoval = true;

		// Prevent stealing the focus.
		document.querySelector( '#filler-removal-toggle' ).addEventListener( 'mousedown', evt => {
			evt.preventDefault();
		} );

		document.querySelector( '#filler-removal-toggle' ).addEventListener( 'click', evt => {
			editor.editing.view._renderer.isComposing = fillerRemoval;
			console.log( `Filler removal is now ${ fillerRemoval ? 'blocked' : 'allowed' }.` );
			fillerRemoval = !fillerRemoval;

			// Prevent stealing the focus.
			evt.preventDefault();
		} );
	} )
	.catch( err => {
		console.error( err.stack );
	} );
