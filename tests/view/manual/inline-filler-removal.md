# Inline filler removal

Check whether inline filler is properly removed when typing inside empty inline elements:

* By default inline filler should be removed when anything is typed inside empty inline element.
* During composition, inline filler should not be removed until composition ends.

You may emulate composition by clicking **Toggle composition** or use e.g. Spanish or Japanese keyboard
(the composition state is logged in the browser dev console).

**Notice:** While emulating composition (or if you are able to create situation in which `compositionend` is not fired properly),
inline filler should behave as described above in the inline elements, but should not be inserted in other non-empty elements.
Also there should by always maximum one inline filler in the whole content.
