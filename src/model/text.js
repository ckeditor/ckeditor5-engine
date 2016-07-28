/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Node from './node.js';
import splitter from '../../utils/lib/grapheme-splitter.js';

/**
 * Model text node. Type of {@link engine.model.Node node} that contains {@link engine.model.Text#data text data}. Text
 * nodes support unicode, see below for more information.
 *
 * **Important:** see {@link engine.model.Node} to read about restrictions using `Text` and `Node` API.
 *
 * **Note:** keep in mind that `Text` instances might indirectly got removed from model tree when model is changed.
 * This happens when {@link engine.model.writer model writer} is used to change model and the text node is merged with
 * another text node. Then, both text nodes are removed and a new text node is inserted into the model. Because of
 * this behavior, keeping references to `Text` is not recommended. Instead, consider creating
 * {@link engine.model.LivePosition live position} placed before the text node.
 *
 * Text nodes support unicode:
 * * Symbols from unicode astral planes, that are unicode symbols with number above `U+FFFF`. Those symbols are represented
 * in JavaScript by two unicode characters with number below `U+FFFF` that are placed next to each other. Those are
 * called "surrogate pairs", as they only have meaning when they are together, while not having any (meaningful)
 * representation alone. Since they are represented by two characters, `String` containing such one symbol has `length`
 * equal to `2`, which causes problems when extracting or removing parts of such `String`.
 * * Symbols created using combining marks. They are a bit similar to astral plane symbols. Those are symbols created
 * from base character (i.e. `e`) and combining mark character (i.e. "combining acute accent" ` ́ `), together: `é`.
 * One base character may have multiple combining marks, creating one symbol. Such symbol, like astral plane symbol, is seen
 * as multiple characters in {String} but is perceived by humans as one symbol and should be treated like this.
 * * Normalization. Some symbols that can be created by base character and combining mark are exactly same (visually)
 * as some predefined unicode symbols. If that happens, text nodes normalizes groups of base character and combining marks
 * into a unicode symbol.
 * * Text node's {@link engine.model.Text#offsetSize offsetSize} is equal to the number of user perceived characters,
 * not unicode characters (meaning that surrogate pairs and combined groups increment `offsetSize` by `1`).
 *
 * @memberOf engine.model
 */
export default class Text extends Node {
	/**
	 * Creates a text node.
	 *
	 * @param {String} data Node's text.
	 * @param {Object} [attrs] Node's attributes. See {@link utils.toMap} for a list of accepted values.
	 */
	constructor( data, attrs ) {
		super( attrs );

		/**
		 * Text data split into array of graphemes (strings treated as one symbol, but combined from one or more characters).
		 *
		 * @private
		 * @member {Array.<String>} engine.model.Text#_graphemes
		 */
		this._graphemes = [];

		/**
		 * Text data contained in this text node.
		 *
		 * @member {String} engine.model.Text#data
		 */
		this.data = data || '';
	}

	get data() {
		return this._graphemes.join( '' );
	}

	set data( _data ) {
		this._graphemes = splitter.splitGraphemes( _data.normalize() );
	}

	/**
	 * @inheritDoc
	 */
	get offsetSize() {
		return this._graphemes.length;
	}

	/**
	 * Returns part of text data of given length, starting at given offset. This method acknowledges unicode combining marks
	 * and graphemes, so it is safer than {String#substring}. Use this method instead of {@link engine.model.Text#data data}
	 * whenever you need to extract a part of text node data.
	 *
	 * @param {Number} offset Offset of the first character to include in extracted part of text.
	 * @param {Number} [length=1] Length of extracted part of text.
	 * @returns {String} Part of data of given length, starting at given offset.
	 */
	getSymbols( offset, length = 1 ) {
		return this._graphemes.slice( offset, offset + length ).join( '' );
	}

	/**
	 * Creates a copy of this text node and returns it. Created text node has same text data and attributes as original text node.
	 */
	clone() {
		return new Text( this.data, this.getAttributes() );
	}

	/**
	 * Converts `Text` instance to plain object and returns it.
	 *
	 * @returns {Object} `Text` instance converted to plain object.
	 */
	toJSON() {
		let json = super.toJSON();

		json.data = this.data;

		return json;
	}

	/**
	 * Creates a `Text` instance from given plain object (i.e. parsed JSON string).
	 *
	 * @param {Object} json Plain object to be converted to `Text`.
	 * @returns {engine.model.Text} `Text` instance created using given plain object.
	 */
	static fromJSON( json ) {
		return new Text( json.data, json.attributes );
	}
}
