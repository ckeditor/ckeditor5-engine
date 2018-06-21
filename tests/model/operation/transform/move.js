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
				john.setData( '<paragraph>Foo Bar</paragraph>' );
				kate.setData( '<paragraph>Foo Bar</paragraph>' );

				john.move( [ 0, 4 ], [ 0, 0 ], [ 0, 3 ] );
				kate.move( [ 0, 0 ], [ 0, 4 ], [ 0, 7 ] );

				syncClients();

				expectClients( '<paragraph>Bar Foo</paragraph>' );
			} );

			it( 'text in same path #2', () => {
				john.setData( '<paragraph>Foo Bar</paragraph>' );
				kate.setData( '<paragraph>Foo Bar</paragraph>' );

				john.move( [ 0, 0 ], [ 0, 1 ], [ 0, 3 ] );
				kate.move( [ 0, 4 ], [ 0, 5 ], [ 0, 7 ] );

				syncClients();

				expectClients(
					'<paragraph>ooF arB</paragraph>'
				);
			} );

			it( 'text in same path #3', () => {
				john.setData( '<paragraph>Foo Bar</paragraph>' );
				kate.setData( '<paragraph>Foo Bar</paragraph>' );

				john.move( [ 0, 0 ], [ 0, 4 ], [ 0, 7 ] );
				kate.move( [ 0, 0 ], [ 0, 4 ], [ 0, 7 ] );

				syncClients();

				expectClients(
					'<paragraph>BarFoo </paragraph>'
				);
			} );

			it( 'text at different paths #1', () => {
				john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );

				john.move( [ 0, 0 ], [ 0, 1 ], [ 0, 3 ] );
				kate.move( [ 1, 0 ], [ 1, 1 ], [ 1, 3 ] );

				syncClients();

				expectClients(
					'<paragraph>ooF</paragraph>' +
					'<paragraph>arB</paragraph>'
				);
			} );

			it( 'text in different paths #2', () => {
				john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );

				john.move( [ 1, 0 ], [ 0, 0 ], [ 0, 3 ] );
				kate.move( [ 0, 0 ], [ 1, 0 ], [ 1, 3 ] );

				syncClients();

				expectClients(
					'<paragraph>Bar</paragraph>' +
					'<paragraph>Foo</paragraph>'
				)
			} );

			it( 'text in different paths #3', () => {
				john.setData( '<paragraph>Foo</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<paragraph>Foo</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );

				john.move( [ 1, 0, 0 ], [ 0, 1 ], [ 0, 3 ] );
				kate.move( [ 0, 0 ], [ 1, 0, 1 ], [ 1, 0, 3 ] );

				syncClients();

				expectClients(
					'<paragraph>arF</paragraph>' +
					'<blockQuote><paragraph>ooB</paragraph></blockQuote>'
				)
			} );
		} );
	} );
} );
