---
title: CSTML
---

CSTML is a purpose-built serialization format for syntax trees. As a language it takes inspiration from XML, HTML, JSON, and SrcML, but learns from each.

Here are some of the features that we felt were the best parts of each of these languages that we wanted to be sure to preserve:

Inspired by HTML and SrcML, we chose for CSTML documents to have "inner text". This means that like HTML most of the time you won't see the CSTML syntax, but rather what you'll see the document presented as its contents. This is also normal behavior for parse trees.

Drawing from XML's design, we made the language as decoupled from a particular domain as we could make it. This format could as easily be used for legal documents as it could be for code files.

Parts of JSON we felt were requirements to incorporate into CSTML were its simple (static) system of escaping, its identifier quoting, and its actual syntax, a superset of which is used for CSTML's attributes.

On the other hand we already knew there were things about each inspirational language that we knew wouldn't work for us, which is another reason we didn't choose to use any of these languages directly. Here are a few of the the key pain points we wanted to be sure we didn't accidentally bring over into CSTML:

- HTML complicated handling of whitespace.
- HTML's tight coupling between syntax and semantics, such as specific element types which lack close tags.
- XML's hard-to-use namespaces which always require a lookup table.
- SrcML's insistence that there are a finite number of languages that can be centrally defined.
- SrcML's lack of whitespace usable for document formatting
- JSON's omission of +-Infinity and NaN as valid values

Lastly we had a few special requirements of our own:

We needed the format to have named relationships between nodes. HTML and XML both implicitly assume that relationship nodes have to other nodes is `children`. Parse trees use many different names for their relationships between a node and its children, so we wanted a format that made that easy to read and write.

We needed the format to support embedding gaps, which is to say documents which are known to be missing a portion of themselves. In code, such documents are commonly called templates. This feature makes it easy to build up documents by snapping together syntax nodes like lego bricks. For parse trees this is critical to be able to distinguish between otherwise-identical syntaxes, for example Javascript's `//` meaning "start line comment" and `//` being as close as you can get to writing "the empty regex". If we let the interpunct symbol · represent a gap, now we are able to distinguish the two similar cases. The line comment is `//` and the empty regex is `/·/`. In this case `·` is an example of a syntactic gap. An embedding gap represents the same concept, but without needing or having a specific syntax. This makes CSTML a kind of universal templating language.

We wanted a language optimized for machine-produced-and-consumed documents instead of hand-written ones. Most of the time in real usages we expect these documents to be returned from a parser, relieving the author of the difficulties of constructing a syntax by hand. For example this is the reason we opted for `</>` as the close node tag instead of `</Type>`. Repeating the type in the closing tag is a useful way to help people hand-writing the document who may otherwise become confused about exactly which close tags match with which open tags, but it makes the format more complicated for machines to consume. It adds needless bytes for one thing, but the bigger issue is the attendant complexity. Should the format be loose or strict about name mismatches in tag pairs, for example? For formats designed to facilitate interoperability this kind of thing is critical to be consistent about (and make it easy for implementers to get right) so as not to accidentally create subcultures of compatibility.

