/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/model/differ
 */

import diff from '@ckeditor/ckeditor5-utils/src/diff';
import Position from './position';
import Range from './range';
import Element from './element';

/**
 * Calculates difference between two model states.
 *
 * Receives operations that are to be applied on the model document. Marks parts of the model document tree which
 * are changed and saves those elements state before the change. Then, it compares saved elements with the
 * changed elements, after all changes are applied on the model document. Calculates the diff between saved
 * elements and new ones and returns a changes set.
 */
export default class Differ {
	constructor() {
		/**
		 * A map that stores all model elements which children has changed.
		 *
		 * The keys of the map are references to the model elements.
		 * The values of the map are the element's children before the change. Text nodes are split into single characters.
		 *
		 * @private
		 * @member {Map}
		 */
		this._changedChildren = new Map();

		/**
		 * A map that stores all model elements which properties (name or attributes) has changed.
		 *
		 * The keys of the map are references to the model elements.
		 * The values of the map are the element's properties before the change.
		 *
		 * @private
		 * @type {Map}
		 */
		this._changedElements = new Map();

		/**
		 * A map that stores all changed markers.
		 *
		 * The keys of the map are marker names.
		 * The values of the map are objects with properties `oldRange` and `newRange`. Those holds the marker range
		 * state before and after the change.
		 *
		 * @private
		 * @type {Map}
		 */
		this._changedMarkers = new Map();

		/**
		 * Stores how many changes has been processed. Used to order changes chronologically. It is important
		 * when changes are sorted.
		 *
		 * @private
		 * @type {Number}
		 */
		this._changeCount = 0;
	}

	/**
	 * Buffers given operation. Operation has to be buffered before it is executed.
	 *
	 * Operation type is checked and it is checked which nodes it will affect. Then those nodes are stored in `Differ`
	 * in the state before the operation is executed.
	 *
	 * @param {module:engine/model/operation/operation~Operation} operation Operation to buffer.
	 */
	bufferOperation( operation ) {
		switch ( operation.type ) {
			case 'insert':
				this._markChildrenChange( operation.position.parent );

				break;
			case 'addAttribute':
			case 'removeAttribute':
			case 'changeAttribute':
				for ( const item of operation.range.getItems() ) {
					if ( item.is( 'element' ) ) {
						this._markElementChange( item );
					} else {
						this._markChildrenChange( item.parent );
					}
				}

				break;
			case 'remove':
			case 'move':
			case 'reinsert':
				this._markChildrenChange( operation.sourcePosition.parent );
				this._markChildrenChange( operation.targetPosition.parent );

				break;
			case 'rename':
				this._markElementChange( operation.position.nodeAfter );

				break;
		}
	}

	/**
	 * Buffers marker change.
	 *
	 * @param {String} markerName Name of marker which changed.
	 * @param {module:engine/model/range~Range|null} oldRange Marker range before the change or `null` if marker was just created.
	 * @param {module:engine/model/range~Range|null} newRange Marker range after the change or `null` if marker was removed.
	 */
	bufferMarkerChange( markerName, oldRange, newRange ) {
		const buffered = this._changedMarkers.get( markerName );

		if ( !buffered ) {
			this._changedMarkers.set( markerName, {
				oldRange,
				newRange
			} );
		} else {
			if ( buffered.oldRange == null && newRange == null ) {
				// The marker is going to be removed (`newRange == null`) but it did not exist before the change set
				// (`buffered.oldRange == null`). In this case, do not keep the marker in buffer at all.
				this._changedMarkers.delete( markerName );
			} else {
				buffered.newRange = newRange;
			}
		}
	}

	/**
	 * Returns all markers which should be removed as a result of buffered changes.
	 *
	 * @returns {Array.<Object>} Markers to remove. Each array item is an object containing `name` and `range` property.
	 */
	getMarkersToRemove() {
		const result = [];

		for ( const [ name, change ] of this._changedMarkers ) {
			if ( change.oldRange != null ) {
				result.push( { name, range: change.oldRange } );
			}
		}

		return result;
	}

