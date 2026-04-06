import { createVisibilityObserver } from '@solid-primitives/intersection-observer';
import { highlightCode } from 'bedazzlr';
import * as BMap from '@bablr/agast-helpers/b-map';
import cstml from '@bablr/language-en-cstml';
import esnext from '@bablr/language-en-esnext';
import json from '@bablr/language-en-json';
import {
  m,
  o,
  eat,
  eatMatch,
  endSpan,
  extendLanguage,
  getInstrMatcher,
  match,
  startSpan,
} from '@bablr/helpers/grammar';
import { Coroutine } from '@bablr/coroutine';
import { reifyMatcherReferenceName } from '@bablr/agast-vm-helpers';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import { onCleanup } from 'solid-js';
import {
  buildBoundNodeMatcher,
  buildNodeFlags,
  buildPropertyMatcher,
  buildReferenceMatcher,
  buildTreeNodeMatcher,
  buildTreeNodeMatcherOpen,
} from '@bablr/helpers/builders';
import { buildEmbeddedMatcher } from '@bablr/agast-vm-helpers/builders';
import { maybeWait, getStreamIterator } from '@bablr/agast-helpers/stream';
import { buildSpanEntry, printSource } from '@bablr/agast-helpers/tree';

let runCo = (generator) => new Coroutine(generator).advance();

let proposalStreamIterator = (language) => {
  class Grammar extends language.grammar.atrivial {
    *FunctionExpression(args) {
      let co = runCo(super.FunctionExpression(args));

      while (!co.done) {
        let instr = co.value;
        let refName = reifyMatcherReferenceName(getInstrMatcher(instr));

        if (refName === 'asyncToken') {
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

        if (refName === 'asyncToken') {
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

        if (refName === 'awaitToken') {
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
  }

  freeze(Grammar);
  freeze(Grammar.prototype);

  return extendLanguage(language, {
    grammar: triviaEnhancer(
      {
        triviaIsAllowed: (s) => s.span.name === 'Bare',

        *Trivia({ s }) {
          let span = BMap.get('Trivia', s().spans);

          let spaces = span?.props.spaces ?? Infinity;

          yield startSpan('Trivia', null, span?.props);
          let res = yield match(m`/\/\/|\/\*|[ \t][^ \t\r\n\g]|[ \n\r\t]/`);

          if (res) {
            res = printSource(res);
          }

          if (res && ' \t'.includes(res[0]) && res.length === 2 && spaces > 1) {
            yield eat(m`#: <* ' ' />`, o({}), o({ hold: true }));
          } else {
            yield eat(m`#: <Trivia />`, o({}), o({ hold: true }));
          }
          yield endSpan();
        },
      },
      Grammar,
    ),
  });
};

const useVisibilityObserver = createVisibilityObserver();

let languages = new Map([
  [cstml.canonicalURL, cstml],
  [esnext.canonicalURL, proposalStreamIterator(esnext)],
  [json.canonicalURL, json],
]);

const Highlighter = (props) => {
  let iter;
  let block = props.fallback.firstElementChild;

  let visible = useVisibilityObserver(() => {
    if (!visible()) {
      return block;
    }

    let canonicalURL = block.getAttribute('bablr-lang');
    let language = languages.get(canonicalURL);
    let flags = block.getAttribute('bablr-ref-flags');
    let name = block.getAttribute('bablr-prod');

    if (!language) return null;
    if (!name && !language.defaultMatcher) return null;

    iter = getStreamIterator(
      highlightCode(
        block,
        language,
        name
          ? buildEmbeddedMatcher(
              buildPropertyMatcher(
                buildReferenceMatcher('_', null, flags),
                buildBoundNodeMatcher(
                  [],
                  buildTreeNodeMatcher(buildTreeNodeMatcherOpen(buildNodeFlags(), null, name)),
                ),
              ),
            )
          : language.defaultMatcher,
        {
          chunkSize: 20,
          bablr: {
            spans: BMap.fromValues([
              buildSpanEntry('Trivia', null, { spaces: 2 }),
              buildSpanEntry('Bare'),
            ]),
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

    return null;
  });

  onCleanup(() => {
    stepPromise = null;
    iter.return();
  });

  return block;
};

export default Highlighter;
