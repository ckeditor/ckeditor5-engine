/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global console, window, document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Enter from '@ckeditor/ckeditor5-enter/src/enter';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import ModelPosition from '../../src/model/position';

ClassicEditor.create( document.querySelector( '#editor' ), {
	plugins: [ Enter, Typing, Paragraph, Undo, Heading, Bold, Italic ],
	toolbar: [ 'headings', 'bold', 'italic', 'undo', 'redo' ]
} )
	.then( editor => {
		window.editor = editor;
	} )
	.catch( err => {
		console.error( err.stack );
	} );

document.getElementById( 'move-to-start' ).onclick = function() {
	moveTo( 0 );
};

document.getElementById( 'move-to-end' ).onclick = function() {
	moveTo( 'end' );
};

function moveTo( where ) {
	const doc = window.editor.document;

	doc.enqueueChanges( () => {
		const selPos = doc.selection.getFirstPosition();
		const targetPos = ModelPosition.createAt( doc.getRoot(), where );
		doc.batch().move( selPos.parent, targetPos );
	} );
}
