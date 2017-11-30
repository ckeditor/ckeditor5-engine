/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Document from '../../src/model/document';
import Differ from '../../src/model/differ';
import Element from '../../src/model/element';
import Text from '../../src/model/text';
import Position from '../../src/model/position';
import Range from '../../src/model/range';

import InsertOperation from '../../src/model/operation/insertoperation';
import RemoveOperation from '../../src/model/operation/removeoperation';
import MoveOperation from '../../src/model/operation/moveoperation';
import RenameOperation from '../../src/model/operation/renameoperation';
import AttributeOperation from '../../src/model/operation/attributeoperation';

import { wrapInDelta } from '../../tests/model/_utils/utils';

describe( 'Differ', () => {
	let doc, differ, root;

	beforeEach( () => {
		doc = new Document();
		differ = new Differ();

		root = doc.createRoot();

		root.appendChildren( [
			new Element( 'paragraph', null, [
				new Text( 'foo' )
			] ),
			new Element( 'paragraph', null, [
				new Text( 'bar' )
			] )
		] );
	} );

	describe( 'insert', () => {
		// Simple.
		it( 'an element', () => {
			const position = new Position( root, [ 1 ] );

			insert( new Element( 'image' ), position );

			expectChanges( [
				{ type: 'insert', name: 'image', length: 1, position }
			] );
		} );

		it( 'a non-empty element with attributes', () => {
			const position = new Position( root, [ 1 ] );

			insert(
				new Element( 'image', { src: 'foo.jpg' }, new Element( 'caption', null, new Text( 'bar' ) ) ),
				position
			);

			expectChanges( [
				{ type: 'insert', name: 'image', length: 1, position }
			] );
		} );

		it( 'multiple elements', () => {
			const position = new Position( root, [ 1 ] );

			insert( [ new Element( 'image' ), new Element( 'paragraph' ) ], position );

			expectChanges( [
				{ type: 'insert', name: 'image', length: 1, position },
				{ type: 'insert', name: 'paragraph', length: 1, position: position.getShiftedBy( 1 ) }
			] );
		} );

		it( 'a character', () => {
			const position = new Position( root, [ 0, 2 ] );

			insert( new Text( 'x' ), position );

			expectChanges( [
				{ type: 'insert', name: '$text', length: 1, position }
			] );
		} );

		it( 'multiple characters', () => {
			const position = new Position( root, [ 0, 2 ] );

			insert( new Text( 'xyz' ), position );

			expectChanges( [
				{ type: 'insert', name: '$text', length: 3, position }
			] );
		} );

		it( 'multiple consecutive characters in multiple operations', () => {
			const position = new Position( root, [ 0, 2 ] );

			insert( new Text( 'xy' ), position );
			insert( new Text( 'z' ), position.getShiftedBy( 2 ) );
			insert( new Text( 'ab' ), position );

			expectChanges( [
				{ type: 'insert', name: '$text', length: 5, position }
			] );
		} );

		it( 'multiple non-consecutive characters in multiple operations', () => {
			const position = new Position( root, [ 0, 0 ] );

			insert( new Text( 'xy' ), position );
			insert( new Text( 'z' ), position.getShiftedBy( 3 ) );

			expectChanges( [
				{ type: 'insert', name: '$text', length: 2, position },
				{ type: 'insert', name: '$text', length: 1, position: position.getShiftedBy( 3 ) }
			] );
		} );

		// Combined.
		it( 'node in a new element', () => {
			const image = new Element( 'image' );
			const position = new Position( root, [ 0, 2 ] );

			insert( image, position );

			const caption = new Element( 'caption' );
			insert( caption, Position.createAt( image, 0 ) );

			insert( new Text( 'foo' ), Position.createAt( caption, 0 ) );

			expectChanges( [
				{ type: 'insert', name: 'image', length: 1, position }
			] );
		} );

		it( 'node in a renamed element', () => {
			const text = new Text( 'xyz', { bold: true } );
			const position = new Position( root, [ 0, 3 ] );

			insert( text, position );
			rename( root.getChild( 0 ), 'listItem' );

			// Note that since renamed element is removed and then re-inserted, there is no diff for text inserted inside it.
			expectChanges( [
				{ type: 'remove', name: 'paragraph', length: 1, position: new Position( root, [ 0 ] ) },
				{ type: 'insert', name: 'listItem', length: 1, position: new Position( root, [ 0 ] ) }
			] );
		} );

		it( 'node in a element with changed attribute', () => {
			const text = new Text( 'xyz', { bold: true } );
			const position = new Position( root, [ 0, 3 ] );
			const range = Range.createFromParentsAndOffsets( root, 0, root.getChild( 0 ), 0 );

			insert( text, position );
			attribute( range, 'align', null, 'center' );

			// Compare to scenario above, this time there is only an attribute change on parent element, so there is also a diff for text.
			expectChanges( [
				{ type: 'attribute', range, attributeKey: 'align', attributeOldValue: null, attributeNewValue: 'center' },
				{ type: 'insert', name: '$text', length: 3, position },
			] );
		} );
	} );

	describe( 'remove', () => {
		it( 'an element', () => {
			const position = new Position( root, [ 0 ] );

			remove( position, 1 );

			expectChanges( [
				{ type: 'insert', name: 'paragraph', length: 1, position: Position.createAt( doc.graveyard, 0 ) },
				{ type: 'remove', name: 'paragraph', length: 1, position }
			] );
		} );

		it( 'multiple elements', () => {
			const position = new Position( root, [ 0 ] );

			remove( position, 2 );

			expectChanges( [
				{ type: 'insert', name: 'paragraph', length: 1, position: Position.createAt( doc.graveyard, 0 ) },
				{ type: 'insert', name: 'paragraph', length: 1, position: Position.createAt( doc.graveyard, 1 ) },
				{ type: 'remove', name: 'paragraph', length: 1, position },
				{ type: 'remove', name: 'paragraph', length: 1, position }
			] );
		} );

		it( 'a character', () => {
			const position = new Position( root, [ 0, 1 ] );

			remove( position, 1 );

			expectChanges( [
				{ type: 'insert', name: '$text', length: 1, position: Position.createAt( doc.graveyard, 0 ) },

				// The position path is not [ 0, 1 ] because diffing does not really know which "o" was removed.
				// Before it was "foo", now it is "fo", differ assumes that the second "o" was removed.
				{ type: 'remove', name: '$text', length: 1, position: new Position( root, [ 0, 2 ] ) }
			] );
		} );

		it( 'multiple characters', () => {
			const position = new Position( root, [ 0, 1 ] );

			remove( position, 2 );

			expectChanges( [
				{ type: 'insert', name: '$text', length: 2, position: Position.createAt( doc.graveyard, 0 ) },
				{ type: 'remove', name: '$text', length: 2, position }
			] );
		} );

		it( 'multiple consecutive characters in multiple operations', () => {
			const position = new Position( root, [ 0, 0 ] );

			remove( position, 1 );
			remove( position, 1 );
			remove( position, 1 );

			expectChanges( [
				{ type: 'insert', name: '$text', length: 3, position: Position.createAt( doc.graveyard, 0 ) },
				{ type: 'remove', name: '$text', length: 3, position }
			] );
		} );

		it( 'multiple non-consecutive characters in multiple operations', () => {
			const position = new Position( root, [ 0, 0 ] );

			remove( position, 1 );
			remove( position.getShiftedBy( 1 ), 1 );

			expectChanges( [
				{ type: 'insert', name: '$text', length: 2, position: Position.createAt( doc.graveyard, 0 ) },
				{ type: 'remove', name: '$text', length: 1, position },
				{ type: 'remove', name: '$text', length: 1, position: position.getShiftedBy( 1 ) }
			] );
		} );
	} );

	// The only main difference between remove operation and move operation is target position.
	// In differ, graveyard is treated as other roots. In remove suite, simple cases for move are covered.
	// This suite will have only a few cases, focused on things specific to move operation.
	describe( 'move', () => {
		it( 'an element to the same parent - target position is after source position', () => {
			const sourcePosition = new Position( root, [ 0 ] );
			const targetPosition = new Position( root, [ 2 ] );

			move( sourcePosition, 1, targetPosition );

			// Changes returned by diff here are a bit unexpected. It is because same scenario might be evaluated in
			// two (or more) ways. To simplify the example above let's assume that the change was 'ab' -> 'ba'.
			// It can be seen as: insert "b", equal "a", delete "b".
			// Or: delete "a", equal "b", insert "a".
			//
			// In this scenario, we moved the first paragraph after the second (so it is similar to delete "a", equal "b", insert "a").
			// However differ "prefers" the second solution, so it returns diff items like it is insert "b", equal "a", delete "b'.
			expectChanges( [
				{ type: 'insert', name: 'paragraph', length: 1, position: new Position( root, [ 0 ] ) },
				{ type: 'remove', name: 'paragraph', length: 1, position: new Position( root, [ 2 ] ) }
			] );
		} );

		it( 'an element to the same parent - target position is before source position', () => {
			const sourcePosition = new Position( root, [ 1 ] );
			const targetPosition = new Position( root, [ 0 ] );

			move( sourcePosition, 1, targetPosition );

			// Even though operations are different, the result is same as in example above, because of how diffing works.
			expectChanges( [
				{ type: 'insert', name: 'paragraph', length: 1, position: new Position( root, [ 0 ] ) },
				{ type: 'remove', name: 'paragraph', length: 1, position: new Position( root, [ 2 ] ) }
			] );
		} );

		it( 'multiple consecutive characters between different roots in multiple operations', () => {
			const sourcePosition = new Position( root, [ 0, 1 ] );
			const targetPosition = new Position( root, [ 1, 0 ] );

			move( sourcePosition, 1, targetPosition );
			move( sourcePosition, 1, targetPosition.getShiftedBy( 1 ) );

			expectChanges( [
				{ type: 'remove', name: '$text', length: 2, position: sourcePosition },
				{ type: 'insert', name: '$text', length: 2, position: targetPosition }
			] );
		} );

		it( 'reinsert removed element', () => {
			doc.graveyard.appendChildren( new Element( 'listItem' ) );

			const sourcePosition = new Position( doc.graveyard, [ 0 ] );
			const targetPosition = new Position( root, [ 2 ] );

			move( sourcePosition, 1, targetPosition );

			expectChanges( [
				{ type: 'remove', name: 'listItem', length: 1, position: sourcePosition },
				{ type: 'insert', name: 'listItem', length: 1, position: targetPosition }
			] );
		} );
	} );

	describe( 'rename', () => {
		it( 'an element', () => {
			rename( root.getChild( 1 ), 'listItem' );

			expectChanges( [
				{ type: 'remove', name: 'paragraph', length: 1, position: new Position( root, [ 1 ] ) },
				{ type: 'insert', name: 'listItem', length: 1, position: new Position( root, [ 1 ] ) }
			] );
		} );
	} );

	describe( 'attribute', () => {
		const attributeKey = 'key';
		const attributeOldValue = null;
		const attributeNewValue = 'foo';

		it( 'on an element', () => {
			const range = Range.createFromParentsAndOffsets( root, 0, root.getChild( 0 ), 0 );

			attribute( range, attributeKey, attributeOldValue, attributeNewValue );

			expectChanges( [
				{ type: 'attribute', range, attributeKey, attributeOldValue, attributeNewValue }
			] );
		} );

		it( 'on a character', () => {
			const parent = root.getChild( 1 );
			const range = Range.createFromParentsAndOffsets( parent, 1, parent, 2 );

			attribute( range, attributeKey, attributeOldValue, attributeNewValue );

			// In this scenario:
			// bar -> b<$text bold="true">a</$text>r
			// Diffing function returns: equal (b), insert (a bold), remove (a), equal (r).
			// Then, this result is optimized. Insert+remove pair is found and it is replaced by attribute change.
			// So the final actions are: equal (b), change attribute (a -> bold), equal (r).
			expectChanges( [
				{ type: 'attribute', range, attributeKey, attributeOldValue, attributeNewValue }
			] );
		} );

		it( 'on a character - case with same characters next to each other', () => {
			const parent = root.getChild( 0 );
			const range = Range.createFromParentsAndOffsets( parent, 1, parent, 2 );

			attribute( range, attributeKey, attributeOldValue, attributeNewValue );

			// Even though it is a change of attribute on a single character, differ is not precise and sees it as
			// insert and remove. Example is:
			// foo -> f<$text bold="true">o</$text>o
			// Diffing function returns: equal (f), insert (bold o), equal (o), delete (o).
			// Because of that it is impossible to detect insert+delete pair and switch it to attribute change.
			expectChanges( [
				{ type: 'insert', name: '$text', position: new Position( root, [ 0, 1 ] ), length: 1 },
				{ type: 'remove', name: '$text', position: new Position( root, [ 0, 3 ] ), length: 1 },
			] );
		} );

		it( 'on multiple characters', () => {
			const parent = root.getChild( 0 );
			const range = Range.createFromParentsAndOffsets( parent, 0, parent, 3 );

			attribute( range, attributeKey, attributeOldValue, attributeNewValue );

			expectChanges( [
				{ type: 'attribute', range, attributeKey, attributeOldValue, attributeNewValue }
			] );
		} );

		it( 'on multiple consecutive characters in multiple operations', () => {
			const parent = root.getChild( 0 );

			const range1 = Range.createFromParentsAndOffsets( parent, 1, parent, 2 );
			const range2 = Range.createFromParentsAndOffsets( parent, 2, parent, 3 );

			attribute( range1, attributeKey, attributeOldValue, attributeNewValue );
			attribute( range2, attributeKey, attributeOldValue, attributeNewValue );

			const range = Range.createFromParentsAndOffsets( parent, 1, parent, 3 );

			expectChanges( [
				{ type: 'attribute', range, attributeKey, attributeOldValue, attributeNewValue }
			] );
		} );

		it( 'on multiple non-consecutive characters in multiple operations', () => {
			const parent = root.getChild( 0 );

			const range1 = Range.createFromParentsAndOffsets( parent, 0, parent, 1 );
			const range2 = Range.createFromParentsAndOffsets( parent, 2, parent, 3 );

			// Note "reversed" order of ranges. Further range is changed first.
			attribute( range2, attributeKey, attributeOldValue, attributeNewValue );
			attribute( range1, attributeKey, attributeOldValue, attributeNewValue );

			// Note that changes has been sorted.
			expectChanges( [
				{ type: 'attribute', range: range1, attributeKey, attributeOldValue, attributeNewValue },
				{ type: 'attribute', range: range2, attributeKey, attributeOldValue, attributeNewValue }
			] );
		} );

		it( 'on range containing various nodes', () => {
			const range = Range.createFromParentsAndOffsets( root, 0, root, 2 );

			attribute( range, attributeKey, attributeOldValue, attributeNewValue );

			const p1 = root.getChild( 0 );
			const p2 = root.getChild( 1 );
			const type = 'attribute';

			expectChanges( [
				{ type, range: Range.createFromParentsAndOffsets( root, 0, p1, 0 ) , attributeKey, attributeOldValue, attributeNewValue },
				{ type, range: Range.createFromParentsAndOffsets( p1, 0, p1, 3 ) , attributeKey, attributeOldValue, attributeNewValue },
				{ type, range: Range.createFromParentsAndOffsets( root, 1, p2, 0 ) , attributeKey, attributeOldValue, attributeNewValue },
				{ type, range: Range.createFromParentsAndOffsets( p2, 0, p2, 3 ) , attributeKey, attributeOldValue, attributeNewValue }
			] );
		} );

		it( 'remove and add attribute on text', () => {
			const p = root.getChild( 1 );

			p.getChild( 0 ).setAttribute( 'bold', true );

			const range = Range.createFromParentsAndOffsets( p, 1, p, 3 );

			attribute( range, 'bold', true, null );
			attribute( range, 'italic', null, true );

			const range1 = Range.createFromParentsAndOffsets( p, 1, p, 2 );
			const range2 = Range.createFromParentsAndOffsets( p, 2, p, 3 );

			// Attribute change glueing does not work 100% correct.
			expectChanges( [
				{ type: 'attribute', range: range1, attributeKey: 'bold', attributeOldValue: true, attributeNewValue: null },
				{ type: 'attribute', range: range1, attributeKey: 'italic', attributeOldValue: null, attributeNewValue: true },
				{ type: 'attribute', range: range2, attributeKey: 'bold', attributeOldValue: true, attributeNewValue: null },
				{ type: 'attribute', range: range2, attributeKey: 'italic', attributeOldValue: null, attributeNewValue: true }
			] );
		} );
	} );

	describe( 'markers', () => {
		let range, rangeB;

		beforeEach( () => {
			range = Range.createFromParentsAndOffsets( root, 0, root, 1 );
			rangeB = Range.createFromParentsAndOffsets( root, 1, root, 2 );
		} );

		it( 'add marker', () => {
			differ.bufferMarkerChange( 'name', null, range );

			expect( differ.getMarkersToRemove() ).to.deep.equal( [] );

			expect( differ.getMarkersToAdd() ).to.deep.equal( [
				{ name: 'name', range: range }
			] );
		} );

		it( 'remove marker', () => {
			differ.bufferMarkerChange( 'name', range, null );

			expect( differ.getMarkersToRemove() ).to.deep.equal( [
				{ name: 'name', range: range }
			] );

			expect( differ.getMarkersToAdd() ).to.deep.equal( [] );
		} );

		it( 'change marker', () => {
			differ.bufferMarkerChange( 'name', range, rangeB );

			expect( differ.getMarkersToRemove() ).to.deep.equal( [
				{ name: 'name', range: range }
			] );

			expect( differ.getMarkersToAdd() ).to.deep.equal( [
				{ name: 'name', range: rangeB }
			] );
		} );

		it( 'add marker and remove it', () => {
			differ.bufferMarkerChange( 'name', null, range );
			differ.bufferMarkerChange( 'name', range, null );

			expect( differ.getMarkersToRemove() ).to.deep.equal( [] );
			expect( differ.getMarkersToAdd() ).to.deep.equal( [] );
		} );

		it( 'add marker and change it', () => {
			differ.bufferMarkerChange( 'name', null, range );
			differ.bufferMarkerChange( 'name', range, rangeB );

			expect( differ.getMarkersToRemove() ).to.deep.equal( [] );

			expect( differ.getMarkersToAdd() ).to.deep.equal( [
				{ name: 'name', range: rangeB }
			] );
		} );

		it( 'change marker and remove it', () => {
			differ.bufferMarkerChange( 'name', range, rangeB );
			differ.bufferMarkerChange( 'name', rangeB, null );

			expect( differ.getMarkersToRemove() ).to.deep.equal( [
				{ name: 'name', range: range }
			] );

			expect( differ.getMarkersToAdd() ).to.deep.equal( [] );
		} );

		it( 'remove marker and add it at same range', () => {
			differ.bufferMarkerChange( 'name', range, null );
			differ.bufferMarkerChange( 'name', null, range );

			expect( differ.getMarkersToRemove() ).to.deep.equal( [
				{ name: 'name', range: range }
			] );

			expect( differ.getMarkersToAdd() ).to.deep.equal( [
				{ name: 'name', range: range }
			] );
		} );

		it( 'change marker to the same range', () => {
			differ.bufferMarkerChange( 'name', range, range );

			expect( differ.getMarkersToRemove() ).to.deep.equal( [
				{ name: 'name', range: range }
			] );

			expect( differ.getMarkersToAdd() ).to.deep.equal( [
				{ name: 'name', range: range }
			] );
		} );
	} );

	function insert( item, position ) {
		const operation = new InsertOperation( position, item, doc.version );

		differ.bufferOperation( operation );

		doc.applyOperation( wrapInDelta( operation ) );
	}

	function remove( sourcePosition, howMany ) {
		const targetPosition = Position.createAt( doc.graveyard, doc.graveyard.maxOffset );
		const operation = new RemoveOperation( sourcePosition, howMany, targetPosition, doc.version );

		differ.bufferOperation( operation );

		doc.applyOperation( wrapInDelta( operation ) );
	}

	function move( sourcePosition, howMany, targetPosition ) {
		const operation = new MoveOperation( sourcePosition, howMany, targetPosition, doc.version );

		differ.bufferOperation( operation );

		doc.applyOperation( wrapInDelta( operation ) );
	}

	function rename( element, newName ) {
		const operation = new RenameOperation( Position.createBefore( element ), element.name, newName, doc.version );

		differ.bufferOperation( operation );

		doc.applyOperation( wrapInDelta( operation ) );
	}

	function attribute( range, key, oldValue, newValue ) {
		const operation = new AttributeOperation( range, key, oldValue, newValue, doc.version );

		differ.bufferOperation( operation );

		doc.applyOperation( wrapInDelta( operation ) );
	}

	function expectChanges( expected ) {
		const changes = differ.getChanges();

		for ( let i = 0; i < expected.length; i++ ) {
			for ( const key in expected[ i ] ) {
				if ( expected[ i ].hasOwnProperty( key ) ) {
					if ( key == 'position' || key == 'range' ) {
						expect( expected[ i ][ key ].isEqual( changes[ i ][ key ] ), `item ${ i }, key "${ key }"` ).to.be.true;
					} else {
						expect( expected[ i ][ key ], `item ${ i }, key "${ key }"` ).to.equal( changes[ i ][ key ] );
					}
				}
			}
		}
	}
} );