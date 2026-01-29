import { highlightAll } from 'bedazzlr';
import * as Spans from '@bablr/agast-helpers/spans';
import { buildSpan } from '@bablr/agast-helpers/builders';
import cstml from '@bablr/language-en-cstml';
import esnext from '@bablr/language-en-esnext';
import json from '@bablr/language-en-json';

let languages = new Map([
  [cstml.canonicalURL, cstml],
  [esnext.canonicalURL, esnext],
  [json.canonicalURL, json],
]);

const Highlighter = () => {
  return null;
};

highlightAll(languages, {
  spans: Spans.fromValues([buildSpan('Trivia', null, { spaces: 2 })]),
});

export default Highlighter;
