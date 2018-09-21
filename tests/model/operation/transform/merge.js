import { Client, syncClients, expectClients, clearBuffer } from './utils.js';
import { transform } from '../../../../src/model/operation/transform';
import Position from '../../../../src/model/position';
import MergeOperation from '../../../../src/model/operation/mergeoperation';
import SplitOperation from '../../../../src/model/operation/splitoperation';

describe( 'transform', () => {
	let john, kate;

	beforeEach( () => {
		return Promise.all( [
			Client.get( 'john' ).then( client => ( john = client ) ),
			Client.get( 'kate' ).then( client => ( kate = client ) )
		] );
	} );

	afterEach( () => {
		clearBuffer();

		return Promise.all( [ john.destroy(), kate.destroy() ] );
	} );

	describe( 'merge', () => {
		describe( 'by merge', () => {
			it( 'elements into paragraph', () => {
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph>Bar</paragraph><paragraph>Abc</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>[]<paragraph>Abc</paragraph>' );

				john.merge();
				kate.merge();

				syncClients();

				expectClients( '<paragraph>FooBarAbc</paragraph>' );
			} );

			it( 'elements into paragraph with undo', () => {
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph>Bar</paragraph><paragraph>Abc</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>[]<paragraph>Abc</paragraph>' );

				john.merge();
				kate.merge();

				syncClients();

				kate.undo();
				john.undo();

				syncClients();
				expectClients( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph><paragraph>Abc</paragraph>' );
			} );

			it.skip( 'same element with undo', () => {
				// Unnecessary SplitOperation.
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph></paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[]<paragraph></paragraph>' );

				john.merge();
				kate.merge();
				kate.undo();

				syncClients();
				expectClients( '<paragraph>Foo</paragraph>' );
			} );
		} );

		describe( 'by remove', () => {
			it( 'remove merged element', () => {
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.merge();
				kate.remove();

				syncClients();

				expectClients( '<paragraph>Foo</paragraph>' );
			} );

			it( 'remove merged element then undo #1', () => {
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.merge();
				kate.remove();

				syncClients();
				expectClients( '<paragraph>Foo</paragraph>' );

				kate.undo();

				syncClients();

				expectClients( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
			} );

			it( 'remove merged element then undo #2', () => {
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.merge();
				kate.remove();
				kate.undo();

				syncClients();

				expectClients( '<paragraph>FooBar</paragraph>' );
			} );

			it( 'remove merge target and undo', () => {
				john.setData( '<paragraph>A</paragraph><paragraph>B</paragraph>[]<paragraph>C</paragraph>' );
				kate.setData( '<paragraph>A</paragraph>[<paragraph>B</paragraph>]<paragraph>C</paragraph>' );

				john.merge();
				john.undo();
				kate.remove();

				debugger;
				window.x=1;
				syncClients();
				expectClients( '<paragraph>A</paragraph><paragraph>C</paragraph>' );
			} );
		} );

		describe( 'by delete', () => {
			it( 'text from two elements', () => {
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Fo[o</paragraph><paragraph>Ba]r</paragraph>' );

				john.merge();
				kate.delete();

				syncClients();

				expectClients( '<paragraph>For</paragraph>' );
			} );

			it( 'merged elements and some text', () => {
				john.setData( '<paragraph>Foo</paragraph><paragraph></paragraph>[]<paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>F[oo</paragraph><paragraph></paragraph><paragraph>Ba]r</paragraph>' );

				john.merge();
				kate.delete();

				syncClients();

				expectClients( '<paragraph>Fr</paragraph>' );
			} );

			it( 'merged same element to different targets', () => {
				john.setData( '<paragraph>A</paragraph><paragraph>B</paragraph>[]<paragraph>C</paragraph>' );
				kate.setData( '<paragraph>A</paragraph>[<paragraph>B</paragraph>]<paragraph>C</paragraph>' );

				john.merge();
				kate.remove();
				kate.setSelection( [ 1 ] );
				kate.merge();

				syncClients();
				expectClients( '<paragraph>AC</paragraph>' );
			} );

			it( 'merged same element to different targets and undo #1', () => {
				john.setData( '<paragraph>A</paragraph><paragraph>B</paragraph>[]<paragraph>C</paragraph>' );
				kate.setData( '<paragraph>A</paragraph>[<paragraph>B</paragraph>]<paragraph>C</paragraph>' );

				john.merge();
				john.undo();
				kate.remove();
				kate.setSelection( [ 1 ] );
				kate.merge();

				debugger;
				window.x = 1;
				syncClients();
				expectClients( '<paragraph>AC</paragraph>' );
				window.x = 0;
			} );
		} );

		describe( 'by wrap', () => {
			it( 'wrap merged element', () => {
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.merge();
				kate.wrap( 'blockQuote' );

				syncClients();
				expectClients( '<paragraph>FooBar</paragraph>' );

				john.undo();
				kate.undo();

				syncClients();
				expectClients( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
			} );

			it( 'wrap in merged element', () => {
				// This is pretty weird case. Right now it cannot be reproduced with the features that we have.
				john.editor.model.schema.extend( 'paragraph', { allowIn: 'listItem' } );
				john.editor.model.schema.extend( 'blockQuote', { allowIn: 'listItem' } );

				kate.editor.model.schema.extend( 'paragraph', { allowIn: 'listItem' } );
				kate.editor.model.schema.extend( 'blockQuote', { allowIn: 'listItem' } );

				john.setData(
					'<listItem>' +
						'<paragraph>A</paragraph>' +
					'</listItem>' +
					'[]' +
					'<listItem>' +
						'<paragraph>B</paragraph>' +
						'<paragraph>C</paragraph>' +
					'</listItem>'
				);

				kate.setData(
					'<listItem>' +
						'<paragraph>A</paragraph>' +
					'</listItem>' +
					'<listItem>' +
						'[<paragraph>B</paragraph>' +
						'<paragraph>C</paragraph>]' +
					'</listItem>'
				);

				john.merge();
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<listItem>' +
						'<paragraph>A</paragraph>' +
						'<blockQuote>' +
							'<paragraph>B</paragraph>' +
							'<paragraph>C</paragraph>' +
						'</blockQuote>' +
					'</listItem>'
				);
			} );
		} );

		describe( 'by unwrap', () => {
			it( 'merge to unwrapped element', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph></blockQuote>[]<blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[]<paragraph>Foo</paragraph></blockQuote><blockQuote><paragraph>Bar</paragraph></blockQuote>' );

				john.merge();
				kate.unwrap();

				syncClients();
				expectClients( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
			} );

			it( 'merge to unwrapped element with undo #1', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph></blockQuote>[]<blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[]<paragraph>Foo</paragraph></blockQuote><blockQuote><paragraph>Bar</paragraph></blockQuote>' );

				john.merge();
				john.undo();
				kate.unwrap();

				syncClients();
				expectClients( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
			} );

			it( 'merge to unwrapped element with undo #2', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph></blockQuote>[]<blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[]<paragraph>Foo</paragraph></blockQuote><blockQuote><paragraph>Bar</paragraph></blockQuote>' );

				john.merge();
				kate.unwrap();
				kate.undo();

				syncClients();
				expectClients( '<blockQuote><paragraph>Foo</paragraph></blockQuote><paragraph>Bar</paragraph>' );
			} );

			it( 'unwrap in merged element', () => {
				// This is pretty weird case. Right now it cannot be reproduced with the features that we have.
				john.editor.model.schema.extend( 'paragraph', { allowIn: 'listItem' } );
				john.editor.model.schema.extend( 'blockQuote', { allowIn: 'listItem' } );

				kate.editor.model.schema.extend( 'paragraph', { allowIn: 'listItem' } );
				kate.editor.model.schema.extend( 'blockQuote', { allowIn: 'listItem' } );

				john.setData(
					'<listItem>' +
						'<paragraph>A</paragraph>' +
					'</listItem>' +
					'[]' +
					'<listItem>' +
						'<blockQuote>' +
							'<paragraph>B</paragraph>' +
							'<paragraph>C</paragraph>' +
						'</blockQuote>' +
					'</listItem>'
				);

				kate.setData(
					'<listItem>' +
						'<paragraph>A</paragraph>' +
					'</listItem>' +
					'<listItem>' +
						'<blockQuote>' +
							'[]<paragraph>B</paragraph>' +
							'<paragraph>C</paragraph>' +
						'</blockQuote>' +
					'</listItem>'
				);

				john.merge();
				kate.unwrap();

				syncClients();

				expectClients(
					'<listItem>' +
						'<paragraph>A</paragraph>' +
						'<paragraph>B</paragraph>' +
						'<paragraph>C</paragraph>' +
					'</listItem>'
				);
			} );
		} );
	} );
} );
