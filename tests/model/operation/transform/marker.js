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

        john.setMarker( 'comment1' );
        kate.setMarker( 'comment2' );

        syncClients();

        expectClients(
          '<paragraph>Foo</paragraph>' +
          '<paragraph>Bar</paragraph>'
        );
      } );
    } );
  } );
} );
