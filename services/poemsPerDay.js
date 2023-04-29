import cron from 'node-cron';
// import { pool } from '../server.js';
import { getTopWords } from './scraper.js';
import { createPoemQuery } from './makeQuery.js';
import { openai, pool } from '../server.js';
import { getSentiment } from './getSentiment.js';

//

////// need to iron out timing of this... time stamp is create in isostring 8601 format
//// cron schedules in local time so there is an overlap of no haikus...
const generateOnceADay = cron.schedule('03 19 * * *', () => {
  console.log('Once a Day');
  makeAllForCategory('pop');
  makeAllForCategory('news');
});

/// this is to save money on openai prompts
const chooseRandomHalf = (list) => {
  list.sort(() => Math.random() - 0.5);
  const halfLength = Math.floor(list.length / 2);
  const selectedElements = [];
  for (let i = 0; i < halfLength; i++) {
    selectedElements.push(list[i]);
  }
  return selectedElements;
};

const makeAllForCategory = async (category) => {
  console.log('making');
  const topList = await getTopWords(category);
  for (let i = 0; i < 10; i++) {
    makePoem(chooseRandomHalf(topList), category);
  }
};

const makePoem = async (list, category) => {
  try {
    const prompt = `Write a haiku using some of these words: ${list}`;
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    const haikuResponse = response.data.choices[0].text;
    const haiku = haikuResponse.split('\n').filter((str) => str.trim() !== '');

    const sentiment = getSentiment(haiku.join(' '));
    const today = new Date();
    console.log(today);
    console.log({ haiku });
    const newPoem = {
      datestamp: today.toISOString(),
      category: category,
      content: haiku,
      goods: 0,
      bads: 0,
      sentiment: sentiment,
    };

    pool.query(createPoemQuery(newPoem), (err, res) => {
      if (err) {
        console.log(err);
      } else {
        console.log({ success: true, code: 200, result: res });
        /// might want to add a socket emit here to let front end know there was an update
        // socket.emit('server', { success: true, code: 200, result: res });
        return;
      }
    });
  } catch (err) {
    console.log(err);
    return;
  }
};
export { generateOnceADay };
