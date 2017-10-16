/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Contains {@link module:engine/view/selection~Selection view selection}
 * to {@link module:engine/model/selection~Selection model selection} conversion helpers.
 *
 * @module engine/conversion/view-selection-to-model-converters
 */

import ModelSelection from '../model/selection';
import ModelRange from '../model/range';

/**
 * Function factory, creates a callback function which converts a {@link module:engine/view/selection~Selection view selection} taken
 * from the {@link module:engine/view/document~Document#event:selectionChange} event
 * and sets in on the {@link module:engine/model/document~Document#selection model}.
 *
 * **Note**: because there is no view selection change dispatcher nor any other advanced view selection to model
 * conversion mechanism, the callback should be set directly on view document.
 *
 *		view.document.on( 'selectionChange', convertSelectionChange( modelDocument, mapper ) );
 *
 * @param {module:engine/model/document~Document} modelDocument Model document on which selection should be updated.
 * @param {module:engine/conversion/mapper~Mapper} mapper Conversion mapper.
 * @returns {Function} {@link module:engine/view/document~Document#event:selectionChange} callback function.
 */
export function convertSelectionChange( modelDocument, mapper ) {
	return ( evt, data ) => {
		const viewSelection = data.newSelection;
		const modelSelection = new ModelSelection();

		const ranges = [];

		for ( const viewRange of viewSelection.getRanges() ) {
			// Get a range from view selection and map it to model.
			const mappedRange = mapper.toModelRange( viewRange );

			// Check if model range mapped from view is correct.
			// To do so, find nearest selection range near start and end of mapped model range.
			//
			// Note, that if `mappedRange.start` or `mappedRange.end` are in correct position,
			// a collapsed range at those position will be returned.
			//
			// Example #1 - correct collapsed selection in the middle of text:
			// <paragraph>Fo[]obar</paragraph> -> <paragraph>Fo{}[]obar</paragraph> -> <paragraph>Fo{]obar</paragraph>
			//
			// Example #2 - incorrect non-collapsed range:
			// [<paragraph>Foobar</paragraph>] -> <paragraph>[]Foobar{}</paragraph> -> <paragraph>[Foobar}</paragraph>
			//
			// Example #3 - incorrect collapsed range near widget:
			// <paragraph>Foo</paragraph><widget />[] -> <paragraph>Foo</paragraph>{[<widget />]} -> <paragraph>Foo</paragraph>[<widget />}
			const correctModelRangeStart = modelDocument.getNearestSelectionRange( mappedRange.start );
			const correctModelRangeEnd = modelDocument.getNearestSelectionRange( mappedRange.end );

			// If there is no correct position for mapped range, skip it.
			// Both `correctModelRangeStart` and `correctModelRangeEnd` are checked, although it seems that if
			// one is `null` (incorrect) the other always should be `null` too. But to be safe, both are checked.
			if ( !correctModelRangeStart || !correctModelRangeEnd ) {
				continue;
			}

			ranges.push( new ModelRange( correctModelRangeStart.start, correctModelRangeEnd.end ) );
		}

		modelSelection.setRanges( ranges, viewSelection.isBackward );

		if ( !modelSelection.isEqual( modelDocument.selection ) ) {
			modelDocument.enqueueChanges( () => {
				modelDocument.selection.setTo( modelSelection );
			} );
		}
	};
}
