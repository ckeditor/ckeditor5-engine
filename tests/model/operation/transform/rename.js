import { Client, syncClients, expectClients } from './utils.js';

describe.only( 'transform', () => {
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

  describe( 'rename', () => {
    describe( 'by rename', () => {
      it( 'elements in different paths #1', () => {
        john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        john.setSelection( [ 0, 0 ] );

        kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        kate.setSelection( [ 1, 0 ] );

        john.rename( 'heading1' );
        kate.rename( 'heading2' );

        syncClients();

        expectClients(
          '<heading1>Foo</heading1>' +
          '<heading2>Bar</heading2>'
        );
      } );

			it( 'elements in different paths #2', () => {
        john.setData( '<blockQuote><paragraph>Foo Bar</paragraph></blockQuote>' );
        john.setSelection( [ 0, 0 ] );

        kate.setData( '<blockQuote><paragraph>Foo Bar</paragraph></blockQuote>' );
        kate.setSelection( [ 0, 0, 0 ] );

        john.rename( 'blockQuote2' );
        kate.rename( 'heading2' );

        syncClients();

        expectClients(
          '<blockQuote2>' +
					'<heading2>Foo Bar</heading2>' +
					'</blockQuote2>'
        );
      } );

      it( 'elements in same path', () => {
        john.setData( '<blockQuote><paragraph>Foo Bar</paragraph></blockQuote>' );
        john.setSelection( [ 0, 1 ] );

        kate.setData( '<blockQuote><paragraph>Foo Bar</paragraph></blockQuote>' );
        kate.setSelection( [ 0, 1 ] );

        john.rename( 'blockQuote2' );
        kate.rename( 'blockQuote3' );

        syncClients();

        expectClients(
          '<blockQuote2><paragraph>Foo Bar</paragraph></blockQuote2>'
        );
      } );
    } );

    describe( 'by insert', () => {
      it( 'element in same path', () => {
        john.setData( '<paragraph>Foo Bar</paragraph>' );
        john.setSelection( [ 0, 1 ] );

        kate.setData( '<paragraph>Foo Bar</paragraph>' );
        kate.setSelection( [ 0, 3 ] );

        john.rename( 'heading1' );
        kate.type( 'Abc' );

        syncClients();

        expectClients(
          '<heading1>FooAbc Bar</heading1>'
        );
      } );

      it( 'element in different paths', () => {
        john.setData( '<blockQuote><paragraph>Foo</paragraph></blockQuote><paragraph>Bar</paragraph>' );
        john.setSelection( [ 0, 0, 1 ] );

        kate.setData( '<blockQuote><paragraph>Foo</paragraph></blockQuote><paragraph>Bar</paragraph>' );
        kate.setSelection( [ 1, 1 ] );

        john.rename( 'heading1' );
        kate.type( 'Abc' );

        syncClients();

        expectClients(
          '<blockQuote>' +
          '<heading1>Foo</heading1>' +
          '</blockQuote>' +
          '<paragraph>BAbcar</paragraph>'
        );
      } );
    } );

		describe( 'by move', () => {
			it( 'element in different path #1', () => {
				john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
				john.setSelection( [ 0, 0 ] );

				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );

				john.rename( 'heading1' );
				kate.move( [ 1, 0 ], [ 1, 1 ], [ 1, 3 ] );

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>' +
					'<paragraph>arB</paragraph>'
				);
			} );

			it( 'element in different path #2', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph><paragraph>Bar</paragraph></blockQuote>' );
				john.setSelection( [ 0, 0 ] );

				kate.setData( '<blockQuote><paragraph>Foo</paragraph><paragraph>Bar</paragraph></blockQuote>' );

				john.rename( 'blockQuote2' );
				kate.move( [ 0, 0, 0 ], [ 0, 1, 0 ], [ 0, 1, 3 ] );

				syncClients();

				expectClients(
					'<blockQuote2>' +
					'<paragraph>BarFoo</paragraph>' +
					'<paragraph></paragraph>' +
					'</blockQuote2>'
				);
			} );

			it( 'element in different path #3', () => {
				john.setData( '<blockQuote><paragraph>Foo</paragraph><paragraph>Bar</paragraph></blockQuote>' );
				john.setSelection( [ 0, 0, 0 ] );

				kate.setData( '<blockQuote><paragraph>Foo</paragraph><paragraph>Bar</paragraph></blockQuote>' );

				john.rename( 'heading1' );
				kate.move( [ 0, 1, 0 ], [ 0, 0, 0 ], [ 0, 0, 3 ] );

				syncClients();

				expectClients(
					'<blockQuote>' +
					'<heading1></heading1>' +
					'<paragraph>FooBar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>Foo Bar</paragraph>' );
				john.setSelection( [ 0, 0 ] );

				kate.setData( '<paragraph>Foo Bar</paragraph>' );

				john.rename( 'heading1' );
				kate.move( [ 0, 0 ], [ 0, 4 ], [ 0, 7 ] );

				syncClients();

				expectClients(
					'<heading1>BarFoo </heading1>'
				);
			} );
		} );
  } );
} );
