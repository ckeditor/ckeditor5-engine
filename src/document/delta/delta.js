/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

CKEDITOR.define( [], () => {
	/**
	 * Base class for all deltas.
	 *
	 * Delta is a single, from the user action point of view, change in the editable document, like insert, split or
	 * rename element. Delta is composed of operations, which are unit changes needed to be done to execute user action.
	 *
	 * Multiple deltas are grouped into a single {@link document.Batch}.
	 *
	 * @class document.delta.Delta
	 */
	class Delta {
		/**
		 * Creates a delta instance.
		 *
		 * @constructor
		 */
		constructor() {
			/**
			 * {@link document.Batch} which delta is a part of. This property is null by default and set by the
			 * {@link Document.Batch#addDelta} method.
			 *
			 * @readonly
			 * @type {document.Batch}
			 */
			this.batch = null;

			/**
			 * Array of operations which compose delta.
			 *
			 * @readonly
			 * @type {document.operation.Operation[]}
			 */
			this.operations = [];
		}

		/**
		 * Add operation to the delta.
		 *
		 * @param {document.operation.Operation} operation Operation instance.
		 */
		addOperation( operation ) {
			operation.delta = this;
			this.operations.push( operation );

			return operation;
		}
	}

	return Delta;
} );