	/**
	 * Returns all markers which should be added as a result of buffered changes.
	 *
	 * @returns {Array.<Object>} Markers to add. Each array item is an object containing `name` and `range` property.
	 */
	getMarkersToAdd() {
		const result = [];

		for ( const [ name, change ] of this._changedMarkers ) {
			if ( change.newRange != null ) {
				result.push( { name, range: change.newRange } );
			}
		}

		return result;
	}

	/**
	 * Calculates diff between old model tree state (before all the buffered operations) and the new model tree state
	 * (actual one). Should be called after all buffered operations are executed.
	 *
	 * The diff set is returned as an array of diff items, each describing a change done on model. The items are sorted by
	 * the position on which the change happened. If a position {@link module:engine/model/position~Position#isBefore is before}
	 * another one, it will be on an earlier index in the diff set.
	 *
	 * @returns {Array.<Object>} Diff between old and new model tree state.
	 */
	getChanges() {
		// Will contain returned results.
		const diffSet = [];

		// Handle those elements, which child list has changed.
		for ( const [ element, snapshotChildren ] of this._changedChildren ) {
			// If the element itself has changed, skip it for now.
			// There is no use in creating a diff for this element's children changes if it will be re-inserted anyway.
			if ( this._changedElements.has( element ) && this._hasChangedName( element ) ) {
				continue;
			}

			// Get the current list of element's children. Convert text nodes to character-attributes pairs (like for stored child list).
			const elementChildren = getChildrenWithSingleCharacters( element.getChildren() );

			// Get a diff between old and new children.
			// Treat same characters with different attributes as different entities (so 'a' with bold is different from 'a' without bold).
			let actions = diff( snapshotChildren, elementChildren, diffChildren( true ) );

			// Since diffing text nodes is difficult, it is done in two steps. The second step is to post-process `actions`
			// to look which characters have really been inserted/deleted and which just had its attributes changed.
			//
			// Consider those two examples:
			//
			// Foo<$text bold="true">bar</$text> -> Foob<$text bold="true">bar</$text>
			// Foobar -> F<$text bold="true">oo</$text>bar
			//
			// In the first example, a new letter 'b' (without attributes) is added. It's not like the first
			// 'b' had its attribute changed (bold removed) and then we inserted 'b' with bold.
			//
			// In the second example, 'oo' had its attributes changed (bold added). It's different than removing
			// non-bold 'oo' and adding bold 'oo'. Especially when whole paragraphs are being bold
			//
			// We need to differentiate between those and similar situations. Here comes additional post-processing of the diff.
			findAttributeChangeOnCharacters( snapshotChildren, elementChildren, actions );

			let i = 0; // Iterator in `elementChildren` array -- iterates through current children of element.
			let j = 0; // Iterator in `snapshotChildren` array -- iterates through old children of element.

			// Process every action in the diff.
			for ( const action of actions ) {
				if ( action === 'insert' ) {
					if ( elementChildren[ i ] instanceof Element ) {
						// New element got inserted. We should not buffer the same change twice.
						// If that element's children has changed -- remove that from the buffer.
						this._changedElements.delete( elementChildren[ i ] );
						// If that element has changed -- remove that change the buffer.
						this._changedChildren.delete( elementChildren[ i ] );
					}

					// Generate diff item for this element and insert it into the diff set.
					diffSet.push( this._getInsertDiff( element, i, elementChildren[ i ].name || '$text' ) );

					i++;
				} else if ( action === 'delete' ) {
					if ( snapshotChildren[ j ] instanceof Element ) {
						// An element got removed. We should not buffer other changes connected with it.
						// If that element's children has changed -- remove that from the buffer.
						this._changedElements.delete( snapshotChildren[ j ] );
						// If that element has changed -- remove that from the buffer.
						this._changedChildren.delete( snapshotChildren[ j ] );
					}

					// Generate diff item for this element and insert it into the diff set.
					diffSet.push( this._getRemoveDiff( element, i, snapshotChildren[ j ].name || '$text' ) );

					j++;
				} else if ( action == 'charAttr' ) {
					// A character had its attribute changed.
					const range = Range.createFromParentsAndOffsets( element, i, element, i + 1 );

					// Generate diff items (one for each attribute) for this character and insert them into the diff set.
					diffSet.push( ...this._getAttributesDiff( range, snapshotChildren[ j ].attributes, elementChildren[ i ].attributes ) );

					i++;
					j++;
				} else {
					// `action` is 'equal'. Child not changed.
					i++;
					j++;
				}
			}
		}

		// After changes in child nodes are handled, process elements that changed.
		for ( const [ element, snapshot ] of this._changedElements ) {
			if ( element.name == snapshot.name ) {
				// Name is the same, so only attributes of that element changed.
				const range = Range.createFromParentsAndOffsets( element.parent, element.startOffset, element, 0 );

				// Generate diff items (one for each attribute) for this element and insert them into the diff set.
				diffSet.push( ...this._getAttributesDiff( range, snapshot.attributes, element.getAttributes() ) );
			} else {
				// Element name has changed. Since this requires removing old element and inserting new element,
				// we don't care about attributes. If those have changed, they will be refreshed with the newly inserted element.
				// Generate diff items for element "refreshing".
				diffSet.push( this._getRemoveDiff( element.parent, element.startOffset, snapshot.name ) );
				diffSet.push( this._getInsertDiff( element.parent, element.startOffset, element.name ) );
			}
		}

		// At this point, all buffered changes has been processed and the diff set is calculated. Now, it will be further processed.
		// First, remove all changes that are included in other changes.
		for ( let i = 0; i < diffSet.length; i++ ) {
			for ( let j = 0; j < diffSet.length; j++ ) {
				if ( i !== j ) {

					if ( diffItemIncludes( diffSet[ i ], diffSet[ j ] ) ) {
						diffSet.splice( j, 1 );
						j--;
						break;
					}
				}
			}
		}

		// Then, sort the changes by the position (change at position before other changes is first).
		diffSet.sort( ( a, b ) => {
			// If the change is in different root, we don't care much, but we'd like to have all changes in given
			// root "together" in the array. So let's just sort them by the root name. It does not matter which root
			// will be processed first.
			if ( a.position.root != b.position.root ) {
				return a.position.root.rootName < b.position.root.rootName ? -1 : 1;
			}

			// If change happens at the same position...
			if ( a.position.isEqual( b.position ) ) {
				// Keep chronological order of operations.
				return a.changeCount < b.changeCount ? -1 : 1;
			}

			// If positions differ, position "on the left" should be earlier in the result.
			return a.position.isBefore( b.position ) ? -1 : 1;
		} );

		// Glue together multiple changes (mostly on text nodes).
		for ( let i = 1; i < diffSet.length; i++ ) {
			const prevDiff = diffSet[ i - 1 ];
			const thisDiff = diffSet [ i ];

			// Glue remove changes if they happen on text on same position.
			const isConsecutiveTextRemove =
				prevDiff.type == 'remove' && thisDiff.type == 'remove' &&
				prevDiff.name == '$text' && thisDiff.name == '$text' &&
				prevDiff.position.isEqual( thisDiff.position );

			// Glue insert changes if they happen on text on consecutive fragments.
			const isConsecutiveTextAdd =
				prevDiff.type == 'insert' && thisDiff.type == 'insert' &&
				prevDiff.name == '$text' && thisDiff.name == '$text' &&
				prevDiff.position.parent == thisDiff.position.parent &&
				prevDiff.position.offset + prevDiff.length == thisDiff.position.offset;

			// Glue attribute changes if they happen on consecutive fragments and have same key, old value and new value.
			const isConsecutiveAttributeChange =
				prevDiff.type == 'attribute' && thisDiff.type == 'attribute' &&
				prevDiff.position.parent == thisDiff.position.parent &&
				prevDiff.range.isFlat && thisDiff.range.isFlat &&
				prevDiff.position.offset + prevDiff.length == thisDiff.position.offset &&
				prevDiff.attributeKey == thisDiff.attributeKey &&
				prevDiff.attributeOldValue == thisDiff.attributeOldValue &&
				prevDiff.attributeNewValue == thisDiff.attributeNewValue;

			if ( isConsecutiveTextRemove || isConsecutiveTextAdd || isConsecutiveAttributeChange ) {
				diffSet[ i - 1 ].length++;

				if ( isConsecutiveAttributeChange ) {
					diffSet[ i - 1 ].range.end = diffSet[ i - 1 ].range.end.getShiftedBy( 1 );
				}

				diffSet.splice( i, 1 );
				i--;
			}
		}

		// Remove `changeCount` property from diff items. It is used only for sorting and is internal thing.
		for ( const item of diffSet ) {
			delete item.changeCount;
		}

		return diffSet;
	}

