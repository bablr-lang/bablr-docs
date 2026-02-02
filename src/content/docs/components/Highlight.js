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
import { onCleanup, onMount } from "solid-js";
import {
  buildBoundNodeMatcher,
  buildNodeFlags,
  buildPropertyMatcher,
  buildReferenceMatcher,
  buildTreeNodeMatcher,
  buildTreeNodeMatcherOpen,
} from "@bablr/helpers/builders";
import { buildEmbeddedMatcher } from "@bablr/agast-vm-helpers/builders";
import { getStreamIterator } from "@bablr/stream-iterator";
import { maybeWait } from "@bablr/agast-helpers/stream";

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
  let block;

  onMount(() => {
    let canonicalURL = block.getAttribute("bablr-lang");
    let language = languages.get(canonicalURL);
    let flags = block.getAttribute("bablr-ref-flags");
    let name = block.getAttribute("bablr-prod");

    if (!language) return;
    if (!name && !language.defaultMatcher) return;

    iter = getStreamIterator(
      highlightCode(
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
          chunkSize: 20,
          bablr: {
            spans: Spans.fromValues([buildSpan("Trivia", null, { spaces: 2 })]),
          },
        },
      ),
    );

    let stepPromise = iter.next();

    let callback = (step) => {
      if (!step.done) {
        stepPromise = iter.next();
        maybeWait(stepPromise, callback);
      }
    };

    maybeWait(stepPromise, callback);
  });

  onCleanup(() => {
    stepPromise = null;
    iter.return();
  });

  block = props.fallback.firstElementChild;
  return block;
};

export default Highlighter;
