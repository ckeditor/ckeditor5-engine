/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import Delta from './delta/delta.js';
import NoOperation from './operation/nooperation.js';

import CKEditorError from '../../utils/ckeditorerror.js';

/**
 * History keeps the track of all the deltas applied to the {@link engine.model.Document document} and provides
 * utility tools to operate on the history. Most of times history is needed to transform a delta that has wrong
 * {@link engine.model.delta.Delta#baseVersion} to a state where it can be applied to the document.
 *
 * @memberOf engine.model
 */
export default class History {
	/**
	 * Creates an empty History instance.
	 */
	constructor() {
		/**
		 * Deltas added to the history.
		 *
		 * @private
		 * @member {Array.<engine.model.delta.Delta>} engine.model.History#_deltas
		 */
		this._deltas = [];

		/**
		 * Helper structure that maps added delta's base version to the index in {@link engine.model.History#_deltas}
		 * at which the delta was added.
		 *
		 * @private
		 * @member {Map} engine.model.History#_historyPoints
		 */
		this._historyPoints = new Map();

		/**
		 * Stores key => value pairings for deltas that has been marked as inactive. Key is the marked delta,
		 * while value is its "no-operation" counterpart - an instance of plain {@link engine.model.delta.Delta Delta}
		 * class with all operations changed to {@link engine.model.operation.NoOperation no-operations}.
		 *
		 * @private
		 * @member {WeakSet} engine.model.History#_inactiveDeltas
		 */
		this._inactiveDeltas = new WeakMap();

		/**
		 * Stores updated versions of history deltas.
		 *
		 * @private
		 * @type {WeakMap}
		 */
		this._updatedDeltas = new WeakMap();

		/**
		 * Stores earliest (lowest) {@link engine.model.delta.Delta#baseVersion baseVersion} of the deltas
		 * that has been marked inactive. In other words, all deltas with baseVersion lower than this has not been
		 * marked as inactive.
		 *
		 * @private
		 * @type {Number}
		 */
		this._earliestInactivePoint = Number.POSITIVE_INFINITY;
	}

	/**
	 * Adds an operation to the history.
	 *
	 * @param {engine.model.operation.Operation} operation Operation to add.
	 */
	addOperation( operation ) {
		const delta = operation.delta;

		// History cares about deltas not singular operations.
		// Operations from a delta are added one by one, from first to last.
		// Operations from one delta cannot be mixed with operations from other deltas.
		// This all leads us to the conclusion that we could just save deltas history.
		// What is more, we need to check only the last position in history to check if delta is already in the history.
		if ( delta && this._deltas[ this._deltas.length - 1 ] !== delta ) {
			const index = this._deltas.length;

			this._deltas[ index ] = delta;
			this._historyPoints.set( delta.baseVersion, index );
			this._updatedDeltas.set( delta, [ delta ] );
		}
	}

	/**
	 * Returns history items, containing all deltas with baseVersion lower or equal to given history point (if passed).
	 * **Note:** some deltas might have different from than deltas originally added to history.
	 *
	 * @see engine.model.History#markInactiveDelta
	 * @see engine.model.History#updateDelta
	 * @param {Number} from History point.
	 * @returns {Iterator.<engine.model.HistoryItem>} Deltas from given history point to the end of history.
	 */
	*getHistoryItems( from = 0 ) {
		// No deltas added, nothing to yield.
		if ( this._deltas.length === 0 ) {
			return;
		}

		const lastDelta = this._deltas[ this._deltas.length - 1 ];
		const lastHistoryPoint = lastDelta.baseVersion + lastDelta.operations.length;

		// Given history point is too big for the history (history has not reached it yet). Nothing to return.
		if ( from >= lastHistoryPoint ) {
			return;
		}

		let i = this._historyPoints.get( from );

		// Given history point is in the middle of delta.
		if ( i === undefined && from !== this._lastHistoryPoint ) {
			throw new CKEditorError( 'history-wrong-version: Given history point is incorrect.' );
		}

		const skipReversed = from <= this._earliestInactivePoint;

		while ( i < this._deltas.length ) {
			if ( !skipReversed ) {
				yield {
					delta: this._deltas[ i ],
					index: i
				};
			} else {
				if ( this._inactiveDeltas.has( this._deltas[ i ] ) ) {
					yield {
						delta: this._inactiveDeltas.get( this._deltas[ i ] ),
						index: i
					};
				} else {
					for ( let delta of this._updatedDeltas.get( this._deltas[ i ] ) ) {
						yield {
							delta: delta,
							index: i
						};
					}
				}
			}

			i++;
		}
	}

	/**
	 * Marks given delta from document history as inactive.
	 *
	 * @see engine.model.History#getHistoryItems
	 * @param {engine.model.delta.Delta} delta Delta to mark as inactive.
	 */
	markInactiveDelta( delta ) {
		this._inactiveDeltas.set( delta, convertToNoOps( delta ) );

		if ( delta.baseVersion < this._earliestInactivePoint ) {
			this._earliestInactivePoint = delta.baseVersion;
		}
	}

	/**
	 * Updates delta at given index. This method allows to updated single delta with multiple ones. If that's the case,
	 * the deltas will be returned as separate {@link engine.model.HistoryItem history items} but will have same
	 * {@link engine.model.HistoryItem#index history item index}. Updating one of those deltas will result in
	 * updating all of them.
	 *
	 * @see engine.model.History#getHistoryItems
	 * @param {Number} historyDeltaIndex Index of delta to update.
	 * @param {Array.<engine.model.delta.Delta>} newDeltas Deltas that will overwrite updated delta.
	 */
	updateDelta( historyDeltaIndex, newDeltas ) {
		this._updatedDeltas.set( this._deltas[ historyDeltaIndex ], newDeltas );
	}
}

function convertToNoOps( delta ) {
	const noOpDelta = new Delta();

	for ( let operation of delta.operations ) {
		noOpDelta.addOperation( new NoOperation( operation.baseVersion ) );
	}

	return noOpDelta;
}

/**
 * Object containing information about an item from document history.
 *
 * @typedef {Object} engine.model.HistoryItem
 * @property {String} name Entity name.
 * @property {engine.model.SchemaPath} inside Path inside which the entity is placed.
 * @property {Array.<String>|String} [attributes] If set, the query applies only to entities that has attribute(s) with given key.
 */
