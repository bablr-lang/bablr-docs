---
title: '@bablr/agast-vm'
---

The agAST VM is the canonical definition of what is valid agAST. It defines a two closely related data structures: a stream and a tree format for storing syntax trees.

Because agAST tree nodes are immutable this VM is the best way to construct them, which is done by feeding the VM a tag stream.

Each tag in the stream acts like a description of a transition that alters the state of the VM.

## Usage

```js
import { agast } from '@bablr/agast-vm';
import * as b from '@bablr/agast-helpers/builders';

let vm = agast();
let lang = 'https://example';
let step;

let openTag = b.buildOpenNodeTag(
  b.tokenFlags,
  lang,
  'Token',
);
let closeTag = b.buildLiteralTag('OK');
let closeTag = b.buildCloseNodeTag();

step = vm.next(openTag);
step = vm.next(literalTag);
step = vm.next(closeTag);

let node = step.value;
```

## Tags

The following CSTML tag types are supported by `agast-vm`. Most but not all of them have `Tag` in their name, but for lack of a better term we call them all tags. Tag streams contain all the same information as tree-ified documents.

**`DoctypeTag`**: A doctype tag begins a new CSTML document. `agast-vm` supports constructing both complete documents and individual nodes. A document consists of 0 or 1 nodes and any adjacent trivia. This arrangement ensures we are able to store documents whose only contents are trivia.

```js
const buildDoctypeTag = (
  attributes = Object.freeze({}),
) => {
  return Object.freeze({
    type: Symbol.for('DoctypeTag'),
    value: Object.freeze({
      doctype: 'cstml',
      version: 0,
      attributes,
    }),
  });
};
```

**`OpenNodeTag`**: Regular CSTML nodes begin with an open node tag. Each open tag must be balanced by a matching close tag. When `tag.value.lanuage` is null an open node tag should be considered to open a fragment node and must be preceded by a doctype tag. You can access a facacde over the partially-constructed node as `vm.next(openTag).value`

```js
const buildOpenNodeTag = (
  flags = Object.freeze({ token: false, hasGap: false }),
  language = null,
  type = null,
  attributes = Object.freeze({}),
) => {
  return Object.freeze({
    type: Symbol.for('OpenNodeTag'),
    value: Object.freeze({
      flags: Object.freeze(flags),
      language,
      type: isString(type) ? Symbol.for(type) : type,
      attributes,
    }),
  });
};
```

**`CloseNodeTag`**: Each close tag matches and cancels out an open tag. The tags between the open tag and its matching close are the contents of the node. `vm.next(closeTag).value` is a node facade which has been made transparent, which is to say the real fully-constructed immtuable node is available as `vm.next(closeTag).value.node`.

```js
const buildCloseNodeTag = () => {
  return Object.freeze({
    type: Symbol.for('CloseNodeTag'),
    value: undefined,
  });
};
```

**`ReferenceTag`**: A reference tag defines a name for a property of a node. It also defines information about the releationship which is not essential to the indentity of the related node. A reference tag must be followed by an `OpenNodeTag`, a `NullTag`, a `GapTag` or an `InitializerTag`.

```js
const buildReferenceTag = (
  type = null,
  name = null,
  flags = Object.freeze({
    array: false,
    expression: false,
    intrinsic: false,
    hasGap: false,
  }),
) => {
  return Object.freeze({
    type: Symbol.for('ReferenceTag'),
    value: Object.freeze({
      type,
      name,
      flags,
    }),
  });
};
```

**`NullTag`**: A null tag indicates that the preceding reference is definitively resolved to point to nothing.

```js
const buildNullTag = () => {
  return Object.freeze({
    type: Symbol.for('NullTag'),
    value: undefined,
  });
};
```

**`GapTag`**: A gap tag indicates that the value which the preceding reference should resolve to is not currently availble. Gap tags manifest as holes in the content of a tree -- like sockets that trees and nulls can both plug into.

```js
const buildGapTag = () => {
  return Object.freeze({
    type: Symbol.for('GapTag'),
    value: undefined,
  });
};
```

**`LiteralTag`**: A literal tag contains a piece of the source text of the embedded in the document. The complete source text of the original document may always be recovered by appending the content of the document's literal tags.

```js
const buildLiteralTag = (value) => {
  return Object.freeze({
    type: Symbol.for('LiteralTag'),
    value,
  });
};
```

**`AttributeDefinition`**: An attribute definition amends its most immediate containing node's open tag by defining assigning the specified `value` to an attribute which was previously `undefined`.

```js
const buildAttributeDefinitionTag = (path, value) => {
  return Object.freeze({
    type: Symbol.for('AttributeDefinition'),
    value: Object.freeze({ path, value }),
  });
};
```

**`ShiftTag`**: A shift tag immediately follows a `CloseNodeTag` and causes the just-finished node to be detached from its reference and "held". While a node is being held, most other state transitions are disabled. The usual way to clear the hold is to advance an `OpenNodeTag` followed by a `ReferenceTag` followed by a `GapTag`. The gap will be filled with the held node with the end result that the held node has moved deeper into the parse tree than it was when the node was originally recognized

```js
const buildShiftTag = (index) => {
  return Object.freeze({
    type: Symbol.for('ShiftTag'),
    value: Object.freeze({ index }),
  });
};
```
