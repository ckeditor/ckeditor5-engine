/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Represents a base editable view.
 *
 * @class View
 * @extends Model
 */

CKEDITOR.define( [ 'emittermixin', 'utils' ], function( EmitterMixin, utils ) {
	class EditableView {
		/**
		 * Creates a new instance of the Editable View class.
		 *
		 * @constructor
		 * @param {Editable} model
		 */
		constructor( model ) {
			this.model = model;
		}

		appendTo() {
		}
	}

	utils.extend( EditableView.prototype, EmitterMixin );

	return EditableView;
} );