	/**
	 * Resets `Differ`. Removes all buffered changes.
	 */
	reset() {
		this._changedChildren.clear();
		this._changedElements.clear();
		this._changedMarkers.clear();
		this._changeCount = 0;
	}

	/**
	 * Marks that child list of given `element` has changed - element received or lost a child node.
	 *
	 * @private
	 * @param {module:engine/model/element~Element} element Element which changed.
	 */
	_markChildrenChange( element ) {
		if ( !this._changedChildren.has( element ) ) {
			this._changedChildren.set( element, getChildrenWithSingleCharacters( element.getChildren() ) );
		}
	}

	/**
	 * Marks that given `element` has changed - its name or one or more attributes.
	 *
	 * @private
	 * @param {module:engine/model/element~Element} element Element which changed.
	 */
	_markElementChange( element ) {
		if ( !this._changedElements.has( element ) ) {
			this._changedElements.set( element, { name: element.name, attributes: [ ...element.getAttributes() ] } );
		}
	}

	/**
	 * Returns an object with a single insert change description.
	 *
	 * @private
	 * @param {module:engine/model/element~Element} parent Element in which change happened.
	 * @param {Number} offset Offset at which change happened.
	 * @param {String} name Removed element name or `'$text'` for character.
	 * @returns {Object} Diff item.
	 */
	_getInsertDiff( parent, offset, name ) {
		return {
			type: 'insert',
			position: Position.createFromParentAndOffset( parent, offset ),
			name,
			length: 1,
			changeCount: this._changeCount++
		};
	}

