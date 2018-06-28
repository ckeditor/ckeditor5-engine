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

		describe( 'by wrap', () => {
			it( 'text while wrapping element into blockQuote in different path', () => {
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

			it( 'text while wrapping element into blockQuote in same path', () => {
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
	} );
} );
