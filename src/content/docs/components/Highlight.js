import { highlightCode } from "bedazzlr";
import { spam as m } from "@bablr/boot";
import * as Spans from "@bablr/agast-helpers/spans";
import { buildSpan } from "@bablr/agast-helpers/builders";
import cstml from "@bablr/language-en-cstml";
import esnext from "@bablr/language-en-esnext";
import json from "@bablr/language-en-json";
import {
  eatMatch,
  extendLanguage,
  getInstrMatcher,
} from "@bablr/helpers/grammar";
import { Coroutine } from "@bablr/coroutine";
import { reifyMatcherReferenceName } from "@bablr/agast-vm-helpers";
import { triviaEnhancer } from "@bablr/helpers/trivia";
import { onCleanup, onMount, children } from "solid-js";

let runCo = (generator) => new Coroutine(generator).advance();

let proposalStreamIterator = (language) => {
  return extendLanguage(language, {
    grammar: triviaEnhancer(
      {
        triviaIsAllowed: (s) => s.span.name === "Bare",
        triviaMatcher: m`#: <__Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
      },
      class Grammar extends language.grammar.atrivial {
        *FunctionExpression(args) {
          let co = runCo(super.FunctionExpression(args));

          while (!co.done) {
            let instr = co.value;
            let refName = reifyMatcherReferenceName(getInstrMatcher(instr));

            if (refName === "asyncToken") {
              let async_ = yield instr;
              co.advance(async_);
              if (async_) {
                yield eatMatch(m`optionalAsyncToken*: <* '?' />`);
              }
            } else {
              co.advance(yield instr);
            }
          }
        }

        *FunctionDeclaration(args) {
          let co = runCo(super.FunctionDeclaration(args));

          while (!co.done) {
            let instr = co.value;
            let refName = reifyMatcherReferenceName(getInstrMatcher(instr));

            if (refName === "asyncToken") {
              let async_ = yield instr;
              if (async_) {
                yield eatMatch(m`optionalAsyncToken*: <* '?' />`);
              }
              co.advance(async_);
            } else {
              co.advance(yield instr);
            }
          }
        }

        *For(args) {
          let co = runCo(super.For(args));

          while (!co.done) {
            let instr = co.value;
            let refName = reifyMatcherReferenceName(getInstrMatcher(instr));

            if (refName === "awaitToken") {
              let await_ = yield instr;
              if (await_) {
                yield eatMatch(m`optionalAwaitToken*: <* '?' />`);
              }
              co.advance(await_);
            } else {
              co.advance(yield instr);
            }
          }
        }

        *AwaitExpression() {
          yield eat(m`sigilToken*: <*Keyword 'await' />`);
          yield eatMatch(m`optionalToken*: <* '?' />`);
          yield eat(m`expression+$: <_Expression />`);
        }
      },
    ),
  });
};

let languages = new Map([
  [cstml.canonicalURL, cstml],
  [esnext.canonicalURL, proposalStreamIterator(esnext)],
  [json.canonicalURL, json],
]);

const Highlighter = (props) => {
  let iter;
  let children_ = children(() => props.children)();

  onMount(() => {
    let language = languages.get(canonicalURL);
    let block = children_;
    debugger;
    let flags = block.getAttribute("bablr-ref-flags");
    let name = block.getAttribute("bablr-prod");

    if (!language) return;
    if (!name && !language.defaultMatcher) return;

    iter = highlightCode(
      block,
      language,
      name
        ? buildEmbeddedMatcher(
            buildPropertyMatcher(
              buildReferenceMatcher("_", null, flags),
              buildBoundNodeMatcher(
                [],
                buildTreeNodeMatcher(
                  buildTreeNodeMatcherOpen(buildNodeFlags(), null, name),
                ),
              ),
            ),
          )
        : language.defaultMatcher,
      {
        spans: Spans.fromValues([buildSpan("Trivia", null, { spaces: 2 })]),
      },
    );

    let stepPromise = iter.next();

    let callback = (step) => {
      if (!step.done) {
        stepPromise = iter.next();
        stepPromise.then(callback);
      }
    };

    stepPromise.then(callback);
  });

  onCleanup(() => {
    stepPromise = null;
    iter.return();
  });

  return <>{children_}</>;
};

export default Highlighter;
