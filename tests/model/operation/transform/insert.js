import { Client, syncClients, expectClients } from './utils.js';

describe.only( 'transform', () => {
	let john, kate;

	beforeEach( () => {
		return Promise.all( [
			Client.get().then( client => john = client ),
			Client.get().then( client => kate = client )
		] );
	} );

	afterEach( () => {
		return Promise.all( [ john.destroy(), kate.destroy() ] );
	} );

	describe( 'insert', () => {
		describe( 'by insert', () => {
			it( 'elements at same position #1', () => {
				john.setData( '[]<paragraph>Foo</paragraph>' );
				kate.setData( '[]<paragraph>Foo</paragraph>' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.insert( '<paragraph>Xyz</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Xyz</paragraph>' +
					'<paragraph>Foo</paragraph>'
				);
			} );

			it( 'elements at same position #2', () => {
				john.setData( '[]<paragraph>Foo</paragraph>' );
				kate.setData( '[]<paragraph>Foo</paragraph>' );

				kate.insert( '<paragraph>Xyz</paragraph>' );
				john.insert( '<paragraph>Abc</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Xyz</paragraph>' +
					'<paragraph>Foo</paragraph>'
				);
			} );

			it( 'elements in same parent', () => {
				john.setData( '[]<paragraph>Foo</paragraph>' );
				kate.setData( '<paragraph>Foo</paragraph>[]' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.insert( '<paragraph>Xyz</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<paragraph>Foo</paragraph>' +
					'<paragraph>Xyz</paragraph>'
				);
			} );

			it( 'elements in same path', () => {
				john.setData( '[]<blockQuote><paragraph>Foo</paragraph></blockQuote>' );
				kate.setData( '<blockQuote>[]<paragraph>Foo</paragraph></blockQuote>' );

				john.insert( '<paragraph>Abc</paragraph>' );
				kate.insert( '<paragraph>Xyz</paragraph>' );

				syncClients();

				expectClients(
					'<paragraph>Abc</paragraph>' +
					'<blockQuote>' +
						'<paragraph>Xyz</paragraph>' +
						'<paragraph>Foo</paragraph>' +
					'</blockQuote>'
				);
			} );

			it( 'text at different paths', () => {
				john.setData( '<paragraph>Abc[]</paragraph><paragraph>Xyz</paragraph>' );
				kate.setData( '<paragraph>Abc</paragraph><paragraph>[]Xyz</paragraph>' );

				john.type( 'Foo' );
				kate.type( 'Bar' );

				syncClients();

				expectClients(
					'<paragraph>AbcFoo</paragraph>' +
					'<paragraph>BarXyz</paragraph>'
				);
			} );
		} );
	} );
} );