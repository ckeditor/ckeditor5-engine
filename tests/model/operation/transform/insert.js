import { Client, syncClients, expectClients } from './utils.js';

describe( 'transform', () => {
	let john, kate;

	beforeEach( () => {
		return Promise.all( [
			Client.get( 'john' ).then( client => john = client ),
			Client.get( 'kate' ).then( client => kate = client )
		] );
	} );

	afterEach( () => {
		return Promise.all( [ john.destroy(), kate.destroy() ] );
	} );

	describe( 'insert', () => {
		describe( 'by insert', () => {
			it( 'elements at same position #1', () => {
				john.setData( '[]<paragraph>Foo</paragraph>' );
				kate.setData( '[]<paragraph>Foo</paragraph>' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.insert( '<paragraph>Xyz</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Xyz</paragraph>' +
					'<paragraph>Foo</paragraph>'
				);
			} );

			it( 'elements at same position #2', () => {
				john.setData( '[]<paragraph>Foo</paragraph>' );
				kate.setData( '[]<paragraph>Foo</paragraph>' );

				kate.insert( '<paragraph>Xyz</paragraph>' );
				john.insert( '<paragraph>Abc</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Xyz</paragraph>' +
					'<paragraph>Foo</paragraph>'
				);
			} );

			it( 'elements in same parent', () => {
				john.setData( '[]<paragraph>Foo</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[]' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.insert( '<paragraph>Xyz</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Foo</paragraph>' +
					'<paragraph>Xyz</paragraph>'
				);
			} );

			it( 'elements in same path', () => {
				john.setData( '[]<blockQuote><paragraph>Foo</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[]<paragraph>Foo</paragraph></blockQuote>' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.insert( '<paragraph>Xyz</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<blockQuote>' +
						'<paragraph>Xyz</paragraph>' +
						'<paragraph>Foo</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'text at different paths', () => {
				john.setData( '<paragraph>Abc[]</paragraph><paragraph>Xyz</paragraph>' );
				kate.setData( '<paragraph>Abc</paragraph><paragraph>[]Xyz</paragraph>' );

				john.type( 'Foo' );
				kate.type( 'Bar' );

				syncClients();

				expectClients(
					'<paragraph>AbcFoo</paragraph>' +
					'<paragraph>BarXyz</paragraph>'
				);
			} );
		} );

		describe( 'by move', () => {
			it( 'element at different paths #1', () => {
				john.setData( '[]<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[ar]</paragraph>' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.move( [ 1, 0 ] );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Foo</paragraph>' +
					'<paragraph>arB</paragraph>'
				);
			} );

			it( 'element at different paths #2', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph>[]</blockQuote><paragraph>Bar</paragraph>' );
				kate.setData( '<blockQuote><paragraph>Foo</paragraph></blockQuote><paragraph>B[ar]</paragraph>' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.move( [ 0, 0, 0 ] );

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>arFoo</paragraph>' +
						'<paragraph>Abc</paragraph>' +
					'</blockQuote>' +
					'<paragraph>B</paragraph>'
				);
			} );

			it( 'text at same path', () => {
				john.setData( '<paragraph>F[]oo Bar</paragraph>' );
				kate.setData( '<paragraph>Foo B[ar]</paragraph>' );

				john.type( 'Abc' );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients( '<paragraph>arFAbcoo B</paragraph>' );
			} );

			it( 'text at same position #1', () => {
				john.setData( '<paragraph>Foo[] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.type( 'Abc' );
				kate.move( [ 0, 3 ] );

				syncClients();

				expectClients( '<paragraph>FooAbcBar </paragraph>' );
			} );

			it( 'text at same position #2', () => {
				john.setData( '<paragraph>Foo [Bar]</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.type( 'Abc' );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients( '<paragraph>BarFoo Abc</paragraph>' );
			} );
		} );

		describe( 'by wrap', () => {
			it.skip( 'element in same path', () => {
				john.setData( '<paragraph>Foo Bar</paragraph>[]' );
				kate.setData( '[<paragraph>Foo Bar</paragraph>]' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>Foo Bar</paragraph>' +
					'</blockQuote>' +
					'<paragraph>Abc</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>Foo[]</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.type( ' Bar' );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>Foo Bar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element in different paths', () => {
				john.setData( '<paragraph>Foo</paragraph>[]<paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<paragraph>Foo</paragraph>' +
					'<paragraph>Abc</paragraph>' +
					'<blockQuote>' +
						'<paragraph>Bar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element in different paths', () => {
				john.setData( '<paragraph>Foo</paragraph><paragraph>Bar[]</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]<paragraph>Bar</paragraph>' );

				john.type( 'Abc' );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>Foo</paragraph>' +
					'</blockQuote>' +
					'<paragraph>BarAbc</paragraph>'
				);
			} );

			it( 'element, then unwrap and split', () => {
				john.setData( '<paragraph>Foo[]</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.type( ' Bar' );
				kate.wrap( 'blockQuote' );

				syncClients();

				john.setSelection( [ 0, 0 ] );
				kate.setSelection( [ 0, 0, 2 ] );

				john.unwrap();
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>Fo</paragraph>' +
					'<paragraph>o Bar</paragraph>'
				);
			} );

			it( 'element, then add marker and split', () => {
				john.setData( '<paragraph>Foo[]</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.type( ' Bar' );
				kate.wrap( 'blockQuote' );

				syncClients();

				john.setSelection( [ 0, 0, 0 ], [ 0, 0, 3 ] );
				kate.setSelection( [ 0, 0, 2 ] );

				john.setMarker( 'm1' );
				kate.split();

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph><m1:start></m1:start>Fo</paragraph>' +
						'<paragraph>o<m1:end></m1:end> Bar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element, then insert element and unwrap', () => {
				john.setData( '<paragraph>Foo[]</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.type( ' Bar')
				kate.wrap( 'blockQuote' );

				syncClients();

				john.setSelection( [ 0, 0 ] );
				kate.setSelection( [ 0, 0 ] );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Foo Bar</paragraph>'

				);
			} );

			it( 'element, then split at the same position and undo', () => {
				john.setData( '<paragraph>Foo[]</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.type( ' Bar' );
				kate.wrap( 'blockQuote' );

				syncClients();

				john.setSelection( [ 0, 0, 3 ] );
				kate.setSelection( [ 0, 0, 3 ] );

				john.split();
				kate.split();

				syncClients();

				kate.undo();

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>Foo</paragraph>' +
						'<paragraph> Bar</paragraph>' +
					'</blockQuote>'
				);
			} );
		} );

		describe( 'by unwrap', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>Foo[]</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<paragraph>Foo</paragraph><blockQuote>[<paragraph>Bar</paragraph>]</blockQuote>' );

				john.type( 'Abc' );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph>FooAbc</paragraph><paragraph>Bar</paragraph>'
				);
			} );

			it( 'element in same path #1', () => {
				john.setData( '<blockQuote><paragraph>Foo[]</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[<paragraph>Foo</paragraph>]</blockQuote>' );

				john.type( ' Bar' );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph>Foo Bar</paragraph>'
				);
			} );

			it( 'element in same path #2', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph>[]</blockQuote>' );
				kate.setData( '<blockQuote>[<paragraph>Foo</paragraph>]</blockQuote>' );

				john.insert( '<paragraph>Bar</paragraph>' );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph>Foo</paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'element, then insert text and move', () => {
				john.setData( '<blockQuote>[]<paragraph>Foo</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[<paragraph>Foo</paragraph>]</blockQuote>' );

				john.insert( '<paragraph>Bar</paragraph>' );
				kate.unwrap();

				syncClients();

				john.setSelection( [ 0, 0 ] );
				kate.setSelection( [ 0, 2 ], [ 0, 3 ] );

				john.type( 'Abc' );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients(
					'<paragraph>AbcrBa</paragraph>' +
					'<paragraph>Foo</paragraph>'
				);
			} );

			it( 'element, then insert text and remove', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph>[]</blockQuote>' );
				kate.setData( '<blockQuote>[<paragraph>Foo</paragraph>]</blockQuote>' );

				john.insert( '<paragraph>Bar</paragraph>' );
				kate.unwrap();

				syncClients();

				john.setSelection( [ 0, 0 ] );
				kate.setSelection( [ 0, 0 ], [ 0, 3 ] );

				john.type( 'Abc' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it.skip( 'element, then wrap and undo on both clients', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph>[]</blockQuote>' );
				kate.setData( '<blockQuote>[<paragraph>Foo</paragraph>]</blockQuote>' );

				john.insert( '<paragraph>Bar</paragraph>' );
				kate.unwrap();

				syncClients();

				kate.setSelection( [ 0 ], [ 1 ] );

				kate.wrap( 'blockQuote' );
				john.undo();

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>Foo</paragraph>' +
					'</blockQuote>'
				);
			} );

			it.skip( 'element, then wrap, unwrap and undo', () => {
				john.setData( '<blockQuote><paragraph>Foo[]</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>Fo[]o</paragraph></blockQuote>' );

				john.type( ' Bar' );
				kate.unwrap();

				syncClients();

				john.setSelection( [ 0 ], [ 1 ] );

				john.wrap( 'blockQuote' );

				syncClients();

				kate.setSelection( [ 0, 0, 0 ] );

				john.undo();
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph>Foo Bar</paragraph>'
				);
			} );
		} );

		describe( 'by split', () => {
			it( 'text in same path #1', () => {
				john.setData( '<paragraph>Foo</paragraph>[]' );
				kate.setData( '<paragraph>F[]oo</paragraph>' );

				john.insert( '<paragraph>Bar</paragraph>' );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>F</paragraph>' +
					'<paragraph>Bar</paragraph>' +
					'<paragraph>oo</paragraph>'
				);
			} );

			it( 'text in same path #2', () => {
				john.setData( '<paragraph>Fo[]o</paragraph>' );
				kate.setData( '<paragraph>F[]oo</paragraph>' );

				john.type( 'Bar' );
				kate.split();

				syncClients();

				expectClients( '<paragraph>F</paragraph><paragraph>oBaro</paragraph>' );
			} );

			it( 'text in different paths #1', () => {
				john.setData( '[]<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[]ar</paragraph>' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Foo</paragraph>' +
					'<paragraph>B</paragraph>' +
					'<paragraph>ar</paragraph>'
				);
			} );

			it( 'text in different paths #2', () => {
				john.setData( '<paragraph>Foo[]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[]ar</paragraph>' );

				john.type( 'Abc' );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>FooAbc</paragraph>' +
					'<paragraph>B</paragraph>' +
					'<paragraph>ar</paragraph>'
				);
			} );

			it( 'text at same position', () => {
				john.setData( '<paragraph>F[]oo</paragraph>' );
				kate.setData( '<paragraph>F[]oo</paragraph>' );

				john.type( 'Bar' );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>F</paragraph>' +
					'<paragraph>Baroo</paragraph>'
				);
			} );

			it( 'text, then insert element and split', () => {
				john.setData( '<paragraph>[]Foo</paragraph>' );
				kate.setData( '<paragraph>F[]oo</paragraph>' );

				john.type( 'Bar' );
				kate.split();

				syncClients();

				john.setSelection( [ 1 ] );
				kate.setSelection( [ 1, 1 ] );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>BarF</paragraph>' +
					'<paragraph>Abc</paragraph>' +
					'<paragraph>o</paragraph>' +
					'<paragraph>o</paragraph>'
				);
			} );

			it( 'text, then add marker and move', () => {
				john.setData( '<paragraph>Foo[]</paragraph>' );
				kate.setData( '<paragraph>Foo[]</paragraph>' );

				john.type( 'Bar' );
				kate.split();

				syncClients();

				john.setSelection( [ 0, 2 ], [ 1, 2 ] );
				kate.setSelection( [ 1, 0 ], [ 1, 2 ] );

				john.setMarker( 'm1' );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients(
					'<paragraph>BaFo<m1:start></m1:start>o</paragraph>' +
					'<paragraph><m1:end></m1:end>r</paragraph>'
				);
			} );

			it.skip( 'text, then add attribute, remove and undo', () => {
				john.setData( '<paragraph>Foo[]</paragraph>' );
				kate.setData( '<paragraph>Foo[]</paragraph>' );

				john.type( 'Bar' );
				kate.split();

				syncClients();

				john.setSelection( [ 0, 2 ], [ 1, 2 ] );
				kate.setSelection( [ 0, 2 ], [ 1, 2 ] );

				john.setAttribute( 'bold', 'true' );
				kate.remove();

				syncClients();

				kate.undo();

				syncClients();

				expectClients(
					'<paragraph>Fo<$text bold="true">o</$text></paragraph>' +
					'<paragraph bold="true"><$text bold="true">Ba</$text>r</paragraph>'
				);
			} );
		} );

		describe( 'by remove', () => {
			it( 'text in different path', () => {
				john.setData( '<paragraph>Foo[]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Bar]</paragraph>' );

				john.type( 'Abc' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph>FooAbc</paragraph><paragraph></paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>Foo[]</paragraph>' );
				kate.setData( '<paragraph>[Foo]</paragraph>' );

				john.type( 'Bar' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'element in different path', () => {
				john.setData( '<paragraph>Foo[]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.type( 'Abc' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph>FooAbc</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>Foo[]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]<paragraph>Bar</paragraph>' );

				john.type( 'Abc' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph>Bar</paragraph>'
				);
			} );

			it.skip( 'text, then rename, split and undo', () => {
				john.setData( '<paragraph>Foo Bar[]</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.type( 'Bar' );
				kate.remove();

				syncClients();

				john.setSelection( [ 0, 0 ] );
				kate.setSelection( [ 0, 4 ] );

				john.rename( 'heading1' );
				kate.split();

				syncClients();

				kate.undo();

				syncClients();

				expectClients(
					'<heading1>Foo Bar</heading1>'
				);
			} );

			it.skip( 'element, then add marker, split and undo with type', () => {
				john.setData( '<paragraph>Foo</paragraph>[]' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.insert( '<paragraph>Bar</paragraph>' );
				kate.remove();

				syncClients();

				john.setSelection( [ 0, 0 ], [ 0, 3 ] );
				kate.setSelection( [ 0, 2 ] );

				john.setMarker( 'm1' );
				kate.split();

				syncClients();

				john.setSelection( [ 1, 1 ] );

				john.undo();
				john.type( 'Abc' );
				kate.undo();

				syncClients();

				expectClients(
					'<paragraph>BarAbc</paragraph>'
				);
			} );
		} );
	} );
} );
