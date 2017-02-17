/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global document, console, window */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classic';
import EnterPlugin from '@ckeditor/ckeditor5-enter/src/enter';
import TypingPlugin from '@ckeditor/ckeditor5-typing/src/typing';
import ParagraphPlugin from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import HeadingPlugin from '@ckeditor/ckeditor5-heading/src/heading';
import ImagePlugin from '@ckeditor/ckeditor5-image/src/image';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle/imagestyle';
import UndoPlugin from '@ckeditor/ckeditor5-undo/src/undo';
import ClipboardPlugin from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import ItalicPlugin from '@ckeditor/ckeditor5-basic-styles/src/italic';
import ListPlugin from '@ckeditor/ckeditor5-list/src/list';
import LinkPlugin from '@ckeditor/ckeditor5-link/src/link';
import graphicalModelRepresentation from '../../../src/dev-utils/graphicalmodelrepresentation';
import './graphicalmodelrepresentation.scss';

ClassicEditor.create( document.querySelector( '#editor' ), {
	plugins: [
		EnterPlugin,
		TypingPlugin,
		ParagraphPlugin,
		HeadingPlugin,
		ImagePlugin,
		ImageStyle,
		ImageToolbar,
		UndoPlugin,
		ClipboardPlugin,
		BoldPlugin,
		ItalicPlugin,
		ListPlugin,
		LinkPlugin
	],
	toolbar: [ 'headings', 'undo', 'redo', 'bold', 'italic', 'bulletedList', 'numberedList', 'link', 'unlink' ]
} )
.then( editor => {
	window.editor = editor;
	graphicalModelRepresentation( editor.document );
} )
.catch( err => {
	console.error( err.stack );
} );
