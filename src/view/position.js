/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Text from './text.js';
import TextProxy from './textproxy.js';

import compareArrays from '../../utils/comparearrays.js';
import CKEditorError from '../../utils/ckeditorerror.js';
import EditableElement from './editableelement.js';

/**
 * Position in the tree. Position is always located before or after a node.
 *
 * @memberOf engine.view
 */
export default class Position {
	/**
	 * Creates a position.
	 *
	 * @param {engine.view.Node} parent Position parent node.
	 * @param {Number} offset Position offset.
	 */
	constructor( parent, offset ) {
		/**
		 * Position parent node.
		 *
		 * @member {engine.view.Node} engine.view.Position#parent
		 */
		this.parent = parent;

		/**
		 * Position offset.
		 *
		 * @member {Number} engine.view.Position#offset
		 */
		this.offset = offset;
	}

	/**
	 * Node directly after the position. Equals `null` when there is no node after position or position is located
	 * inside text node.
	 *
	 * @readonly
	 * @type {engine.view.Node|null}
	 */
	get nodeAfter() {
		if ( this.parent instanceof Text ) {
			return null;
		}

		return this.parent.getChild( this.offset ) || null;
	}

	/**
	 * Node directly before the position. Equals `null` when there is no node before position or position is located
	 * inside text node.
	 *
	 * @readonly
	 * @type {engine.view.Node|null}
	 */
	get nodeBefore() {
		if ( this.parent instanceof Text ) {
			return null;
		}

		return this.parent.getChild( this.offset - 1 ) || null;
	}

	/**
	 * Is `true` if position is at the beginning of its {@link engine.view.Position#parent parent}, `false` otherwise.
	 *
	 * @readonly
	 * @type {Boolean}
	 */
	get isAtStart() {
		return this.offset === 0;
	}

	/**
	 * Is `true` if position is at the end of its {@link engine.view.Position#parent parent}, `false` otherwise.
	 *
	 * @readonly
	 * @type {Boolean}
	 */
	get isAtEnd() {
		const endOffset = this.parent instanceof Text ? this.parent.data.length : this.parent.childCount;

		return this.offset === endOffset;
	}

	/**
	 * Position's root, that is the root of the position's parent element.
	 *
	 * @readonly
	 * @type {engine.view.Node|engine.view.DocumentFragment}
	 */
	get root() {
		return this.parent.root;
	}

	/**
	 * {@link engine.view.EditableElement EditableElement} instance that contains this position, or `null` if
	 * position is not inside an editable element.
	 *
	 * @type {engine.view.EditableElement|null}
	 */
	get editableElement() {
		let editable = this.parent;

		while ( !( editable instanceof EditableElement ) ) {
			if ( editable.parent ) {
				editable = editable.parent;
			} else {
				return null;
			}
		}

		return editable;
	}

	/**
	 * Returns a new instance of Position with offset incremented by `shift` value.
	 *
	 * @param {Number} shift How position offset should get changed. Accepts negative values.
	 * @returns {engine.view.Position} Shifted position.
	 */
	getShiftedBy( shift ) {
		let shifted = Position.createFromPosition( this );

		let offset = shifted.offset + shift;
		shifted.offset = offset < 0 ? 0 : offset;

		return shifted;
	}

	/**
	 * Returns ancestors array of this position, that is this position's parent and it's ancestors.
	 *
	 * @returns {Array} Array with ancestors.
	 */
	getAncestors() {
		return this.parent.getAncestors( { includeNode: true, parentFirst: true } );
	}

	/**
	 * Checks whether this position equals given position.
	 *
	 * @param {engine.view.Position} otherPosition Position to compare with.
	 * @returns {Boolean} True if positions are same.
	 */
	isEqual( otherPosition ) {
		return this == otherPosition || ( this.parent == otherPosition.parent && this.offset == otherPosition.offset );
	}

