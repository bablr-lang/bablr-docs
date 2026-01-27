---
title: Prior art
---

These are many, many pieces of software that inspired BABLR's design, most of them labors of love in their own right. Without these projects to guide the way, it would not have been possible to conceive of BABLR's design.

I, Conrad, am writing this page, and the opinions expressed here are my own. I have a great deal of respect for the people who have made these things, and yet it will likely be obvious to you from the fact of my having chosen to compete with their technologies that I have critical views about how these products should be built.

Before we get to any of that though, there's one person, one person who above all others deserves recognition for their contribution to making this project a dream before it could become a reality, and that person is Gary Bernhardt. If you haven't watched it and have twenty minutes to spare, watch this talk! [https://www.destroyallsoftware.com/talks/a-whole-new-world](https://www.destroyallsoftware.com/talks/a-whole-new-world)

## Serialization

CSTML as a language has its own significant prior art, which [you can read about here](https://docs.bablr.org/architecture/cstml).

- **SrcML:** SrcML is the only plausible competitor for a standardized code serialization format, and a direct inspiration to an XML-like syntax for CSTML. SrcML documents can't be pretty-printed and so are visually quite difficult to read when used with real code. Blurs the concept of "what is this" (identity) and "what is this to me" (reference). No embedding gaps.

## Parsers

- **ANTLR:** With inspiringly maniacal energy, ANTLR sets the gold standard for well-supported parser generator frameworks, integrating with nearly everything it can touch. Unlike ANTLR, BABLR is not a parser generator. It requires no build step to function, just plain function calling, giving BABLR theoretical roots that stretch all the way down to lambda calculus.

- **Tree-Sitter:** The current go-to parser system for modern IDEs, Tree-sitter is also a parser generator. Like ANTLR it supports many host languages and many target languages. Tree-sitter's system of structural queries is a primary inspiration to BABLR's system. In general Tree-sitter is BABLR's closest competitor, yet its ambition is decidedly lesser. Tree-sitter parsers are known to be difficult to debug and understand and the parser author is oftern forced to drop down into C code to write complex custom lexers, but that said its biggest weakness is that it presumes the existence of a textual source of truth external to its tracked state.

- **Parsec:** Often referred to as the state of the art in parser combinator libraries, Parsec, like BABLR, is just function calling under the hood. While Parsec's native language Haskell is still largely an academic language, Parsec's approach to parsing has exploded beyond the boundaries of the Haskell community, spawning clones and derivatives in a great variety of programming languages, including several in JS alone.

## IDEs

- **Atom/Pulsar:** The O.G. "hackable" web-tech IDE, the now-popular Electron framework was built for the purpose of being able to make this editor using a browser engine at its core for hackability while packaging the browser engine and app together for release to a variety of native platforms. Atom set the standard for later editors, but inherited a great deal of debts from being the earliest adopter of its architectural patterns. Its biggest difficulty, ongoing, is that it keeps its editor state in C++ code while most of the other code that needs to interact with that state is Javascript. Going back and forth between C++ code and JS code is like driving back and forth over a long bridge between two different islands. It's sometimes worth it, but if it's a long bridge and you need to go back and forth for little things all the time then at some point most of your time will be spent on the bridge.

- **VSCode:** VSCode is the current market force to be reckoned with. Among its greatest assets: it runs natively in a web browser. Where Atom required a web browser specially fused to a node runtime, VSCode was possibly the first full-featured IDE that worked normally when used in a web page. It offered much of Atom's hackability, growing an impressive number of plugins in its registry. It too is showing signs of outgrowing its design, though. Most places where the VSCode user experience falls short are not bugs, necessarily, so much as failures to have a complete, unified architectural theory of user experience. That is to say, there are many structural flaws in its UX design for which no engineer within Microsoft (or without) has ever taken or been given adequate political cover to take on.

- **Zed:** Founded by Atom's dev team, Zed was the rewrite that Atom always wanted to be able to do but couldn't when Microsoft bought Github and made the executive decision to kill a product it might otherwise have had to compete with. Unfortunately Zed decided to do that rewrite in Rust. This has slowed their iteration speed, caused much of their dev effort to go to cross-platform support instead of innovation, cut them off from being able to offer their experience on the web, severely limited their hackability, and generally made theirs a niche tool for enthusiasts. What's worse, their reliance on LSP -- a product which believes that the _presentation layer_ should be the primary abstraction layer -- means their product is forever doomed to look like a VSCode knock-off.

- **Cursor:** Damn, 3 billion, really?

## Javascript Tooling

- **Babel:** Babel was the first hugely successful Javascript tool for code transformation. It made compiler-focused tradeoffs, discarding whitespace and comments. In return it gave you direct control of the program's semantic structure as encoded into syntax tree nodes expressed as Javascript objects. At the end of the transformation work a printer reconstructs a textual representation for the program from the semantic model. Babel was the most direct inspiration for BABLR, both in name and in technology. BABLR primarily seeks to expand on Babel in two ways: by making it usable to transform any language instead of just Javascript, and by reimagining the system without a printer, which is to say having transformations be defined not in terms of AST nodes but in terms of CST nodes.

- **ESLint** BABLR has a bit of a history with ESLint over its application of the not-invented-here critique to our work. Sorry Nicholas C. Zakas, but it's happening with or without ya. The conflict stems from the fact that ESLint is the current Javascript tool with a mission statement most similar to BABLR's, and should be one of our closest allies, having gone so far out on a limb as to express interest in a ground-up rewrite of their technology to prepare themselves for the next 10 years. Unfortunately they decided to follow waterfall principles instead of agile ones. This and their insistence that the most core parts of their architecture are beyond reconsideration has led to seemingly-irrevocable differences between the two projects. BABLR continues to have a significantly more ambitious vision of what is possible to achieve in the next generation of developer tools.

- **Biome** Biome is the continuation of work of the Rome project, where Rome was the original Babel author's attempt to design create an ecosystem in which critical infrastructure could be shared by the linter, the pretty-printer, the transpiler, and more. Like BABLR, Biome is built on top of the Concrete Syntax Tree or CST data structure. Unfortunately as another Rust project Biome has very limited runtime extensibility -- most of its linting functionality is baked directly into its core, kind of like a situation where you'd have to ship a whole new web browser to make a change to a website. It's highly convenient if you want to do exactly what the tool authors hoped you would want to do with it, and its usefulness drops to near-zero if that's not the case. BABLR employs the dogfood rule, making an earnest attempt to always implement the things we want through our own public API layer, so that if we are able to create the things we want we can be reasonably sure that other people will be able to create thing things they want, even and especially when what they want is different.

- **VoidZero** This newest funded devtools startup brings together several existing Rust projects, particularly Vite, Rolldown, and Oxc. The company has been quiet after their launch announcement, but their individual projects are active and well-placed in the market. We know that this young ecosystem does contain some architectural tech debt inherited from ESLint, but in general we are waiting to see if there is a unifying vision that can make the VoidZero organization greater than the sum of its parts.

## Semantic editors

- **Hazel** An editor -- an editor with gaps! Still seems to see itself first as a text editor, and can enter some very odd and unintuitive states because of it. Best-in-class aids to syntax comprehension help you understand exactly what syntax node is selected and what it does. Wants to become a live notebook system.

- **Ki** Hey, want to be friends? I'll help you put the whole thing in the browser.

- **Cursorless** One of the more wildly imaginative semantic editors, Cursorless lets you write code fast just by speaking commands in a well-designed syntax.

- **Scratch** A purely block-based programming environment. Has embedding gaps, like all block-based editors. Multilingual!! Suffers from the usual problem that the code editor and the programming language are one closely-linked thing, severely limiting the potential to invest in the editor.

- **Pantograph** A texual-semantic code editor with embedding gaps and no support for invalid syntax. Users directly instantiate the typed representation of the code being edited. Heading towards multi-language support. Likely the current overall leader in editor UX innovation in my view, though the product is not yet market-ready.

- **JetBrains MPS** Ugh, I don't know. Never used it. Clearly has several ideas right, but the screenshots make it look like it's from 1995
