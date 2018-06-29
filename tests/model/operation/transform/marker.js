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

			it.skip( 'in same range', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>[Foo]</paragraph>' );

				john.setMarker( 'm1' );
				kate.setMarker( 'm2' );

				syncClients();

				expectClients(
					'<paragraph>' +
						'<m2:start></m2:start><m1:start></m1:start>Foo<m1:end></m1:end><m2:end></m2:end>' +
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

				expectClients(
					'<paragraph>Ba<m1:start></m1:start>Foo r<m1:end></m1:end></paragraph>'
				);
			} );
		} );

		describe( 'by remove', () => {
			it( 'text in different path', () => {
				john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Ba]r</paragraph>' );

				john.setAttribute( 'bold', 'true' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph><$text bold="true">Foo</$text></paragraph>' +
					'<paragraph>r</paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>[Foo] Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.setAttribute( 'bold', 'true' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph><$text bold="true">Foo</$text> </paragraph>'
				);
			} );

			it( 'text in other user\'s selection', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>F[oo]</paragraph>' );

				john.setAttribute( 'bold', 'true' );
				kate.remove();

				syncClients();

				expectClients(
					'<paragraph><$text bold="true">F</$text></paragraph>'
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
	} );
} );
