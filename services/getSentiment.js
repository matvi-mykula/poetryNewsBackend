// Load wink-nlp package.
// const winkNLP = require('wink-nlp');
import winkNLP from 'wink-nlp';
// Load english language model.
// const model = require('wink-eng-lite-web-model');
import model from 'wink-eng-lite-web-model';
// Instantiate winkNLP.
const nlp = winkNLP(model);
// Obtain "its" helper to extract item properties.
const its = nlp.its;
// Obtain "as" reducer helper to reduce a collection.
const as = nlp.as;
// nlp.use(posTagger);

function getSentiment(text) {
  const doc = nlp.readDoc(text);
  const sentiment = doc.out(its.sentiment);
  return sentiment;
}

export { getSentiment };
