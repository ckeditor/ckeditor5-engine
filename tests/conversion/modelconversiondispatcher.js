/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ModelConversionDispatcher from '../../src/conversion/modelconversiondispatcher';
import ModelDocument from '../../src/model/document';
import ModelText from '../../src/model/text';
import ModelElement from '../../src/model/element';
import ModelRange from '../../src/model/range';
import ModelPosition from '../../src/model/position';

import ViewContainerElement from '../../src/view/containerelement';

describe( 'ModelConversionDispatcher', () => {
	let dispatcher, doc, root, gyPos;

	beforeEach( () => {
		doc = new ModelDocument();
		dispatcher = new ModelConversionDispatcher( doc );
		root = doc.createRoot();

		gyPos = new ModelPosition( doc.graveyard, [ 0 ] );
	} );

	describe( 'constructor()', () => {
		it( 'should create ModelConversionDispatcher with given api', () => {
			const apiObj = {};
			const dispatcher = new ModelConversionDispatcher( doc, { apiObj } );

			expect( dispatcher.conversionApi.apiObj ).to.equal( apiObj );
		} );
	} );

	describe( 'convertBufferedChanges', () => {
		it( 'should call convertInsert for insert change', () => {
			sinon.stub( dispatcher, 'convertInsert' );

			const position = new ModelPosition( root, [ 0 ] );
			const range = ModelRange.createFromPositionAndShift( position, 1 );

			dispatcher.convertBufferedChanges( [
				{ type: 'insert', position, length: 1 }
			] );

			expect( dispatcher.convertInsert.calledOnce ).to.be.true;
			expect( dispatcher.convertInsert.firstCall.args[ 0 ].isEqual( range ) ).to.be.true;
		} );

		it( 'should call convertRemove for remove change', () => {
			sinon.stub( dispatcher, 'convertRemove' );

			const position = new ModelPosition( root, [ 0 ] );

			dispatcher.convertBufferedChanges( [
				{ type: 'remove', position, length: 2, name: '$text' }
			] );

			expect( dispatcher.convertRemove.calledWith( position, 2, '$text' ) ).to.be.true;
		} );

		it( 'should call convertAttribute for attribute change', () => {
			sinon.stub( dispatcher, 'convertAttribute' );

			const position = new ModelPosition( root, [ 0 ] );
			const range = ModelRange.createFromPositionAndShift( position, 1 );

			dispatcher.convertBufferedChanges( [
				{ type: 'attribute', position, range, attributeKey: 'key', attributeOldValue: null, attributeNewValue: 'foo' }
			] );

			expect( dispatcher.convertAttribute.calledWith( range, 'key', null, 'foo' ) ).to.be.true;
		} );

		it( 'should handle multiple changes', () => {
			sinon.stub( dispatcher, 'convertInsert' );
			sinon.stub( dispatcher, 'convertRemove' );
			sinon.stub( dispatcher, 'convertAttribute' );

			const position = new ModelPosition( root, [ 0 ] );
			const range = ModelRange.createFromPositionAndShift( position, 1 );

			dispatcher.convertBufferedChanges( [
				{ type: 'insert', position, length: 1 },
				{ type: 'attribute', position, range, attributeKey: 'key', attributeOldValue: null, attributeNewValue: 'foo' },
				{ type: 'remove', position, length: 1, name: 'paragraph' },
				{ type: 'insert', position, length: 3 },
			] );

			expect( dispatcher.convertInsert.calledTwice ).to.be.true;
			expect( dispatcher.convertRemove.calledOnce ).to.be.true;
			expect( dispatcher.convertAttribute.calledOnce ).to.be.true;
		} );
	} );

	describe( 'convertInsert', () => {
		it( 'should fire event with correct parameters for every item in passed range', () => {
			root.appendChildren( [
				new ModelText( 'foo', { bold: true } ),
				new ModelElement( 'image' ),
				new ModelText( 'bar' ),
				new ModelElement( 'paragraph', { class: 'nice' }, new ModelText( 'xx', { italic: true } ) )
			] );

			const range = ModelRange.createIn( root );
			const loggedEvents = [];

			// We will check everything connected with insert event:
			dispatcher.on( 'insert', ( evt, data, consumable ) => {
				// Check if the item is correct.
				const itemId = data.item.name ? data.item.name : '$text:' + data.item.data;
				// Check if the range is correct.
				const log = 'insert:' + itemId + ':' + data.range.start.path + ':' + data.range.end.path;

				loggedEvents.push( log );

				// Check if the event name is correct.
				expect( evt.name ).to.equal( 'insert:' + ( data.item.name || '$text' ) );
				// Check if model consumable is correct.
				expect( consumable.consume( data.item, 'insert' ) ).to.be.true;
			} );

			// Same here.
			dispatcher.on( 'attribute', ( evt, data, consumable ) => {
				const itemId = data.item.name ? data.item.name : '$text:' + data.item.data;
				const key = data.attributeKey;
				const value = data.attributeNewValue;
				const log = 'attribute:' + key + ':' + value + ':' + itemId + ':' + data.range.start.path + ':' + data.range.end.path;

				loggedEvents.push( log );

				expect( evt.name ).to.equal( 'attribute:' + key + ':' + ( data.item.name || '$text' ) );
				expect( consumable.consume( data.item, 'attribute:' + key ) ).to.be.true;
			} );

			dispatcher.convertInsert( range );

			// Check the data passed to called events and the order of them.
			expect( loggedEvents ).to.deep.equal( [
				'insert:$text:foo:0:3',
				'attribute:bold:true:$text:foo:0:3',
				'insert:image:3:4',
				'insert:$text:bar:4:7',
				'insert:paragraph:7:8',
				'attribute:class:nice:paragraph:7:8',
				'insert:$text:xx:7,0:7,2',
				'attribute:italic:true:$text:xx:7,0:7,2'
			] );
		} );

		it( 'should not fire events for already consumed parts of model', () => {
			root.appendChildren( [
				new ModelElement( 'image', { src: 'foo.jpg', title: 'bar', bold: true }, [
					new ModelElement( 'caption', {}, new ModelText( 'title' ) )
				] )
			] );

			sinon.spy( dispatcher, 'fire' );

			dispatcher.on( 'insert:image', ( evt, data, consumable ) => {
				consumable.consume( data.item.getChild( 0 ), 'insert' );
				consumable.consume( data.item, 'attribute:bold' );
			} );

			const range = ModelRange.createIn( root );

			dispatcher.convertInsert( range );

			expect( dispatcher.fire.calledWith( 'insert:image' ) ).to.be.true;
			expect( dispatcher.fire.calledWith( 'attribute:src:image' ) ).to.be.true;
			expect( dispatcher.fire.calledWith( 'attribute:title:image' ) ).to.be.true;
			expect( dispatcher.fire.calledWith( 'insert:$text' ) ).to.be.true;

			expect( dispatcher.fire.calledWith( 'attribute:bold:image' ) ).to.be.false;
			expect( dispatcher.fire.calledWith( 'insert:caption' ) ).to.be.false;
		} );
	} );

	describe( 'convertRemove', () => {
		it( 'should fire event for removed range', () => {
			const loggedEvents = [];

			dispatcher.on( 'remove:$text', ( evt, data ) => {
				const log = 'remove:' + data.position.path + ':' + data.length;
				loggedEvents.push( log );
			} );

			dispatcher.convertRemove( ModelPosition.createFromParentAndOffset( root, 3 ), 3, '$text' );

			expect( loggedEvents ).to.deep.equal( [ 'remove:3:3' ] );
		} );
	} );

	describe( 'convertSelection', () => {
		beforeEach( () => {
			dispatcher.off( 'selection' );

			root.appendChildren( new ModelText( 'foobar' ) );
			doc.selection.setRanges( [
				new ModelRange( new ModelPosition( root, [ 1 ] ), new ModelPosition( root, [ 3 ] ) ),
				new ModelRange( new ModelPosition( root, [ 4 ] ), new ModelPosition( root, [ 5 ] ) )
			] );
		} );

		it( 'should fire selection event', () => {
			sinon.spy( dispatcher, 'fire' );

			dispatcher.convertSelection( doc.selection, [] );

			expect( dispatcher.fire.calledWith(
				'selection',
				{ selection: sinon.match.instanceOf( doc.selection.constructor ) }
			) ).to.be.true;
		} );

		it( 'should prepare correct list of consumable values', () => {
			doc.enqueueChanges( () => {
				const batch = doc.batch();

				batch.setAttribute( 'bold', true, ModelRange.createIn( root ) );
				batch.setAttribute( 'italic', true, ModelRange.createFromParentsAndOffsets( root, 4, root, 5 ) );
			} );

			dispatcher.on( 'selection', ( evt, data, consumable ) => {
				expect( consumable.test( data.selection, 'selection' ) ).to.be.true;
				expect( consumable.test( data.selection, 'selectionAttribute:bold' ) ).to.be.true;
				expect( consumable.test( data.selection, 'selectionAttribute:italic' ) ).to.be.null;
			} );

			dispatcher.convertSelection( doc.selection, [] );
		} );

		it( 'should fire attributes events for selection', () => {
			sinon.spy( dispatcher, 'fire' );

			doc.enqueueChanges( () => {
				const batch = doc.batch();

				batch.setAttribute( 'bold', true, ModelRange.createIn( root ) );
				batch.setAttribute( 'italic', true, ModelRange.createFromParentsAndOffsets( root, 4, root, 5 ) );
			} );

			dispatcher.convertSelection( doc.selection, [] );

			expect( dispatcher.fire.calledWith( 'selectionAttribute:bold' ) ).to.be.true;
			expect( dispatcher.fire.calledWith( 'selectionAttribute:italic' ) ).to.be.false;
		} );

		it( 'should not fire attributes events if attribute has been consumed', () => {
			sinon.spy( dispatcher, 'fire' );

			dispatcher.on( 'selection', ( evt, data, consumable ) => {
				consumable.consume( data.selection, 'selectionAttribute:bold' );
			} );

			doc.enqueueChanges( () => {
				const batch = doc.batch();

				batch.setAttribute( 'bold', true, ModelRange.createIn( root ) );
				batch.setAttribute( 'italic', true, ModelRange.createFromParentsAndOffsets( root, 4, root, 5 ) );
			} );

			dispatcher.convertSelection( doc.selection, [] );

			expect( dispatcher.fire.calledWith( 'selectionAttribute:bold' ) ).to.be.false;
		} );

		it( 'should fire events for each marker which contains selection', () => {
			doc.markers.set( 'name', ModelRange.createFromParentsAndOffsets( root, 0, root, 2 ) );

			sinon.spy( dispatcher, 'fire' );

			const markers = Array.from( doc.markers.getMarkersAtPosition( doc.selection.getFirstPosition() ) );
			dispatcher.convertSelection( doc.selection, markers );

			expect( dispatcher.fire.calledWith( 'selectionMarker:name' ) ).to.be.true;
		} );

		it( 'should not fire event for marker if selection is in a element with custom highlight handling', () => {
			// Clear after `beforeEach`.
			root.removeChildren( 0, root.childCount );

			const text = new ModelText( 'abc' );
			const caption = new ModelElement( 'caption', null, text );
			const image = new ModelElement( 'image', null, caption );
			root.appendChildren( [ image ] );

			// Create view elements that will be "mapped" to model elements.
			const viewCaption = new ViewContainerElement( 'caption' );
			const viewFigure = new ViewContainerElement( 'figure', null, viewCaption );

			// Create custom highlight handler mock.
			viewFigure.setCustomProperty( 'addHighlight', () => {} );
			viewFigure.setCustomProperty( 'removeHighlight', () => {} );

			// Create mapper mock.
			dispatcher.conversionApi.mapper = {
				toViewElement( modelElement ) {
					if ( modelElement == image ) {
						return viewFigure;
					} else if ( modelElement == caption ) {
						return viewCaption;
					}
				}
			};

			doc.markers.set( 'name', ModelRange.createFromParentsAndOffsets( root, 0, root, 1 ) );
			doc.selection.setRanges( [ ModelRange.createFromParentsAndOffsets( caption, 1, caption, 1 ) ] );

			sinon.spy( dispatcher, 'fire' );

			const markers = Array.from( doc.markers.getMarkersAtPosition( doc.selection.getFirstPosition() ) );

			dispatcher.convertSelection( doc.selection, markers );

			expect( dispatcher.fire.calledWith( 'selectionMarker:name' ) ).to.be.false;
		} );

		it( 'should not fire events if information about marker has been consumed', () => {
			doc.markers.set( 'foo', ModelRange.createFromParentsAndOffsets( root, 0, root, 2 ) );
			doc.markers.set( 'bar', ModelRange.createFromParentsAndOffsets( root, 0, root, 2 ) );

			sinon.spy( dispatcher, 'fire' );

			dispatcher.on( 'selectionMarker:foo', ( evt, data, consumable ) => {
				consumable.consume( data.selection, 'selectionMarker:bar' );
			} );

			const markers = Array.from( doc.markers.getMarkersAtPosition( doc.selection.getFirstPosition() ) );
			dispatcher.convertSelection( doc.selection, markers );

			expect( dispatcher.fire.calledWith( 'selectionMarker:foo' ) ).to.be.true;
			expect( dispatcher.fire.calledWith( 'selectionMarker:bar' ) ).to.be.false;
		} );
	} );

	describe( 'addMarkers', () => {
		it( 'should call convertMarker', () => {
			sinon.stub( dispatcher, 'convertMarker' );

			const fooRange = ModelRange.createFromParentsAndOffsets( root, 0, root, 1 );
			const barRange = ModelRange.createFromParentsAndOffsets( root, 3, root, 6 );

			dispatcher.addMarkers( [
				{ name: 'foo', range: fooRange },
				{ name: 'bar', range: barRange }
			] );

			expect( dispatcher.convertMarker.calledWith( 'addMarker', 'foo', fooRange ) );
			expect( dispatcher.convertMarker.calledWith( 'addMarker', 'bar', barRange ) );
		} );
	} );

	describe( 'removeMarkers', () => {
		it( 'should call convertMarker', () => {
			sinon.stub( dispatcher, 'convertMarker' );

			const fooRange = ModelRange.createFromParentsAndOffsets( root, 0, root, 1 );
			const barRange = ModelRange.createFromParentsAndOffsets( root, 3, root, 6 );

			dispatcher.removeMarkers( [
				{ name: 'foo', range: fooRange },
				{ name: 'bar', range: barRange }
			] );

			expect( dispatcher.convertMarker.calledWith( 'removeMarker', 'foo', fooRange ) );
			expect( dispatcher.convertMarker.calledWith( 'removeMarker', 'bar', barRange ) );
		} );
	} );

	describe( 'convertMarker', () => {
		let range;

		beforeEach( () => {
			const element = new ModelElement( 'paragraph', null, [ new ModelText( 'foo bar baz' ) ] );
			root.appendChildren( [ element ] );

			range = ModelRange.createFromParentsAndOffsets( element, 0, element, 4 );
		} );

		it( 'should fire event based on passed parameters', () => {
			sinon.spy( dispatcher, 'fire' );

			dispatcher.convertMarker( 'addMarker', 'name', range );

			expect( dispatcher.fire.calledWith( 'addMarker:name' ) ).to.be.true;

			dispatcher.convertMarker( 'removeMarker', 'name', range );

			expect( dispatcher.fire.calledWith( 'removeMarker:name' ) ).to.be.true;
		} );

		it( 'should not convert marker if it is in graveyard', () => {
			const gyRange = ModelRange.createFromParentsAndOffsets( doc.graveyard, 0, doc.graveyard, 0 );
			sinon.spy( dispatcher, 'fire' );

			dispatcher.convertMarker( 'addMarker', 'name', gyRange );

			expect( dispatcher.fire.called ).to.be.false;

			dispatcher.convertMarker( 'removeMarker', 'name', gyRange );

			expect( dispatcher.fire.called ).to.be.false;
		} );

		it( 'should not convert marker if it is not in model root', () => {
			const element = new ModelElement( 'element', null, new ModelText( 'foo' ) );
			const eleRange = ModelRange.createFromParentsAndOffsets( element, 1, element, 2 );
			sinon.spy( dispatcher, 'fire' );

			dispatcher.convertMarker( 'addMarker', 'name', eleRange );

			expect( dispatcher.fire.called ).to.be.false;

			dispatcher.convertMarker( 'removeMarker', 'name', eleRange );

			expect( dispatcher.fire.called ).to.be.false;
		} );

		it( 'should fire conversion for the range', () => {
			const element = new ModelElement( 'paragraph', null, [ new ModelText( 'foo bar baz' ) ] );
			root.appendChildren( [ element ] );
			range = ModelRange.createIn( root );

			dispatcher.on( 'addMarker', ( evt, data ) => {
				expect( data.markerName ).to.equal( 'name' );
				expect( data.markerRange.isEqual( range ) ).to.be.true;
			} );

			dispatcher.on( 'removeMarker', ( evt, data ) => {
				expect( data.markerName ).to.equal( 'name' );
				expect( data.markerRange.isEqual( range ) ).to.be.true;
			} );

			dispatcher.convertMarker( 'addMarker', 'name', range );
			dispatcher.convertMarker( 'removeMarker', 'name', range );
		} );

		it( 'should be possible to override', () => {
			const element = new ModelElement( 'paragraph', null, [ new ModelText( 'foo bar baz' ) ] );
			root.appendChildren( [ element ] );
			const range = ModelRange.createIn( root );

			const addMarkerSpy = sinon.spy();
			const removeMarkerSpy = sinon.spy();
			const highAddMarkerSpy = sinon.spy();
			const highRemoveMarkerSpy = sinon.spy();

			dispatcher.on( 'addMarker:marker', addMarkerSpy );
			dispatcher.on( 'removeMarker:marker', removeMarkerSpy );

			dispatcher.on( 'addMarker:marker', ( evt ) => {
				highAddMarkerSpy();

				evt.stop();
			}, { priority: 'high' } );

			dispatcher.on( 'removeMarker:marker', ( evt ) => {
				highRemoveMarkerSpy();

				evt.stop();
			}, { priority: 'high' } );

			dispatcher.convertMarker( 'addMarker', 'marker', range );
			dispatcher.convertMarker( 'removeMarker', 'marker', range );

			expect( addMarkerSpy.called ).to.be.false;
			expect( removeMarkerSpy.called ).to.be.false;
			expect( highAddMarkerSpy.calledOnce ).to.be.true;
			expect( highRemoveMarkerSpy.calledOnce ).to.be.true;
		} );
	} );
} );
