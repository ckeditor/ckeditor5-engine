import ModelTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/modeltesteditor';

import BoldEditing from '@ckeditor/ckeditor5-basic-styles/src/bold/boldediting';
import ListEditing from '@ckeditor/ckeditor5-list/src/listediting';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import UndoEditing from '@ckeditor/ckeditor5-undo/src/undoediting';
import BlockQuoteEditing from '@ckeditor/ckeditor5-block-quote/src/blockquoteediting';

import { getData, setData, parse } from '../../../../src/dev-utils/model';
import deltaTransform from '../../../../src/model/delta/transform';
import Position from '../../../../src/model/position';
import Range from '../../../../src/model/range';

export class Client {
	constructor() {
		this.editor = null;
		this.document = null;
		this.syncedVersion = 0;
		this.orderNumber = null;
	}

	init() {
		return ModelTestEditor.create( {
			plugins: [ Paragraph, BoldEditing, ListEditing, UndoEditing, BlockQuoteEditing ]
		} ).then( editor => {
			this.editor = editor;
			this.document = editor.model.document;

			return this;
		} );
	}

	setData( initModelString ) {
		setData( this.editor.model, initModelString );

		this.syncedVersion = this.document.version;
	}

	insert( itemString, path ) {
		const item = parse( itemString, this.editor.model.schema );
		const position = this._getPosition( path, 'start' );

		this._processAction( 'insert', item, position );
	}

	type( text, attributes, path ) {
		const position = this._getPosition( path, 'start' );

		this._processAction( 'insertText', text, attributes, position );
	}

	remove( start, end ) {
		const startPos = this._getPosition( start, 'start' );
		const endPos = this._getPosition( end, 'end' );

		this._processAction( 'remove', new Range( startPos, endPos ) );
	}

	move( target, start, end ) {
		const targetPos = this._getPosition( target );
		const startPos = this._getPosition( start, 'start' );
		const endPos = this._getPosition( end, 'end' );

		this._processAction( 'move', new Range( startPos, endPos ), targetPos );
	}

	rename( path, newName ) {
		const pos = this._getPosition( path, 'beforeParent' );
		const element = pos.nodeAfter;

		this._processAction( 'rename', element, newName );
	}

	setAttribute( key, value, start, end ) {
		const startPos = this._getPosition( start, 'start' );
		const endPos = this._getPosition( end, 'end' );

		this._processAction( 'setAttribute', key, value, new Range( startPos, endPos ) );
	}

	removeAttribute( key, start, end ) {
		const startPos = this._getPosition( start, 'start' );
		const endPos = this._getPosition( end, 'end' );

		this._processAction( 'removeAttribute', key, new Range( startPos, endPos ) );
	}

	setMarker( name, start, end ) {
		let actionName;

		const startPos = this._getPosition( start, 'start' );
		const endPos = this._getPosition( end, 'end' );

		if ( this.editor.model.markers.has( name ) ) {
			actionName = 'updateMarker';
		} else {
			actionName = 'setMarker';
		}

		const range = new Range( startPos, endPos );

		this._processAction( actionName, name, { range, usingOperation: true } );
	}

	removeMarker( name ) {
		this._processAction( 'removeMarker', name );
	}

	wrap( elementName, start, end ) {
		const startPos = this._getPosition( start, 'start' );
		const endPos = this._getPosition( end, 'end' );

		this._processAction( 'wrap', new Range( startPos, endPos ), elementName );
	}

	unwrap( path ) {
		const pos = this._getPosition( path, 'beforeParent' );
		const element = pos.nodeAfter;

		this._processAction( 'unwrap', element );
	}

	merge( path ) {
		const pos = this._getPosition( path, 'start' );

		this._processAction( 'merge', pos );
	}

	split( path ) {
		const pos = this._getPosition( path, 'start' );

		this._processAction( 'split', pos );
	}

	undo() {
		const oldVersion = this.document.version;

		this.editor.execute( 'undo' );

		const deltas = this.document.history.getDeltas( oldVersion );

		bufferedDeltas.add( { deltas, client: this } );
	}

	_getPosition( path, type ) {
		if ( !path ) {
			return this._getPositionFromSelection( type );
		}

		return new Position( this.document.getRoot(), path );
	}

	_getPositionFromSelection( type ) {
		const selRange = this.editor.model.document.selection.getFirstRange();

		switch ( type ) {
			default:
			case 'start':
				return Position.createFromPosition( selRange.start );
			case 'end':
				return Position.createFromPosition( selRange.end );
			case 'beforeParent':
				return Position.createBefore( selRange.start.parent );
		}
	}

	getModelString() {
		return getData( this.editor.model, { withoutSelection: true } );
	}

	destroy() {
		clients.delete( this );

		return this.editor.destroy();
	}

	_processAction( name, ...args ) {
		const oldVersion = this.document.version;

		this.editor.model.change( writer => {
			writer[ name ]( ...args );
		} );

		const deltas = Array.from( this.document.history.getDeltas( oldVersion ) );

		bufferedDeltas.add( { deltas, client: this } );
	}

	static get() {
		const client = new Client();
		client.orderNumber = clients.size;

		clients.add( client );

		return client.init();
	}
}

const clients = new Set();
const bufferedDeltas = new Set();

export function syncClients() {
	for ( const client of clients ) {
		for ( const item of bufferedDeltas ) {
			const remoteDeltas = item.deltas;
			const remoteClient = item.client;

			if ( remoteClient == client ) {
				continue;
			}

			switchDeltasRoots( remoteDeltas, client.document.getRoot() );

			const clientDeltas = Array.from( client.document.history.getDeltas( client.syncedVersion ) );

			let remoteDeltasTransformed = null;

			if ( client.orderNumber < remoteClient.orderNumber ) {
				remoteDeltasTransformed = deltaTransform.transformDeltaSets( clientDeltas, remoteDeltas ).deltasB;
			} else {
				remoteDeltasTransformed = deltaTransform.transformDeltaSets( remoteDeltas, clientDeltas ).deltasA;
			}

			client.editor.model.change( writer => {
				for ( const delta of remoteDeltasTransformed ) {
					writer.batch.addDelta( delta );

					for ( const operation of delta.operations ) {
						client.editor.model.applyOperation( operation );
					}
				}
			} );
		}

		client.syncedVersion = client.document.version;
	}

	bufferedDeltas.clear();
}

export function expectClients( expectedModelString ) {
	for ( const client of clients ) {
		expect( client.getModelString() ).to.equal( expectedModelString );
	}

	let syncedVersion = null;

	for ( const client of clients ) {
		if ( syncedVersion === null ) {
			syncedVersion = client.syncedVersion;
			continue;
		}

		expect( client.syncedVersion ).to.equal( syncedVersion );
	}
}

function switchDeltasRoots( deltas, newRoot ) {
	for ( const delta of deltas ) {
		for ( const operation of delta.operations ) {
			switchOperationRoots( operation, newRoot );
		}
	}
}

function switchOperationRoots( operation, newRoot ) {
	if ( operation.position ) {
		operation.position.root = newRoot;
	}

	if ( operation.sourcePosition ) {
		operation.sourcePosition.root = newRoot;
	}

	if ( operation.targetPosition ) {
		operation.targetPosition.root = newRoot;
	}

	if ( operation.range ) {
		operation.range.start.root = newRoot;
		operation.range.end.root = newRoot;
	}

	if ( operation.oldRange ) {
		operation.oldRange.start.root = newRoot;
		operation.oldRange.end.root = newRoot;
	}

	if ( operation.newRange ) {
		operation.newRange.start.root = newRoot;
		operation.newRange.end.root = newRoot;
	}
}