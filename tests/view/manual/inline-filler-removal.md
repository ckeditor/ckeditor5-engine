# Inline filler removal

Check whether inline filler is properly removed when typing inside empty inline elements.

By default inline filler should be removed when anything is typed inside empty inline element.

You may alter this behaviour by clicking **Toggle inline filler removal** (this emulates composition) which
will result in inline filler not being removed while typing inside empty inline element. Click again to restore
default behaviour - filler from non empty element should be removed on focus/typing.

**Notice:** Keep in mind that clicking somewhere inside editor will automatically end composition. So the case when
filler removal is blocked and caret is placed in different nodes is not reproducible during normal usage
(here it results in spanning inline fillers in focused nodes).
