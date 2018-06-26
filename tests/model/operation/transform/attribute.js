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

  describe( 'attribute', () => {
    describe( 'by attribute', () => {
      it( 'in text at same path', () => {
        john.setData( '<paragraph>Foo Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 3 ] );

        kate.setData( '<paragraph>Foo Bar</paragraph>' );
        kate.setSelection( [ 0, 4 ], [ 0, 7 ] );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text> <$text italic="true">Bar</$text></paragraph>'
        );
      } );

      it( 'in text in different path', () => {
        john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        john.setSelection( [ 0, 1 ], [ 0, 2 ] );

        kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        kate.setSelection( [ 1, 1 ], [ 1, 2 ] );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph>F<$text bold="true">o</$text>o</paragraph><paragraph>B<$text italic="true">a</$text>r</paragraph>'
        );
      } );

      it( 'in text with selection inside other client\'s selection #1', () => {
        john.setData( '<paragraph>Foo Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 7 ] );

        kate.setData( '<paragraph>Foo Bar</paragraph>' );
        kate.setSelection( [ 0, 2 ], [ 0, 5 ] );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Fo</$text><$text bold="true" italic="true">o B</$text><$text bold="true">ar</$text></paragraph>'
        );
      } );

      it( 'in text with selection inside other client\'s selection #2', () => {
        john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        john.setSelection( [ 0, 1 ], [ 1, 2 ] );

        kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        kate.setSelection( [ 1, 0 ], [ 1, 3 ] );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph>F<$text bold="true">oo</$text></paragraph><paragraph bold="true"><$text bold="true" italic="true">Ba</$text><$text italic="true">r</$text></paragraph>'
        );
      } );

      it( 'in text at same position', () => {
        john.setData( '<paragraph>Foo Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 7 ] );

        kate.setData( '<paragraph>Foo Bar</paragraph>' );
        kate.setSelection( [ 0, 0 ], [ 0, 7 ] );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true" italic="true">Foo Bar</$text></paragraph>'
        );
      } );

      it( 'in collapsed selection', () => {
        john.setData( '<paragraph>Foo Bar</paragraph>' );
        john.setSelection( [ 0, 1 ] );

        kate.setData( '<paragraph>Foo Bar</paragraph>' );
        kate.setSelection( [ 0, 1 ] );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph>Foo Bar</paragraph>'
        );
      } );
    } );

    describe( 'by insert', () => {
      it( 'text in different path', () => {
        john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 3 ] );

        kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        kate.setSelection( [ 1, 0 ] );

        john.setAttribute( 'bold', 'true' );
        kate.type( 'Abc' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text></paragraph><paragraph>AbcBar</paragraph>'
        );
      } );

      it( 'text at same path', () => {
        john.setData( '<paragraph>Foo</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 1 ] );

        kate.setData( '<paragraph>Foo</paragraph>' );
        kate.setSelection( [ 0, 3 ] );

        john.setAttribute( 'bold', 'true' );
        kate.type( 'Abc' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">F</$text>ooAbc</paragraph>'
        );
      } );

      it.skip( 'text inside other client\'s selection', () => {
        john.setData( '<paragraph>Foo</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 3 ] );

        kate.setData( '<paragraph>Foo</paragraph>' );
        kate.setSelection( [ 0, 2 ] );

        john.setAttribute( 'bold', 'true' );
        kate.type( 'Abc' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">FoAbco</$text></paragraph>'
        );
      } );

      it( 'element in different path', () => {
        john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 3 ] );

        kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>[]' );

        john.setAttribute( 'bold', 'true' );
        kate.insert( '<paragraph>Abc</paragraph>' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text></paragraph>' +
          '<paragraph>Bar</paragraph>' +
          '<paragraph>Abc</paragraph>'
        );
      } );
    } );

    describe( 'by move', () => {
      it( 'text in different path', () => {
        john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 3 ] );

        kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.move( [ 1, 0 ], [ 1, 1 ], [ 1, 3 ] );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text></paragraph>' +
          '<paragraph>arB</paragraph>'
        );
      } );

      it( 'text in same path', () => {
        john.setData( '<paragraph>Foo Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 3 ] );

        kate.setData( '<paragraph>Foo Bar</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.move( [ 0, 4 ], [ 0, 5 ], [ 0, 7 ] );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text> arB</paragraph>'
        );
      } );

      it( 'text inside other client\'s selection', () => {
        john.setData( '<paragraph>Foo Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 3 ] );

        kate.setData( '<paragraph>Foo Bar</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.move( [ 0, 1 ], [ 0, 4 ], [ 0, 7 ] );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">F</$text>Bar<$text bold="true">oo</$text> </paragraph>'
        );
      } );

      it( 'text from other client\'s selection', () => {
        john.setData( '<paragraph>Foo Bar</paragraph>' );
        john.setSelection( [ 0, 0 ], [ 0, 3 ] );

        kate.setData( '<paragraph>Foo Bar</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.move( [ 0, 7 ], [ 0, 1 ], [ 0, 3 ] );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">F</$text> Bar<$text bold="true">oo</$text></paragraph>'
        );
      } );
    } );
  } );
} );
