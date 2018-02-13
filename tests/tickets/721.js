import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import { getData as getModelData, setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import Image from '@ckeditor/ckeditor5-image/src/image';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';

/* global document */

// See https://github.com/ckeditor/ckeditor5/issues/721.
describe( 'ckeditor5#721', () => {
	let editor, model, div;

	beforeEach( () => {
		div = document.createElement( 'div' );
		div.setAttribute( 'contenteditable', 'true' );
		document.body.appendChild( div );

		return ClassicTestEditor
			.create( div, {
				plugins: [ Paragraph, Undo, Typing, Image, ImageCaption ],
				typing: { undoStep: 3 }
			} )
			.then( newEditor => {
				editor = newEditor;
				model = editor.model;
			} );
	} );

	afterEach( () => {
		document.body.removeChild( div );
	} );

	it.only( 'should properly render if the focus is in nested editable', () => {
		setModelData( model,
			'<paragraph>foo[]</paragraph>' +
			'<image src="foo.png"><caption>bar</caption></image>'
		);

		const viewDoc = editor.editing.view;
		const viewRoot = viewDoc.getRoot();
		const converter = viewDoc.domConverter;
		const editorRoot = viewDoc.getDomRoot();

		const figure = viewRoot.getChild( 1 );
		const caption = figure.getChild( 1 );
		const domCaption = converter.mapViewToDom( caption );

		// Execute
		editor.execute( 'input', {
			text: 'xyz'
		} );

		expect( getModelData( model ) ).to.equal( '' );

		// Focus on the caption
		domCaption.focus();

		// Set selection inside the caption.
		const domSelection = document.getSelection();
		const domRange = document.createRange();

		domSelection.removeAllRanges();
		domSelection.addRange( domRange );

		domRange.setStart( domCaption, 0 );
		domRange.setEnd( domCaption, 0 );

		expect( document.activeElement ).to.equal( domCaption );

		editor.execute( 'undo' );

		expect( document.activeElement ).to.equal( editorRoot );
	} );
} );
