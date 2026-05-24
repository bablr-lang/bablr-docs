import { createRoot, onCleanup } from 'solid-js';
import { createVisibilityObserver } from '@solid-primitives/intersection-observer';
import { highlightCode } from 'bedazzlr';
import * as BListKeyed from '@bablr/agast-helpers/b-map';
import cstml from '@bablr/language-en-cstml';
import esnext from '@bablr/language-en-esnext';
import json from '@bablr/language-en-json';
import {
  m,
  o,
  eat,
  eatMatch,
  endSpan,
  getInstrMatcher,
  match,
  startSpan,
} from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import { getStreamIterator } from '@bablr/agast-helpers/stream';
import { buildSpanEntry, parseObject, printSource } from '@bablr/agast-helpers/tree';
import { freezeClass } from '@bablr/agast-helpers/object';
import { maybeWait } from '@bablr/agast-helpers/iterable';

Error.stackTraceLimit = 20;

let proposalStreamIterator = (language) => {
  class Grammar extends language.atrivial {
    *FunctionExpression(args) {
      let iter = super.FunctionExpression(args);
      let step = iter.next();

      while (!step.done) {
        let instr = step.value;
        let refName = getInstrMatcher(instr)?.reference.value.name;

        if (refName === 'asyncToken') {
          let async_ = yield instr;
          step = iter.next(async_);
          if (async_) {
            yield eatMatch(m`optionalAsyncToken*: <* '?' />`);
          }
        } else {
          step = iter.next(yield instr);
        }
      }
    }

    *FunctionDeclaration(args) {
      let iter = super.FunctionDeclaration(args);
      let step = iter.next();

      while (!step.done) {
        let instr = step.value;
        let refName = getInstrMatcher(instr)?.reference.value.name;

        if (refName === 'asyncToken') {
          let async_ = yield instr;
          if (async_) {
            yield eatMatch(m`optionalAsyncToken*: <* '?' />`);
          }
          step = iter.next(async_);
        } else {
          step = iter.next(yield instr);
        }
      }
    }

    *For(args) {
      let iter = super.For(args);
      let step = iter.next();

      while (!step.done) {
        let instr = step.value;
        let refName = getInstrMatcher(instr)?.reference.value.name;

        if (refName === 'awaitToken') {
          let await_ = yield instr;
          if (await_) {
            yield eatMatch(m`optionalAwaitToken*: <* '?' />`);
          }
          step = iter.next(await_);
        } else {
          step = iter.next(yield instr);
        }
      }
    }

    *AwaitExpression() {
      yield eat(m`sigilToken*: <*Keyword 'await' />`);
      yield eatMatch(m`optionalToken*: <* '?' />`);
      yield eat(m`expression+$: <_Expression />`);
    }
  }

  freezeClass(Grammar);

  return triviaEnhancer(
    {
      triviaIsAllowed: (s) => s.span.name === 'Bare',

      *Trivia({ s }) {
        let span = BListKeyed.get('Trivia', s().spans);

        let spaces = (span && parseObject(span.props).spaces) ?? Infinity;

        yield startSpan('Trivia', null, span?.props);
        let res = yield match(m`/\/\/|\/\*|[ \t][^ \t\r\n\g/]|[ \n\r\t]/`);

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
  );
};

const useVisibilityObserver = createRoot(createVisibilityObserver);

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
      highlightCode(block, language, name ? m`_: <${name} />` : language.defaultMatcher, {
        chunkSize: 20,
        bablr: {
          spans: BListKeyed.fromValues([
            buildSpanEntry('Trivia', null, '{ spaces: 2 }'),
            buildSpanEntry('Bare'),
          ]),
        },
      }),
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

  onCleanup(async () => {
    let step = iter.return();
    while (step instanceof Promise || step === null) {
      if (step === null) step = iter.return();
      if (step instanceof Promise) step = await step;
    }
  });

  return block;
};

export default Highlighter;
