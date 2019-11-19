/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module engine/utils/removeprefix
 */

/**
 * A helper function that removes a given `prefix` from the beginning of the `inputString`.
 *
 * If prefix is missing, the `inputString` is returned unchanged.
 *
 * @param {String} inputString
 * @param {String} prefix
 * @returns {String}
 */
export default function removePrefix( inputString, prefix ) {
	if ( inputString.startsWith( prefix ) ) {
		return inputString.substr( prefix.length );
	}

	return inputString;
}
