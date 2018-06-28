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
        john.setData( '<paragraph>[Foo] Bar</paragraph>' );
        kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text> <$text italic="true">Bar</$text></paragraph>'
        );
      } );

      it( 'in text in different path', () => {
        john.setData( '<paragraph>F[o]o</paragraph><paragraph>Bar</paragraph>' );
        kate.setData( '<paragraph>Foo</paragraph><paragraph>B[a]r</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph>F<$text bold="true">o</$text>o</paragraph><paragraph>B<$text italic="true">a</$text>r</paragraph>'
        );
      } );

      it( 'in text with selection inside other client\'s selection #1', () => {
        john.setData( '<paragraph>[Foo Bar]</paragraph>' );
        kate.setData( '<paragraph>Fo[o B]ar</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Fo</$text><$text bold="true" italic="true">o B</$text><$text bold="true">ar</$text></paragraph>'
        );
      } );

      it( 'in text with selection inside other client\'s selection #2', () => {
        john.setData( '<paragraph>F[oo</paragraph><paragraph>Ba]r</paragraph>' );
        kate.setData( '<paragraph>Foo</paragraph><paragraph>[Bar]</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph>F<$text bold="true">oo</$text></paragraph><paragraph bold="true"><$text bold="true" italic="true">Ba</$text><$text italic="true">r</$text></paragraph>'
        );
      } );

      it( 'in text at same position', () => {
        john.setData( '<paragraph>[Foo Bar]</paragraph>' );
        kate.setData( '<paragraph>[Foo Bar]</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.setAttribute( 'italic', 'true' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true" italic="true">Foo Bar</$text></paragraph>'
        );
      } );

      it( 'in collapsed selection', () => {
        john.setData( '<paragraph>F[]oo Bar</paragraph>' );
        kate.setData( '<paragraph>F[]oo Bar</paragraph>' );

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
        john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
        kate.setData( '<paragraph>Foo</paragraph><paragraph>[]Bar</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.type( 'Abc' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text></paragraph><paragraph>AbcBar</paragraph>'
        );
      } );

      it( 'text at same path', () => {
        john.setData( '<paragraph>[F]oo</paragraph>' );
        kate.setData( '<paragraph>Foo[]</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.type( 'Abc' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">F</$text>ooAbc</paragraph>'
        );
      } );

      it.skip( 'text inside other client\'s selection', () => {
        john.setData( '<paragraph>[Foo]</paragraph>' );
        kate.setData( '<paragraph>Fo[]o</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.type( 'Abc' );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">FoAbco</$text></paragraph>'
        );
      } );

      it( 'element in different path', () => {
        john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
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
        john.setData( '<paragraph>[Foo]</paragraph><paragraph>Bar</paragraph>' );
        kate.setData( '<paragraph>Foo</paragraph><paragraph>B[ar]</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.move( [ 1, 0 ] );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text></paragraph>' +
          '<paragraph>arB</paragraph>'
        );
      } );

      it( 'text in same path', () => {
        john.setData( '<paragraph>[Foo] Bar</paragraph>' );
        kate.setData( '<paragraph>Foo B[ar]</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.move( [ 0, 4 ] );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">Foo</$text> arB</paragraph>'
        );
      } );

      it( 'text inside other client\'s selection', () => {
        john.setData( '<paragraph>[Foo] Bar</paragraph>' );
        kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.move( [ 0, 1 ] );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">F</$text>Bar<$text bold="true">oo</$text> </paragraph>'
        );
      } );

      it( 'text from other client\'s selection', () => {
        john.setData( '<paragraph>[Foo] Bar</paragraph>' );
        kate.setData( '<paragraph>F[oo] Bar</paragraph>' );

        john.setAttribute( 'bold', 'true' );
        kate.move( [ 0, 7 ] );

        syncClients();

        expectClients(
          '<paragraph><$text bold="true">F</$text> Bar<$text bold="true">oo</$text></paragraph>'
        );
      } );
    } );
  } );
} );