	/**
	 * Checks whether this position is touching given position. Positions touch when there are no text nodes
	 * or empty nodes in a range between them. Technically, those positions are not equal but in many cases
	 * they are very similar or even indistinguishable.
	 *
	 * @param {engine.view.Position} otherPosition Position to compare with.
	 * @returns {Boolean} `true` if positions touch, `false` otherwise.
	 */
	isTouching( otherPosition ) {
		if ( this.root != otherPosition.root ) {
			return false;
		}

		const thisPath = this.parent.getAncestors( { includeNode: true } ).map( ( node ) => node.index );
		thisPath.push( this.offset );
		thisPath.shift();

		const otherPath = otherPosition.parent.getAncestors( { includeNode: true } ).map( ( node ) => node.index );
		otherPath.push( otherPosition.offset );
		otherPath.shift();

		let left = null;
		let right = null;

		let leftPath = null;
		let rightPath = null;

		let compare = compareArrays( thisPath, otherPath );
		let diffAt = null;

		switch ( compare ) {
			case 'same':
				return true;

			case 'prefix':
				left = Position.createFromPosition( this );
				leftPath = thisPath;

				right = Position.createFromPosition( otherPosition );
				rightPath = otherPath;

				diffAt = leftPath.length;
				break;

			case 'extension':
				left = Position.createFromPosition( otherPosition );
				leftPath = otherPath;

				right = Position.createFromPosition( this );
				rightPath = thisPath;

				diffAt = leftPath.length;
				break;

			default:
				diffAt = compare;

				left = Position.createFromPosition( thisPath[ diffAt ] < otherPath[ diffAt ] ? this : otherPosition );
				leftPath = thisPath[ diffAt ] < otherPath[ diffAt ] ? thisPath : otherPath;

				right = Position.createFromPosition( thisPath[ diffAt ] < otherPath[ diffAt ] ? otherPosition : this );
				rightPath = thisPath[ diffAt ] < otherPath[ diffAt ] ? otherPath : thisPath;
				break;
		}

		// Right: [ a, ..., x, 0, ..., 0 ] -> [ a, ..., x ].
		// Left:  [ 0, 0 ], Right: [ 0, 0, 0, 0 ] -> [ 0, 0 ].
		// From "touching" perspective, those paths are same.
		while ( rightPath[ rightPath.length - 1 ] === 0 && rightPath.length > diffAt ) {
			rightPath.pop();
		}

		if ( diffAt == rightPath.length && diffAt == leftPath.length ) {
			// Case:
			// Left:  [ common, ..., common ]
			// Right: [ common, ..., common ]
			return true;
		} else if ( diffAt == rightPath.length - 1 && leftPath[ diffAt ] == rightPath[ diffAt ] - 1 && leftPath.length > diffAt + 1 ) {
			// Case:
			//                                            { 1 - m }
			// Left:  [ common, ..., common, x - 1, lastIndex, ..., lastIndex ]
			// Right: [ common, ..., common, x ]
			//
			// Check if all offsets on left path after diff point are start offsets of last children.
			let element = left.parent;
			leftPath[ leftPath.length - 1 ]--;

			for ( let i = leftPath.length - 1; i >= diffAt + 1; i-- ) {
				const count = element.data ? element.data.length : element.childCount;

				if ( leftPath[ i ] !== count - 1 ) {
					return false;
				}

				element = element.parent;
			}

			return true;
		}

		return false;
	}

	/**
	 * Checks whether this position is located before given position. When method returns `false` it does not mean that
	 * this position is after give one. Two positions may be located inside separate roots and in that situation this
	 * method will still return `false`.
	 *
	 * @see engine.view.Position#isAfter
	 * @see engine.view.Position#compareWith
	 * @param {engine.view.Position} otherPosition Position to compare with.
	 * @returns {Boolean} Returns `true` if this position is before given position.
	 */
	isBefore( otherPosition ) {
		return this.compareWith( otherPosition ) == 'before';
	}

	/**
	 * Checks whether this position is located after given position. When method returns `false` it does not mean that
	 * this position is before give one. Two positions may be located inside separate roots and in that situation this
	 * method will still return `false`.
	 *
	 * @see engine.view.Position#isBefore
	 * @see engine.view.Position#compareWith
	 * @param {engine.view.Position} otherPosition Position to compare with.
	 * @returns {Boolean} Returns `true` if this position is after given position.
	 */
	isAfter( otherPosition ) {
		return this.compareWith( otherPosition ) == 'after';
	}

