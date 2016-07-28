/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Node from './node.js';
import splitter from '../../utils/lib/grapheme-splitter.js';

/**
 * Tree view text node.
 *
 * `Text` supports unicode. See {@link engine.model.Text} for more information.
 *
 * @memberOf engine.view
 * @extends engine.view.Node
 */
export default class Text extends Node {
	/**
	 * Creates a tree view text node.
	 *
	 * @param {String} data Text.
	 */
	constructor( data ) {
		super();

		/**
		 * Text data split into array of graphemes (strings treated as one symbol, but combined from one or more characters).
		 *
		 * @private
		 * @member {Array.<String>} engine.view.Text#_graphemes
		 */
		this._graphemes = [];

		/**
		 * Text data contained in this text node.
		 *
		 * Setting the data fires the {@link view.Node#change change event}.
		 *
		 * @member {String} engine.view.Text#data
		 */
		this.data = data || '';
	}

	get data() {
		return this._graphemes.join( '' );
	}

	set data( _data ) {
		this._fireChange( 'text', this );

		this._graphemes = splitter.splitGraphemes( _data.normalize() );
	}

	/**
	 * Size of text node, that is number of symbols contained in it.
	 *
	 * **Note:** this is different than text node's {@link engine.view.Text#data data} length, which is number of characters
	 * in `data` string. Multiple characters in `data` string may combine into one single unicode symbol. Always use this
	 * property instead of `data.length`.
	 *
	 * @type {Number}
	 */
	get size() {
		return this._graphemes.length;
	}

	/**
	 * Returns part of text data of given length, starting at given offset. This method acknowledges unicode combining marks
	 * and graphemes, so it is more safe than {String#substring}. Use this method instead of {@link engine.view.Text#data data}
	 * whenever you need slice a part of text node data.
	 *
	 * @param {Number} offset Offset of the first character to include in extracted part of text.
	 * @param {Number} [length=1] Length of extracted part of text.
	 * @returns {String} Part of data of given length, starting at given offset.
	 */
	getSymbols( offset, length = 1 ) {
		return this._graphemes.slice( offset, offset + length ).join( '' );
	}

	/**
	 * Clones this node.
	 *
	 * @returns {engine.view.Text} Text node that is a clone of this node.
	 */
	clone() {
		return new Text( this.data );
	}

	/**
	 * Checks if this text node is similar to other text node.
	 * Both nodes should have the same data to be considered as similar.
	 *
	 * @param {engine.view.Text} otherNode Node to check if it is same as this node.
	 * @returns {Boolean}
	 */
	isSimilar( otherNode ) {
		if ( !( otherNode instanceof Text ) ) {
			return false;
		}

		return this === otherNode || this.data === otherNode.data;
	}
}
