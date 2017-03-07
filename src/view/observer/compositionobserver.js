/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/view/observer/compositionobserver
 */

import DomEventObserver from './domeventobserver';

/**
 * {@link module:engine/view/document~Document#event:compositionstart Compositionstart},
 * {@link module:engine/view/document~Document#event:compositionupdate compositionupdate} and
 * {@link module:engine/view/document~Document#event:compositionend compositionend} events observer.
 *
 * Note that this observer is attached by the {@link module:engine/view/document~Document} and is available by default.
 *
 * @extends module:engine/view/observer/domeventobserver~DomEventObserver
 */
export default class CompositionObserver extends DomEventObserver {
	constructor( document ) {
		super( document );

		this.domEventType = [ 'compositionstart', 'compositionupdate', 'compositionend' ];

		document.on( 'compositionstart', () => {
			document.isComposing = true;
		} );

		document.on( 'compositionend', () => {
			document.isComposing = false;

			// Re-render the document to update view elements.
			document.render();
		} );
	}

	onDomEvent( domEvent ) {
		this.fire( domEvent.type, domEvent );
	}
}

/**
 * Fired when composition starts inside one of the editables.
 *
 * Introduced by {@link module:engine/view/observer/compositionobserver~CompositionObserver}.
 *
 * Note that because {@link module:engine/view/observer/compositionobserver~CompositionObserver} is attached by the
 * {@link module:engine/view/document~Document}
 * this event is available by default.
 *
 * @see module:engine/view/observer/compositionobserver~CompositionObserver
 * @event module:engine/view/document~Document#event:compositionstart
 * @param {module:engine/view/observer/domeventdata~DomEventData} data Event data.
 */

/**
 * Fired when composition is updated inside one of the editables.
 *
 * Introduced by {@link module:engine/view/observer/compositionobserver~CompositionObserver}.
 *
 * Note that because {@link module:engine/view/observer/compositionobserver~CompositionObserver} is attached by the
 * {@link module:engine/view/document~Document}
 * this event is available by default.
 *
 * @see module:engine/view/observer/compositionobserver~CompositionObserver
 * @event module:engine/view/document~Document#event:compositionupdate
 * @param {module:engine/view/observer/domeventdata~DomEventData} data Event data.
 */

/**
 * Fired when composition ends inside one of the editables.
 *
 * Introduced by {@link module:engine/view/observer/compositionobserver~CompositionObserver}.
 *
 * Note that because {@link module:engine/view/observer/compositionobserver~CompositionObserver} is attached by the
 * {@link module:engine/view/document~Document}
 * this event is available by default.
 *
 * @see module:engine/view/observer/compositionobserver~CompositionObserver
 * @event module:engine/view/document~Document#event:compositionend
 * @param {module:engine/view/observer/domeventdata~DomEventData} data Event data.
 */