	/**
	 * Returns an object with a single remove change description.
	 *
	 * @private
	 * @param {module:engine/model/element~Element} parent Element in which change happened.
	 * @param {Number} offset Offset at which change happened.
	 * @param {String} name Removed element name or `'$text'` for character.
	 * @returns {Object} Diff item.
	 */
	_getRemoveDiff( parent, offset, name ) {
		return {
			type: 'remove',
			position: Position.createFromParentAndOffset( parent, offset ),
			name,
			length: 1,
			changeCount: this._changeCount++
		};
	}

	/**
	 * Returns an array of objects that each is a single attribute change description.
	 *
	 * @private
	 * @param {module:engine/model/range~Range} range Range on which change happened.
	 * @param {Map} oldAttributes Map, map iterator or compatible object that contains attributes before change.
	 * @param {Map} newAttributes Map, map iterator or compatible object that contains attributes after change.
	 * @returns {Array.<Object>} Array containing one or more diff items.
	 */
	_getAttributesDiff( range, oldAttributes, newAttributes ) {
		// Results holder.
		const diffs = [];

		// Clone new attributes as we will be performing changes on this object.
		newAttributes = new Map( newAttributes );

		// Look through old attributes.
		for ( const [ key, oldValue ] of oldAttributes ) {
			// Check what is the new value of the attribute (or if it was removed).
			const newValue = newAttributes.has( key ) ? newAttributes.get( key ) : null;

			// If values are different (or attribute was removed)...
			if ( newValue !== oldValue ) {
				// Add diff item.
				diffs.push( {
					type: 'attribute',
					position: range.start,
					range,
					length: 1,
					attributeKey: key,
					attributeOldValue: oldValue,
					attributeNewValue: newValue,
					changeCount: this._changeCount++
				} );

				// Prevent returning two diff items for the same change.
				newAttributes.delete( key );
			}
		}

		// Look through new attributes that weren't handled above.
		for ( const [ key, newValue ] of newAttributes ) {
			// Each of them is a new attribute. Add diff item.
			diffs.push( {
				type: 'attribute',
				position: range.start,
				range,
				length: 1,
				attributeKey: key,
				attributeOldValue: null,
				attributeNewValue: newValue,
				changeCount: this._changeCount++
			} );
		}

		return diffs;
	}

