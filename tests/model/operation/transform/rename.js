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

	describe( 'rename', () => {
		describe( 'by attribute', () => {
			it( 'on text in different path', () => {
				john.setData( '<paragraph>F[]oo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Ba]r</paragraph>' );

				john.rename( 'heading1' );
				kate.setAttribute( 'bold', 'true' );

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>' +
					'<paragraph><$text bold="true">Ba</$text>r</paragraph>'
				);
			} );

			it( 'on text in same path', () => {
				john.setData( '<paragraph>[]Foo Bar</paragraph>' );
				kate.setData( '<paragraph>[Foo Bar]</paragraph>' );

				john.rename( 'heading1' );
				kate.setAttribute( 'bold', 'true' );

				syncClients();

				expectClients(
					'<heading1><$text bold="true">Foo Bar</$text></heading1>'
				);
			} );

			it( 'on text inside other user\'s selection', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>[Foo]</paragraph>' );

				john.rename( 'heading1' );
				kate.setAttribute( 'bold', 'true' );

				syncClients();

				expectClients(
					'<heading1><$text bold="true">Foo</$text></heading1>'
				);
			} );
		} );

		describe( 'by insert', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>F[]oo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>[]' );

				john.rename( 'heading1' );
				kate.insert( '<paragraph>Abc</paragraph>' );

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>' +
					'<paragraph>Bar</paragraph>' +
					'<paragraph>Abc</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>F[]oo</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[]' );

				john.rename( 'heading1' );
				kate.insert( '<paragraph>Bar</paragraph>' );

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'text in same path', () => {
				john.setData( '<paragraph>F[]oo Bar</paragraph>' );
				kate.setData( '<paragraph>Foo[] Bar</paragraph>' );

				john.rename( 'heading1' );
				kate.type( 'Abc' );

				syncClients();

				expectClients( '<heading1>FooAbc Bar</heading1>' );
			} );

			it( 'text in different paths', () => {
				john.setData( '<blockQuote><paragraph>F[]oo</paragraph></blockQuote><paragraph>Bar</paragraph>' );
				kate.setData( '<blockQuote><paragraph>Foo</paragraph></blockQuote><paragraph>B[]ar</paragraph>' );

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
				john.setData( '<paragraph>[]Foo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[ar]</paragraph>' );

				john.rename( 'heading1' );
				kate.move( [ 1, 0 ] );

				syncClients();

				expectClients( '<heading1>Foo</heading1><paragraph>arB</paragraph>' );
			} );

			it( 'element in different path #2', () => {
				john.setData( '<blockQuote>[]<paragraph>Foo</paragraph><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>Foo</paragraph><paragraph>[Bar]</paragraph></blockQuote>' );

				john.rename( 'blockQuote2' );
				kate.move( [ 0, 0, 0 ] );

				syncClients();

				expectClients(
					'<blockQuote2>' +
						'<paragraph>BarFoo</paragraph>' +
						'<paragraph></paragraph>' +
					'</blockQuote2>'
				);
			} );

			it( 'element in different path #3', () => {
				john.setData( '<blockQuote><paragraph>[]Foo</paragraph><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<blockQuote><paragraph>[Foo]</paragraph><paragraph>Bar</paragraph></blockQuote>' );

				john.rename( 'heading1' );
				kate.move( [ 0, 1, 0 ] );

				syncClients();

				expectClients(
					'<blockQuote>' +
						'<heading1></heading1>' +
						'<paragraph>FooBar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>[]Foo Bar</paragraph>' );
				kate.setData( '<paragraph>Foo [Bar]</paragraph>' );

				john.rename( 'heading1' );
				kate.move( [ 0, 0 ] );

				syncClients();

				expectClients( '<heading1>BarFoo </heading1>' );
			} );
		} );

		describe( 'by remove', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>F[]oo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>[Bar]</paragraph>' );

				john.rename( 'heading1' );
				kate.remove();

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>' +
					'<paragraph></paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>[]Foo</paragraph>' );
				kate.setData( '<paragraph>F[o]o</paragraph>' );

				john.rename( 'heading1' );
				kate.remove();

				syncClients();

				expectClients( '<heading1>Fo</heading1>' );
			} );

			it( 'element in other user\'s selection', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>[Foo]</paragraph>' );

				john.rename( 'heading1' );
				kate.remove();

				syncClients();

				expectClients(
					'<heading1></heading1>'
				);
			} );
		} );

		describe( 'by rename', () => {
			it( 'elements in different paths #1', () => {
				john.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
				john.setSelection( [ 0, 0 ] );

				kate.setData( '<paragraph>Foo</paragraph><paragraph>Bar</paragraph>' );
				kate.setSelection( [ 1, 0 ] );

				john.rename( 'heading1' );
				kate.rename( 'heading2' );

				syncClients();

				expectClients( '<heading1>Foo</heading1><heading2>Bar</heading2>' );
			} );

			it( 'elements in different paths #2', () => {
				john.setData( '<blockQuote><paragraph>Foo Bar</paragraph></blockQuote>' );
				john.setSelection( [ 0, 0 ] );

				kate.setData( '<blockQuote><paragraph>Foo Bar</paragraph></blockQuote>' );
				kate.setSelection( [ 0, 0, 0 ] );

				john.rename( 'blockQuote2' );
				kate.rename( 'heading2' );

				syncClients();

				expectClients( '<blockQuote2><heading2>Foo Bar</heading2></blockQuote2>' );
			} );

		it( 'elements in same path', () => {
				john.setData( '<blockQuote><paragraph>Foo Bar</paragraph></blockQuote>' );
				john.setSelection( [ 0, 1 ] );

				kate.setData( '<blockQuote><paragraph>Foo Bar</paragraph></blockQuote>' );
				kate.setSelection( [ 0, 1 ] );

				john.rename( 'blockQuote2' );
				kate.rename( 'blockQuote3' );

				syncClients();

				expectClients( '<blockQuote2><paragraph>Foo Bar</paragraph></blockQuote2>' );
			} );
		} );

		describe( 'by split', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>F[]oo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph><paragraph>B[]ar</paragraph>' );

				john.rename( 'heading1' );
				kate.split();

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>' +
					'<paragraph>B</paragraph>' +
					'<paragraph>ar</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>[]Foo Bar</paragraph>' );
				kate.setData( '<paragraph>Foo []Bar</paragraph>' );

				john.rename( 'heading1' );
				kate.split();

				syncClients();

				expectClients( '<heading1>Foo </heading1><heading1>Bar</heading1>' );
			} );

			it( 'element in same path, then undo', () => {
				john.setData( '<paragraph>[]Foo Bar</paragraph>' );
				kate.setData( '<paragraph>Foo []Bar</paragraph>' );

				john.rename( 'heading1' );
				john.undo();

				kate.split();

				syncClients();

				expectClients( '<paragraph>Foo </paragraph><paragraph>Bar</paragraph>' );
			} );

			it( 'element in other user\'s selection', () => {
				john.setData( '<paragraph>[Foo]</paragraph>' );
				kate.setData( '<paragraph>F[]oo</paragraph>' );

				john.rename( 'heading1' );
				kate.split();

				syncClients();

				expectClients(
					'<heading1>F</heading1>' +
					'<heading1>oo</heading1>'
				);
			} );
		} );

		describe( 'by wrap', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>[]Foo</paragraph><paragraph>Bar</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[<paragraph>Bar</paragraph>]' );

				john.rename( 'heading1' );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>' +
					'<blockQuote>' +
						'<paragraph>Bar</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<paragraph>[]Foo</paragraph>' );
				kate.setData( '[<paragraph>Foo</paragraph>]' );

				john.rename( 'heading1' );
				kate.wrap( 'blockQuote' );

				syncClients();

				expectClients( '<blockQuote><heading1>Foo</heading1></blockQuote>' );
			} );
		} );

		describe( 'by unwrap', () => {
			it( 'element in different path', () => {
				john.setData( '<paragraph>F[]oo</paragraph><blockQuote><paragraph>Bar</paragraph></blockQuote>' );
				kate.setData( '<paragraph>Foo</paragraph><blockQuote>[<paragraph>Bar</paragraph>]</blockQuote>' );

				john.rename( 'heading1' );
				kate.unwrap();

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>' +
					'<paragraph>Bar</paragraph>'
				);
			} );

			it( 'element in same path', () => {
				john.setData( '<blockQuote><paragraph>F[]oo</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[<paragraph>Foo</paragraph>]</blockQuote>' );

				john.rename( 'heading1' );
				kate.unwrap();

				syncClients();

				expectClients(
					'<heading1>Foo</heading1>'
				);
			} );
		} );
	} );
} );
