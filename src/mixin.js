/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Represents an object that can be used as a mixin source.
 *
 * @class Mixin
 */

CKEDITOR.define( [ 'utils' ], function( utils ) {
	/**
	 * Creates a mixin object.
	 *
	 * @param {Object} properties The mixin properties to be copied to target objects.
	 * @constructor
	 */
	function Mixin( properties ) {
		utils.extend( this, properties );

		/**
		 * Mixes the properties of this object into another object.
		 *
		 * @method mixin
		 * @param {Object} target The target object into which copy this mixin.
		 */
		// Use defineProperty() so it is not enumerable and will not be copied to the target object by utils.extend().
		Object.defineProperty( this, 'mixin', {
			value: function( target ) {
				utils.extend( target, this );
			}
		} );
	}

	return Mixin;
} );