	/**
	 * Checks whether given {@link module:engine/model/element~Element element} had its name changed.
	 *
	 * @private
	 * @param {module:engine/model/element~Element} element Element to check.
	 * @returns {Boolean}
	 */
	_hasChangedName( element ) {
		const snapshot = this._changedElements.get( element );

		return snapshot && snapshot.name !== element.name;
	}
}

// Checks whether diff item `b` describes a change inside an element that is changed in diff item `a`.
// Simply saying checks if diff item `a` includes diff item `b`.
// If items have same parent, check returns `false` no matter if the diff items are intersecting.
function diffItemIncludes( a, b ) {
	const aRange = a.range ? a.range : Range.createFromPositionAndShift( a.position, a.length );
	const bRange = b.range ? b.range : Range.createFromPositionAndShift( b.position, b.length );

	return aRange.start.parent !== bRange.start.parent && aRange.containsRange( bRange );
}

// Returns an array that is a copy of passed child list with the exception that text nodes are split to one or more
// objects, each representing one character and attributes set on that character.
function getChildrenWithSingleCharacters( children ) {
	children = Array.from( children );

	for ( let i = 0; i < children.length; i++ ) {
		if ( children[ i ].is( 'text' ) ) {
			const chars = [];
			const attributes = Array.from( children[ i ].getAttributes() );

			for ( const char of children[ i ].data ) {
				chars.push( { char, attributes } );
			}

			children.splice( i, 1, ...chars );
			i += chars.length - 1;
		}
	}

	return children;
}

// Used as a comparator in `diff` function. Works in two modes. If `diffWithCharAttributes` is set to `true`, character
// objects are compared also using their attributes. If set to `false`, characters are compared without looking at their attributes.
// Elements are always compared directly.
function diffChildren( diffWithCharAttributes ) {
	return ( snapshotChild, elementChild ) => {
		if ( snapshotChild instanceof Element && elementChild instanceof Element ) {
			return snapshotChild == elementChild;
		} else if ( !( snapshotChild instanceof Element ) && !( elementChild instanceof Element ) ) {
			return snapshotChild.char == elementChild.char &&
				( !diffWithCharAttributes || !differentAttributes( snapshotChild.attributes, elementChild.attributes ) );
		}

		return false;
	}
}

// Checks whether two attributes sets are equal.
function differentAttributes( elementAttributes, snapshotAttributes ) {
	// If sets have different size, they are not equal for sure.
	if ( elementAttributes.length != snapshotAttributes.length ) {
		return true;
	}

	for ( const [ newKey, newValue ] of elementAttributes ) {
		let found = false;

		for ( const [ oldKey, oldValue ] of snapshotAttributes ) {
			if ( newKey == oldKey ) {
				if ( newValue != oldValue ) {
					// If attribute value is different, sets are different.
					return true;
				} else {
					found = true;
					break;
				}
			}
		}

		// If `newKey` has not been found in `snapshotAttributes` it means that it is a new attribute, so sets are different.
		if ( !found ) {
			return true;
		}
	}

	return false;
}

