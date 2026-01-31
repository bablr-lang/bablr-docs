import { highlightAll } from 'bedazzlr';
import { spam as m } from '@bablr/boot';
import * as Spans from '@bablr/agast-helpers/spans';
import { buildSpan } from '@bablr/agast-helpers/builders';
import cstml from '@bablr/language-en-cstml';
import esnext from '@bablr/language-en-esnext';
import json from '@bablr/language-en-json';
import { eatMatch, extendLanguage, getInstrMatcher } from '@bablr/helpers/grammar';
import { Coroutine } from '@bablr/coroutine';
import { reifyMatcherReferenceName } from '@bablr/agast-vm-helpers';
import { triviaEnhancer } from '@bablr/helpers/trivia';

let runCo = (generator) => new Coroutine(generator).advance();

let proposalStreamIterator = (language) => {
  return extendLanguage(language, {
    grammar: triviaEnhancer(
      {
        triviaIsAllowed: (s) => s.span.name === 'Bare',
        triviaMatcher: m`#: <__Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
      },
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
      },
    ),
  });
};

let languages = new Map([
  [cstml.canonicalURL, cstml],
  [esnext.canonicalURL, proposalStreamIterator(esnext)],
  [json.canonicalURL, json],
]);

const Highlighter = () => {
  return null;
};

highlightAll(languages, {
  spans: Spans.fromValues([buildSpan('Trivia', null, { spaces: 2 })]),
});

export default Highlighter;
