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

	describe.only( 'marker', () => {
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
		} );
	} );
} );