// Performs post processing of the result obtained from `diff` function. In first step, element's old and new children
// are compared with attributes. This is way we get exact `diff` result when a character is inserted or deleted. However
// we get a bit wrong results when a character just changed an attribute. For example given change:
//
// Foobar -> F<$text bold="true">oo</$text>bar
//
// Will be represented as 2 x "insert new o with bold" + 2 x "delete old o". Which is not welcome, especially when multiple
// paragraphs are changed.
//
// This method analyzes `diff` result again, to find such situations, and change "insert+delete chains" to character
// attribute changes.
//
// Let's take more complicated example:
//
// Foo<$text bold="true">bar</$text> -> F<$text bold="true">oo</$text>b<$text bold="true">bar</$text>
//
// In this example two actions happened to the text node:
// 1. "oo" had bold applied,
// 2. "b" without bold was inserted.
//
// Diff with attributes would return:		equal	insert	insert	insert	delete	delete	equal	equal	equal
//
// Looking at diff, old and new text nodes, we can see that F and <$text bold="true">bar</$text> stayed the same. This is marked by
// multiple "equal"s. We are not interested in those parts of the text nodes and diff. The real difference is in the middle:
//
// Old:			o (no bold)		o (no bold)
// New:			o (with bold)	o (with bold)	b (no bold)
//
// It's plain to see what and how changed here.
//
// To get that exact diff, we will compare only the different parts (as extracted in the example above) and we will
// compare without looking at attributes. If diff says "equal" it means that the character got its attribute changed.
// Otherwise, a character really got inserted/deleted.
//
// Old:			o				o
// New:			o				o				b
// Diff:		equal			equal			insert
// Result:		change attr		change attr		insert
//
// Finally, the scripts substitutes an "insert+delete chain" with the result obtained in the second diff (as shown above).
function findAttributeChangeOnCharacters( oldChildren, newChildren, actions ) {
	let lastAction = null; // What was last visited action. Needed to discover end of "insert+delete chain".

	let j = 0; // `oldChildren` iterator.
	let k = 0; // `newChildren` iterator.

	// Index in `actions` when an "insert+delete chain" started.
	// Needed to know which part of `actions` should be substituted.
	let iStart = null;

	// Index in `oldChildren` when an "insert+delete chain" started.
	// Needed to know which part of `oldChildren` should be compared with `newChildren` part.
	let jStart = null;

	// Index in `newChildren`, as above.
	let kStart = null;

	// Scan through all actions, looking for "insert+delete chain".
	for ( let i = 0; i < actions.length; i++ ) {
		switch ( actions[ i ] ) {
			case 'insert':
				// If the action is inserted and we did not already marked the start of "insert+delete chain", mark it.
				if ( iStart === null ) {
					iStart = i;
					jStart = j;
					kStart = k;
				}

				k++;

				break;
			case 'delete':
				// If the actions is delete, just continue forward, as long as "equal" is not met. Note, that after
				// "delete" there will never be "insert". If it was, it would be before a chain of "delete"s.
				j++;

				// If this is not the last action, then just continue.
				// But if this is the last action, pass through, so the 'delete' will be treated like it is 'equal'.
				// This handles situation where "insert+delete chain" is at the end of actions.
				if ( i < actions.length - 1 ) {
					break;
				} else {
					// This is to simulate one step through actions.
					lastAction = actions[ i ];
					i++;
				}
			case 'equal':
				// If the actions is "equal", we check if we found "insert+delete chain". If last action was "delete"
				// and we marked "insert" action in the past, we have the chain.
				if ( lastAction == 'delete' && iStart !== null ) {
					// Extract "the interesting" part of `oldChildren` and `newChildren`.
					const oldChildrenPart = oldChildren.slice( jStart, j );
					const newChildrenPart = newChildren.slice( kStart, k );

					// Compare them and replace "equal" with "charAttr" to differentiate it from "elements are equal".
					let newActions = diff( oldChildrenPart, newChildrenPart, diffChildren( false ) );
					newActions = newActions.map( action => action == 'equal' ? 'charAttr' : action );

					// Replace old actions with new ones.
					const howMany = i - iStart;
					actions.splice( iStart, howMany, ...newActions );

					// Fix `i` iterator.
					const lengthDiff = howMany - newActions.length;
					i = i - lengthDiff;
				}

				// Reset "insert" start mark.
				iStart = null;
				j++;
				k++;

				break;
		}

		// Remember last action.
		lastAction = actions[ i ];
	}
}