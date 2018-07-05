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

	describe( 'move', () => {
		describe( 'by move', () => {
			it( 'elements in different paths', () => {
				john.setData( '[<paragraph>Foo</paragraph>]<paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.move( [ 2 ] );
				kate.move( [ 0 ] );

				syncClients();

				expectClients(
					'<paragraph>Bar</paragraph>' +
					'<paragraph>Foo</paragraph>'
				);
			} );

			it( 'text in same path #1', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.move( [ 0, 4 ] );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients( '<paragraph>Bar Foo</paragraph>' );
			} );

			it( 'text in same path #2', () => {
				john.setData( '<paragraph>F[oo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo B[ar]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.move( [ 0, 4 ] );

				syncClients();

				expectClients( '<paragraph>ooF arB</paragraph>' );
			} );

			it( 'text in same path #3', () => {
				john.setData( '<paragraph>Foo [Bar]</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients( '<paragraph>BarFoo </paragraph>' );
			} );

			it( 'text at different paths #1', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[ar]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.move( [ 1, 0 ] );

				syncClients();

				expectClients( '<paragraph>ooF</paragraph><paragraph>arB</paragraph>' );
			} );

			it( 'text in different paths #2', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Bar]</paragraph>' );

				john.move( [ 1, 0 ] );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients( '<paragraph>Bar</paragraph><paragraph>Foo</paragraph>' );
			} );

			it( 'text in different paths #3', () => {
				john.setData( '<paragraph>F[oo]</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<paragraph>Foo</paragraph><blockQuote><paragraph>B[ar]</paragraph></blockQuote>' );

				john.move( [ 1, 0, 0 ] );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients(
					'<paragraph>arF</paragraph>' +
					'<blockQuote>' +
						'<paragraph>ooB</paragraph>' +
					'</blockQuote>'
				);
			} );
		} );

		describe( 'by insert', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>[]' );

				john.move( [ 0, 0 ] );
				kate.insert( '<paragraph>Abc</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>' +
					'<paragraph>Bar</paragraph>' +
					'<paragraph>Abc</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>F[oo]</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[]' );

				john.move( [ 0, 0 ] );
				kate.insert( '<paragraph>Bar</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'text in different path #1', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar[]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.type( 'Abc' );

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>' +
					'<paragraph>BarAbc</paragraph>'
				);
			} );

			it( 'text in different path #2', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar[]</paragraph>' );

				john.move( [ 1, 0 ] );
				kate.type( 'Abc' );

				syncClients();

				expectClients(
					'<paragraph>F</paragraph>' +
					'<paragraph>ooBarAbc</paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>F[oo]</paragraph>' );
				kate.setData( '<paragraph>Foo[]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.type( 'Bar' );

				syncClients();

				expectClients(
					'<paragraph>ooFBar</paragraph>'
				);
			} );

			it( 'text in same position', () => {
				john.setData( '<paragraph>Fo[o]</paragraph>' );
				kate.setData( '<paragraph>F[]oo</paragraph>' );

				john.move( [ 0, 1 ] );
				kate.type( 'Bar' );

				syncClients();

				expectClients(
					'<paragraph>FoBaro</paragraph>'
				);
			} );

			it( 'text in other user\'s selection', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>F[]oo</paragraph><paragraph>Bar</paragraph>' );

				john.move( [ 1, 0 ] );
				kate.type( 'Abc' );

				syncClients();

				expectClients(
					'<paragraph></paragraph>' +
					'<paragraph>FAbcooBar</paragraph>'
				);
			} );
		} );

		describe( 'by wrap', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.move( [ 0, 0 ] );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>' +
					'<blockQuote>' +
						'<paragraph>Bar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element in different path #2', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.move( [ 1, 0 ] );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<paragraph></paragraph>' +
					'<blockQuote>' +
						'<paragraph>FooBar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>F[oo]</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.move( [ 0, 0 ] );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<paragraph>ooF</paragraph>' +
					'</blockQuote>'
				);
			} );
		} );

		describe( 'by unwrap', () => {
			it( 'element in different path #1', () => {
				john.setData( '<paragraph>F[oo]</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<paragraph>Foo</paragraph><blockQuote>[<paragraph>Bar</paragraph>]</blockQuote>' );

				john.move( [ 0, 0 ] );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'element in different path #2', () => {
				john.setData( '<paragraph>[Foo]</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<paragraph>Foo</paragraph><blockQuote>[<paragraph>Bar</paragraph>]</blockQuote>' );

				john.move( [ 1, 0, 0 ] );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph></paragraph>' +
					'<paragraph>FooBar</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<blockQuote><paragraph>F[oo]</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[<paragraph>Foo</paragraph>]</blockQuote>' );

				john.move( [ 0, 0, 0 ] );
				kate.unwrap();

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>'
				);
			} );
		} );

		describe( 'by split', () => {
			it( 'text in different path #1', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[]ar</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>' +
					'<paragraph>B</paragraph>' +
					'<paragraph>ar</paragraph>'
				);
			} );

			it( 'text in different path #2', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[]ar</paragraph>' );

				john.move( [ 1, 1 ] );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph></paragraph>' +
					'<paragraph>B</paragraph>' +
					'<paragraph>Fooar</paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>F[oo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo B[]ar</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph>ooF B</paragraph>' +
					'<paragraph>ar</paragraph>'
				);
			} );

			it.skip( 'text in other user\'s selection', () => {
				// OT Error.
				// Actual result: <paragraph>Foo</paragraph><paragraph> Bar</paragraph>
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>F[]oo Bar</paragraph>' );

				john.move( [ 0, 4 ] );
				kate.split();

				syncClients();

				expectClients(
					'<paragraph></paragraph>' +
					'<paragraph> FooBar</paragraph>'
				);
			} );
		} );

		describe( 'by remove', () => {
			it( 'text in same path #1', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.move( [ 0, 4 ] );
				kate.remove();

				syncClients();

				expectClients( '<paragraph> Foo</paragraph>' );
			} );

			it( 'text in same path #2', () => {
				john.setData( '<paragraph>F[oo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo B[ar]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.remove();

				syncClients();

				expectClients( '<paragraph>ooF B</paragraph>' );
			} );

			it( 'text in same path #3', () => {
				john.setData( '<paragraph>Foo [Bar]</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.remove();

				syncClients();

				expectClients( '<paragraph>Foo </paragraph>' );
			} );

			it( 'text at different paths #1', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[ar]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.remove();

				syncClients();

				expectClients( '<paragraph>ooF</paragraph><paragraph>B</paragraph>' );
			} );

			it( 'text in different paths #2', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Bar]</paragraph>' );

				john.move( [ 1, 0 ] );
				kate.remove();

				syncClients();

				expectClients( '<paragraph></paragraph><paragraph>Foo</paragraph>' );
			} );

			it( 'text in different paths #3', () => {
				john.setData( '<paragraph>F[oo]</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<paragraph>Foo</paragraph><blockQuote><paragraph>B[ar]</paragraph></blockQuote>' );

				john.move( [ 1, 0, 0 ] );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph>F</paragraph>' +
					'<blockQuote>' +
						'<paragraph>ooB</paragraph>' +
					'</blockQuote>'
				);
			} );
		} );

		describe( 'by merge', () => {
			it( 'element into paragraph #1', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.move( [ 0, 0 ] );
				kate.merge();

				syncClients();

				expectClients(
					'<paragraph>ooFBar</paragraph>'
				);
			} );

			it( 'element into paragraph #2', () => {
				john.setData( '<paragraph>Foo</paragraph><paragraph>B[ar]</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.move( [ 0, 0 ] );
				kate.merge();

				syncClients();

				expectClients(
					'<paragraph>arFooB</paragraph>'
				);
			} );

			it( 'element into paragraph #3', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.move( [ 1, 0 ] );
				kate.merge();

				syncClients();

				expectClients(
					'<paragraph>FooBar</paragraph>'
				);
			} );

			it( 'wrapped element into wrapped paragraph #1', () => {
				john.setData( '<blockQuote><paragraph>F[oo]</paragraph><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]</blockQuote>' );

				john.move( [ 0, 0, 0 ] );
				kate.merge();

				syncClients();

				expectClients(
					'<blockQuote><paragraph>ooFBar</paragraph></blockQuote>'
				);
			} );

			it( 'wrapped element into wrapped paragraph #2', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph><paragraph>B[ar]</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]</blockQuote>' );

				john.move( [ 0, 0, 0 ] );
				kate.merge();

				syncClients();

				expectClients(
					'<blockQuote><paragraph>arFooB</paragraph></blockQuote>'
				);
			} );

			it( 'wrapped element into wrapped paragraph #3', () => {
				john.setData( '<blockQuote><paragraph>F[oo]</paragraph><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]</blockQuote>' );

				john.move( [ 0, 1, 0 ] );
				kate.merge();

				syncClients();

				expectClients(
					'<blockQuote><paragraph>FooBar</paragraph></blockQuote>'
				);
			} );
		} );

		describe( 'by marker', () => {
			it( 'text in different path', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Bar]</paragraph>' );

				john.move( [ 0, 0 ] );
				kate.setMarker( 'm1' );

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>' +
					'<paragraph><m1:start></m1:start>Bar<m1:end></m1:end></paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>[Fo]o</paragraph>' );
				kate.setData( '<paragraph>Fo[o]</paragraph>' );

				john.move( [ 0, 3 ] );
				kate.setMarker( 'm1' );

				syncClients();

				expectClients(
					'<paragraph><m1:start></m1:start>o<m1:end></m1:end>Fo</paragraph>'
				);
			} );

			it( 'text in other user\'s selection #1', () => {
				john.setData( '<paragraph>[Foo B]ar</paragraph><paragraph></paragraph>' );
				kate.setData( '<paragraph>Fo[o Bar]</paragraph><paragraph></paragraph>' );

				john.move( [ 1, 0 ] );
				kate.setMarker( 'm1' );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m1:start></m1:start>ar<m1:end></m1:end>' +
					'</paragraph>' +
					'<paragraph>Foo B</paragraph>'
				);
			} );

			it( 'text in other user\'s selection #2', () => {
				john.setData( '<paragraph>[Foo Bar]</paragraph><paragraph></paragraph>' );
				kate.setData( '<paragraph>[Foo Bar]</paragraph><paragraph></paragraph>' );

				john.move( [ 1, 0 ] );
				kate.setMarker( 'm1' );

				syncClients();

				expectClients(
					'<paragraph></paragraph>' +
					'<paragraph><m1:start></m1:start>Foo Bar<m1:end></m1:end></paragraph>'
				);
			} );
		} );

		describe( 'by attribute', () => {
			it( 'in text at same path', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.move( [ 0, 7 ] );
				kate.setAttribute( 'italic', true );

				syncClients();

				expectClients( '<paragraph> <$text italic="true">Bar</$text>Foo</paragraph>' );
			} );

			it( 'in text in different path', () => {
				john.setData( '<paragraph>F[o]o</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[a]r</paragraph>' );

				john.move( [ 1, 3 ] );
				kate.setAttribute( 'italic', true );

				syncClients();

				expectClients(
					'<paragraph>Fo</paragraph>' +
					'<paragraph>B<$text italic="true">a</$text>ro</paragraph>'
				);
			} );

			it( 'in text with selection inside other client\'s selection', () => {
				john.setData( '<paragraph>F[oo] Bar</paragraph><paragraph></paragraph>' );
				kate.setData( '<paragraph>Fo[o] Bar</paragraph><paragraph></paragraph>' );

				john.move( [ 1, 0 ] );
				kate.setAttribute( 'italic', true );

				syncClients();

				expectClients(
					'<paragraph>F Bar</paragraph>' +
					'<paragraph>o<$text italic="true">o</$text></paragraph>'
				);
			} );

			it( 'in collapsed selection', () => {
				john.setData( '<paragraph>F[oo] Bar</paragraph>' );
				kate.setData( '<paragraph>F[]oo Bar</paragraph>' );

				john.move( [ 0, 7 ] );
				kate.setAttribute( 'italic', true );

				syncClients();

				expectClients( '<paragraph>F Baroo</paragraph>' );
			} );
		} );

		describe( 'by remove attribute', () => {
			it( 'from element in different path', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph bold="true"><$text bold="true">Bar</$text></paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph bold="true"><$text bold="true">Bar</$text></paragraph>]' );

				john.move( [ 1, 0 ] );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph>F</paragraph>' +
					'<paragraph>ooBar</paragraph>'
				);
			} );

			it( 'from text in different path', () => {
				john.setData( '<paragraph>F[oo]</paragraph><paragraph><$text bold="true">Bar</$text></paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph><$text bold="true">[Bar]</$text></paragraph>' );

				john.move( [ 1, 0 ] );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph>F</paragraph>' +
					'<paragraph>ooBar</paragraph>'
				);
			} );

			it( 'from text in same path', () => {
				john.setData( '<paragraph>[Fo]<$text bold="true">o</$text></paragraph>' );
				kate.setData( '<paragraph>Fo<$text bold="true">[o]</$text></paragraph>' );

				john.move( [ 0, 3 ] );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph>oFo</paragraph>'
				);
			} );

			it( 'from element in same path', () => {
				john.setData( '<paragraph bold="true"><$text bold="true">[Fo]o</$text></paragraph>' );
				kate.setData( '[<paragraph bold="true"><$text bold="true">Foo</$text></paragraph>]' );

				john.move( [ 0, 3 ] );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph>oFo</paragraph>'
				);
			} );

			it( 'from text with 2 attributes in same path', () => {
				john.setData( '<paragraph>[Fo]<$text bold="true" italic="true">o</$text></paragraph>' );
				kate.setData( '<paragraph>Fo<$text bold="true" italic="true">[o]</$text></paragraph>' );

				john.move( [ 0, 3 ] );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph><$text italic="true">o</$text>Fo</paragraph>'
				);
			} );

			it( 'from text in other user\'s selection', () => {
				john.setData( '<paragraph><$text bold="true">[Foo]</$text></paragraph><paragraph></paragraph>' );
				kate.setData( '<paragraph><$text bold="true">[Foo]</$text></paragraph><paragraph></paragraph>' );

				john.move( [ 1, 0 ] );
				kate.removeAttribute( 'bold' );

				syncClients();

				expectClients(
					'<paragraph></paragraph>' +
					'<paragraph>Foo</paragraph>'
				);
			} );
		} );
	} );
} );
