/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console, window, document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classic';
import Enter from '@ckeditor/ckeditor5-enter/src/enter';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import List from '@ckeditor/ckeditor5-list/src/list';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';

ClassicEditor.create( document.querySelector( '#editor' ), {
	plugins: [ Enter, Typing, Paragraph, Bold, Italic, List, Heading, Undo ],
	toolbar: [ 'headings', 'bold', 'italic', 'bulletedList', 'numberedList', 'undo', 'redo' ]
} )
.then( editor => {
	window.editor = editor;

	editor.document.on( 'changesDone', ( evt ) => {
		evt.stop();
	}, { priority: 'highest' } );

	editor.document.on( 'change', ( evt ) => {
		evt.stop();
	}, { priority: 'highest' } );
} )
.catch( err => {
	console.error( err.stack );
} );

window.loadData = function loadData() {
	const data = document.getElementById( 'data' ).value;

	console.log( `Loading ${ data.length } bytes of HTML.` );

	window.editor.setData( data );
};

window.loadData100Times = function loadData100Times() {
	for ( let i = 0; i < 100; i++ ) {
		window.loadData();
	}
};
