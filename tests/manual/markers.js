/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console, window, document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Enter from '@ckeditor/ckeditor5-enter/src/enter';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import List from '@ckeditor/ckeditor5-list/src/list';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';

import buildModelConverter from '../../src/conversion/buildmodelconverter';
import Position from '../../src/model/position';
import LiveRange from '../../src/model/liverange';
import ViewAttributeElement from '../../src/view/attributeelement';

const markerNames = [];
let model = null;
let _uid = 1;

ClassicEditor.create( document.querySelector( '#editor' ), {
	plugins: [ Enter, Typing, Paragraph, Bold, Italic, List, Heading, Undo ],
	toolbar: [ 'headings', 'bold', 'italic', 'bulletedList', 'numberedList', 'undo', 'redo' ]
} )
.then( editor => {
	window.editor = editor;
	model = window.editor.editing.model;

	buildModelConverter().for( editor.editing.modelToView )
		.fromMarker( 'highlight' )
		.toElement( data => {
			const color = data.name.split( ':' )[ 1 ];

			return new ViewAttributeElement( 'span', { class: 'h-' + color } );
		} );

	const addYellowButton = window.document.getElementById( 'add-yellow' );
	addYellowButton.addEventListener( 'click', () => addHighlight( 'yellow' ) );
	addYellowButton.addEventListener( 'mousedown', e => e.preventDefault() );

	const addRedButton = window.document.getElementById( 'add-red' );
	addRedButton.addEventListener( 'click', () => addHighlight( 'red' ) );
	addRedButton.addEventListener( 'mousedown', e => e.preventDefault() );

	const removeMarkerButton = window.document.getElementById( 'remove-marker' );
	removeMarkerButton.addEventListener( 'click', () => removeHighlight() );
	removeMarkerButton.addEventListener( 'mousedown', e => e.preventDefault() );

	const moveToStartButton = window.document.getElementById( 'move-to-start' );
	moveToStartButton.addEventListener( 'click', () => moveSelectionToStart() );
	moveToStartButton.addEventListener( 'mousedown', e => e.preventDefault() );

	const moveLeftButton = window.document.getElementById( 'move-left' );
	moveLeftButton.addEventListener( 'click', () => moveSelectionByOffset( -1 ) );
	moveLeftButton.addEventListener( 'mousedown', e => e.preventDefault() );

	const moveRightButton = window.document.getElementById( 'move-right' );
	moveRightButton.addEventListener( 'click', () => moveSelectionByOffset( 1 ) );
	moveRightButton.addEventListener( 'mousedown', e => e.preventDefault() );

	model.enqueueChanges( () => {
		const root = model.getRoot();
		const range = new LiveRange( new Position( root, [ 0, 10 ] ), new Position( root, [ 0, 16 ] ) );
		const name = 'highlight:yellow:' + uid();

		markerNames.push( name );
		model.markers.set( name, range );
	} );
} )
.catch( err => {
	console.error( err.stack );
} );

function uid() {
	return _uid++;
}

function addHighlight( color ) {
	model.enqueueChanges( () => {
		const range = LiveRange.createFromRange( model.selection.getFirstRange() );
		const name = 'highlight:' + color + ':' + uid();

		markerNames.push( name );
		model.markers.set( name, range );
	} );
}

function removeHighlight() {
	model.enqueueChanges( () => {
		const pos = model.selection.getFirstPosition();

		for ( let i = 0; i < markerNames.length; i++ ) {
			const name = markerNames[ i ];
			const marker = model.markers.get( name );
			const range = marker.getRange();

			if ( range.containsPosition( pos ) || range.start.isEqual( pos ) || range.end.isEqual( pos ) ) {
				model.markers.remove( name );

				markerNames.splice( i, 1 );
				break;
			}
		}
	} );
}

function moveSelectionToStart() {
	const range = model.selection.getFirstRange();

	if ( range.isFlat ) {
		model.enqueueChanges( () => {
			model.batch().move( range, new Position( model.getRoot(), [ 0, 0 ] ) );
		} );
	}
}

function moveSelectionByOffset( offset ) {
	const range = model.selection.getFirstRange();
	const pos = offset < 0 ? range.start : range.end;

	if ( range.isFlat ) {
		model.enqueueChanges( () => {
			model.batch().move( range, pos.getShiftedBy( offset ) );
		} );
	}
}
