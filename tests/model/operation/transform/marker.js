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

	describe( 'marker', () => {
		describe( 'by marker', () => {
			it( 'in different paths', () => {
				john.setData( '<paragraph>[Fo]o</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Ba]r</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Fo<m1:end></m1:end>o</paragraph>' +
					'<paragraph><m2:start></m2:start>Ba<m2:end></m2:end>r</paragraph>'
				);
			} );

			it( 'in same path', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Foo<m1:end></m1:end> ' +
						'<m2:start></m2:start>Bar<m2:end></m2:end>' +
					'</paragraph>'
				);
			} );

			it( 'in same range', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>[Foo]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start><m2:start></m2:start>Foo<m1:end></m1:end><m2:end></m2:end>' +
					'</paragraph>'
				);
			} );

			it( 'in other user\'s selection', () => {
				john.setData( '<paragraph>[Foo Bar]</paragraph>' );
				kate.setData( '<paragraph>Fo[o B]ar</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Fo<m2:start></m2:start>o B<m2:end></m2:end>ar<m1:end></m1:end>' +
					'</paragraph>'
				);
			} );

			it( 'then wrap and split', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Fo[o Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				john.setSelection( [ 0 ], [ 1 ] );
				kate.setSelection( [ 0, 3 ] );

				john.wrap( 'blockQuote' );
				kate.split();

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>' +
							'<m1:start></m1:start>Fo<m2:start></m2:start>o<m1:end></m1:end>' +
						'</paragraph>' +
						'<paragraph>' +
							' Bar<m2:end></m2:end>' +
						'</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'then unwrap and split', () => {
				john.setData( '<blockQuote><paragraph>[Foo] Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>Fo[o Bar]</paragraph></blockQuote>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				john.setSelection( [ 0, 0 ], [ 0, 1 ] );
				kate.setSelection( [ 0, 0, 3 ] );

				john.unwrap();
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Fo<m2:start></m2:start>o<m1:end></m1:end>' +
					'</paragraph>' +
					'<paragraph>' +
						' Bar<m2:end></m2:end>' +
					'</paragraph>'
				);
			} );

			it( 'then remove text', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Fo[o Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				john.setSelection( [ 0, 0 ], [ 0, 3 ] );
				kate.setSelection( [ 0, 2 ], [ 0, 7 ] );

				john.remove();
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph></paragraph>'
				);
			} );

			it.skip( 'then remove text and undo', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Fo[o Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Fo<m2:start></m2:start>o<m1:end></m1:end> Bar<m2:end></m2:end>' +
					'</paragraph>'
				);

				john.remove();
				kate.remove();

				syncClients();

				expectClients( '<paragraph></paragraph>' );

				john.undo();
				kate.undo();

				syncClients();

				// Actual result for Kate:
				// <paragraph><m1:start></m1:start>Fo<m1:end></m1:end><m2:start></m2:start>o<m2:end></m2:end> Bar</paragraph>
				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Foo<m1:end></m1:end><m2:start></m2:start> Bar<m2:end></m2:end>' +
					'</paragraph>'
				);
			} );

			it( 'then move and remove', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				john.setSelection( [ 0, 1 ], [ 0, 3 ] );
				kate.setSelection( [ 0, 4 ], [ 0, 7 ] );

				john.move( [ 0, 4 ] );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>F oo<m1:end></m1:end></paragraph>'
				);
			} );

			it( 'then unwrap and merge', () => {
				john.setData( '<blockQuote><paragraph>[Foo]</paragraph><paragraph> Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>Foo</paragraph><paragraph> [Bar]</paragraph></blockQuote>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				john.setSelection( [ 0, 0 ], [ 0, 1 ] );
				kate.setSelection( [ 0, 1 ], [ 0, 2 ] );

				john.unwrap();
				kate.merge();

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Foo<m1:end></m1:end> ' +
						'<m2:start></m2:start>Bar<m2:end></m2:end>' +
					'</paragraph>'
				);
			} );

			it( 'then merge elements', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph> Bar</paragraph><paragraph>Abc</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph> [Bar]</paragraph><paragraph>Abc</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				john.setSelection( [ 1 ], [ 2 ] );
				kate.setSelection( [ 2 ], [ 3 ] );

				john.merge();
				kate.merge();

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Foo<m1:end></m1:end> ' +
						'<m2:start></m2:start>Bar<m2:end></m2:end>Abc' +
					'</paragraph>'
				)
			} );

			it( 'then split text in same path', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				john.setSelection( [ 0, 3 ] );
				kate.setSelection( [ 0, 4 ] );

				john.split();
				kate.split();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph> </paragraph>' +
					'<paragraph><m2:start></m2:start>Bar<m2:end></m2:end></paragraph>'
				);
			} );

			it( 'then remove markers', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				john.removeMarker( 'm2' );
				kate.removeMarker( 'm1' );

				syncClients();

				expectClients(
					'<paragraph>Foo Bar</paragraph>'
				);
			} );
		} );

		describe( 'by insert', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>[]' );

				john.setMarker( 'm1' );
				kate.insert( '<paragraph>Abc</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>Bar</paragraph>' +
					'<paragraph>Abc</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[]' );

				john.setMarker( 'm1' );
				kate.insert( '<paragraph>Bar</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'text in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[]ar</paragraph>' );

				john.setMarker( 'm1' );
				kate.type( 'Abc' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>BAbcar</paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>Foo[]</paragraph>' );

				john.setMarker( 'm1' );
				kate.type( 'Abc' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end>Abc</paragraph>'
				);
			} );

			it( 'text in other user\'s range', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>Fo[]o</paragraph>' );

				john.setMarker( 'm1' );
				kate.type( 'Abc' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>FoAbco<m1:end></m1:end></paragraph>'
				);
			} );
		} );

		describe( 'by move', () => {
			it( 'text in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[ar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.move( [ 1, 0 ] );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>arB</paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>[Fo]o</paragraph>' );
				kate.setData( '<paragraph>Fo[o]</paragraph>' );

				john.setMarker( 'm1' );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients(
					'<paragraph>o<m1:start></m1:start>Fo<m1:end></m1:end></paragraph>'
				);
			} );

			it.skip( 'text from other user\'s range', () => {
				john.setData( '<paragraph>[Foo Bar]</paragraph>' );
				kate.setData( '<paragraph>Foo [Ba]r</paragraph>' );

				john.setMarker( 'm1' );
				kate.move( [ 0, 0 ] );

				syncClients();

				// Actual result for Kate:
				// <paragraph>Ba<m1:start></m1:start>Foo r<m1:end></m1:end></paragraph>
				expectClients(
					'<paragraph><m1:start></m1:start>BaFoo r<m1:end></m1:end></paragraph>'
				);
			} );
		} );

		describe( 'by remove', () => {
			it( 'text in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Ba]r</paragraph>' );

				john.setMarker( 'm1' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>r</paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end> </paragraph>'
				);
			} );

			it( 'text in other user\'s selection', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>F[oo]</paragraph>' );

				john.setMarker( 'm1' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>F<m1:end></m1:end></paragraph>'
				);
			} );
		} );

		describe( 'by wrap', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.setMarker( 'm1' );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<blockQuote>' +
						'<paragraph>Bar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.setMarker( 'm1' );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'</blockQuote>'
				);
			} );
		} );

		describe( 'by unwrap', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<paragraph>Foo</paragraph><blockQuote>[<paragraph>Bar</paragraph>]</blockQuote>' );

				john.setMarker( 'm1' );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<blockQuote><paragraph>[Foo]</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[<paragraph>Foo</paragraph>]</blockQuote>' );

				john.setMarker( 'm1' );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>'
				);
			} );
		} );

		describe( 'by split', () => {
			it( 'text in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[]ar</paragraph>' );

				john.setMarker( 'm1' );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>B</paragraph>' +
					'<paragraph>ar</paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo []Bar</paragraph>' );

				john.setMarker( 'm1' );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end> </paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'text in other user\'s selection', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>Fo[]o</paragraph>' );

				john.setMarker( 'm1' );
				kate.split()

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Fo</paragraph>' +
					'<paragraph>o<m1:end></m1:end></paragraph>'
				);
			} );
		} );

		describe( 'by attribute', () => {
			it( 'in different paths', () => {
				john.setData( '<paragraph>[Fo]o</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Ba]r</paragraph>' );

				john.setMarker( 'm1' );
				kate.setAttribute( 'bold', true );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Fo<m1:end></m1:end>o</paragraph>' +
					'<paragraph><$text bold="true">Ba</$text>r</paragraph>'
				);
			} );

			it( 'in same path', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setAttribute( 'bold', true );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Foo<m1:end></m1:end> ' +
						'<$text bold="true">Bar</$text>' +
					'</paragraph>'
				);
			} );

			it( 'in same range', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>[Foo]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setAttribute( 'bold', true );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start><$text bold="true">Foo</$text><m1:end></m1:end>' +
					'</paragraph>'
				);
			} );

			it( 'in other user\'s selection', () => {
				john.setData( '<paragraph>[Foo Bar]</paragraph>' );
				kate.setData( '<paragraph>Fo[o B]ar</paragraph>' );

				john.setMarker( 'm1' );
				kate.setAttribute( 'bold', true );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>Fo<$text bold="true">o B</$text>ar<m1:end></m1:end>' +
					'</paragraph>'
				);
			} );

			it( 'in same range, then wrap and split', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>[Foo]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setAttribute( 'bold', true );

				syncClients();

				john.setSelection( [ 0 ], [ 1 ] );
				kate.setSelection( [ 0, 2 ] );

				john.wrap( 'blockQuote' );
				kate.split();

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>' +
							'<m1:start></m1:start><$text bold="true">Fo</$text>' +
						'</paragraph>' +
						'<paragraph>' +
							'<$text bold="true">o</$text><m1:end></m1:end>' +
						'</paragraph>' +
					'</blockQuote>'
				);
			} );
		} );

		describe( 'by remove attribute', () => {
			it( 'from element in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph bold="true"><$text bold="true">Bar</$text></paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph bold="true"><$text bold="true">Bar</$text></paragraph>]' );

				john.setMarker( 'm1' );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'from text in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph><$text bold="true">Bar</$text></paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph><$text bold="true">[Bar]</$text></paragraph>' );

				john.setMarker( 'm1' );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'from text in same path', () => {
				john.setData( '<paragraph>[Fo]<$text bold="true">o</$text></paragraph>' );
				kate.setData( '<paragraph>Fo<$text bold="true">[o]</$text></paragraph>' );

				john.setMarker( 'm1' );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Fo<m1:end></m1:end>o</paragraph>'
				);
			} );

			it( 'from element in same path', () => {
				john.setData( '<paragraph bold="true"><$text bold="true">[Fo]o</$text></paragraph>' );
				kate.setData( '[<paragraph bold="true"><$text bold="true">Foo</$text></paragraph>]' );

				john.setMarker( 'm1' );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Fo<m1:end></m1:end>o</paragraph>'
				);
			} );

			it( 'from text with 2 attributes in same path', () => {
				john.setData( '<paragraph>[Fo]<$text bold="true" italic="true">o</$text></paragraph>' );
				kate.setData( '<paragraph>Fo<$text bold="true" italic="true">[o]</$text></paragraph>' );

				john.setMarker( 'm1' );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Fo<m1:end></m1:end><$text italic="true">o</$text></paragraph>'
				);
			} );

			it( 'from text in other user\'s selection', () => {
				john.setData( '<paragraph><$text bold="true">[Foo]</$text></paragraph>' );
				kate.setData( '<paragraph><$text bold="true">[Foo]</$text></paragraph>' );

				john.setMarker( 'm1' );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end></paragraph>'
				);
			} );
		} );

		describe( 'by merge', () => {
			it( 'element into paragraph', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph> Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph> Bar</paragraph>]' );

				john.setMarker( 'm1' );
				kate.merge();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end> Bar</paragraph>'
				);
			} );

			it( 'elements into paragraph', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph> Bar</paragraph><paragraph> Abc</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph> Bar</paragraph>[<paragraph> Abc</paragraph>]' );

				john.setMarker( 'm1' );
				kate.merge();

				syncClients();

				kate.setSelection( [ 1 ], [ 2 ] );

				kate.merge();

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end> Bar Abc</paragraph>'
				);
			} );

			it( 'wrapped element into wrapped paragraph', () => {
				john.setData( '<blockQuote><paragraph>[Foo]</paragraph><paragraph> Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>Foo</paragraph>[<paragraph> Bar</paragraph>]</blockQuote>' );

				john.setMarker( 'm1' );
				kate.merge();

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph><m1:start></m1:start>Foo<m1:end></m1:end> Bar</paragraph>' +
					'</blockQuote>'
				);
			} );
		} );
	} );
} );