	/**
	 * Checks whether this position is before, after or in same position that other position. Two positions may be also
	 * different when they are located in separate roots.
	 *
	 * @param {engine.view.Position} otherPosition Position to compare with.
	 * @returns {engine.view.PositionRelation}
	 */
	compareWith( otherPosition ) {
		if ( this.isEqual( otherPosition ) ) {
			return 'same';
		}

		// If positions have same parent.
		if ( this.parent == otherPosition.parent ) {
			return this.offset < otherPosition.offset ? 'before' : 'after';
		}

		if ( this.root != otherPosition.root ) {
			return 'different';
		}

		// Get path from root to position's parent element.
		const path = this.parent.getAncestors( { includeNode: true } ).map( ( node ) => node.index );
		path.push( this.offset );

		const otherPath = otherPosition.parent.getAncestors( { includeNode: true } ).map( ( node ) => node.index );
		otherPath.push( otherPosition.offset );

		// Compare both path arrays to find common ancestor.
		const result = compareArrays( path, otherPath );

		switch ( result ) {
			case 'prefix':
				return 'before';

			case 'extension':
				return 'after';

			default:
				if ( path[ result ] < otherPath[ result ] ) {
					return 'before';
				} else {
					return 'after';
				}
		}
	}

	/**
	 * Creates position at the given location. The location can be specified as:
	 *
	 * * a {@link engine.view.Position position},
	 * * parent element and offset (offset defaults to `0`),
	 * * parent element and `'end'` (sets position at the end of that element),
	 * * {@link engine.view.Item view item} and `'before'` or `'after'` (sets position before or after given view item).
	 *
	 * This method is a shortcut to other constructors such as:
	 *
	 * * {@link engine.view.Position.createBefore},
	 * * {@link engine.view.Position.createAfter},
	 * * {@link engine.view.Position.createFromPosition}.
	 *
	 * @param {engine.view.Item|engine.model.Position} itemOrPosition
	 * @param {Number|'end'|'before'|'after'} [offset=0] Offset or one of the flags. Used only when
	 * first parameter is a {@link engine.view.Item view item}.
	 */
	static createAt( itemOrPosition, offset ) {
		if ( itemOrPosition instanceof Position ) {
			return this.createFromPosition( itemOrPosition );
		} else {
			let node = itemOrPosition;

			if ( offset == 'end' ) {
				offset = node instanceof Text ? node.data.length : node.childCount;
			} else if ( offset == 'before' ) {
				return this.createBefore( node );
			} else if ( offset == 'after' ) {
				return this.createAfter( node );
			} else if ( !offset ) {
				offset = 0;
			}

			return new Position( node, offset );
		}
	}

	/**
	 * Creates a new position after given view item.
	 *
	 * @param {engine.view.Item} item View item after which the position should be located.
	 * @returns {engine.view.Position}
	 */
	static createAfter( item ) {
		// TextProxy is not a instance of Node so we need do handle it in specific way.
		if ( item instanceof TextProxy ) {
			return new Position( item.textNode, item.offsetInText + item.data.length );
		}

		if ( !item.parent ) {
			/**
			 * You can not make a position after a root.
			 *
			 * @error position-after-root
			 * @param {engine.view.Node} root
			 */
			throw new CKEditorError( 'view-position-after-root: You can not make position after root.', { root: item } );
		}

		return new Position( item.parent, item.index + 1 );
	}

	/**
	 * Creates a new position before given view item.
	 *
	 * @param {engine.view.Item} item View item before which the position should be located.
	 * @returns {engine.view.Position}
	 */
	static createBefore( item ) {
		// TextProxy is not a instance of Node so we need do handle it in specific way.
		if ( item instanceof TextProxy ) {
			return new Position( item.textNode, item.offsetInText );
		}

		if ( !item.parent ) {
			/**
			 * You cannot make a position before a root.
			 *
			 * @error position-before-root
			 * @param {engine.view.Node} root
			 */
			throw new CKEditorError( 'view-position-before-root: You can not make position before root.', { root: item } );
		}

		return new Position( item.parent, item.index );
	}

	/**
	 * Creates and returns a new instance of `Position`, which is equal to the passed position.
	 *
	 * @param {engine.view.Position} position Position to be cloned.
	 * @returns {engine.view.Position}
	 */
	static createFromPosition( position ) {
		return new this( position.parent, position.offset );
	}
}

/**
 * A flag indicating whether this position is `'before'` or `'after'` or `'same'` as given position.
 * If positions are in different roots `'different'` flag is returned.
 *
 * @typedef {String} engine.view.PositionRelation
 */
