import cron from 'node-cron';
// import { pool } from '../server.js';
import { getTopWords } from './scraper.js';
import { createPoemQuery } from './makeQuery.js';
import { openai, pool } from '../server.js';
import { getSentiment } from './getSentiment.js';

//
const scheduledTime = '05 07 * * *'; /// this should => 705am utc time which
///=> 1205am pacific
// this is done cause the fly server time is kept in utc time
const everyMinute = cron.schedule(scheduledTime, () => {
  console.log('everyminute');
  console.log(scheduledTime);
});

////// need to iron out timing of this... time stamp is create in isostring 8601 format
//// cron schedules in local time so there is an overlap of no haikus...
const generateOnceADay = cron.schedule(scheduledTime, () => {
  console.log('Once a Day');
  try {
    console.log('haiku');
    makeAllForCategory('pop');
    console.log('making pop');
    makeAllForCategory('news');
    console.log('making news');
  } catch (err) {
    console.log('once a day failed');
  }
});

/// this is to save money on openai prompts
const chooseRandomHalf = (list) => {
  list.sort(() => Math.random() - 0.5);
  const halfLength = Math.floor(list.length / 2);
  const selectedElements = [];
  // right now just get 5 random words from bigger list to create more variety
  for (let i = 0; i < 5; i++) {
    selectedElements.push(list[i]);
  }
  return selectedElements;
};

const makeAllForCategory = async (category) => {
  console.log('making');
  const topList = await getTopWords(category);
  for (let i = 0; i < 10; i++) {
    makePoem(chooseRandomHalf(topList), category);
    console.log(`${category}-- ${i}`);
  }
};

const makePoem = async (list, category) => {
  try {
    const prompt = `write haiku using these words: ${list}`;
    console.log({ prompt });
    // const prompt = `Write a haiku using some of these words: ${list}`;
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
    const now = new Date();
    const today = now
      .toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        format: 'isoString',
      })
      .split(', ')[0];

    const newPoem = {
      datestamp: today,
      category: category,
      content: haiku,
      goods: 0,
      bads: 0,
      sentiment: sentiment,
    };
    console.log({ newPoem });
    const [query, values] = createPoemQuery(newPoem);

    console.log('making new poem');
    pool.query(query, values, (err, res) => {
      if (err) {
        console.log('query problem');
        console.log(err);
      } else {
        console.log({ success: true, code: 200, result: res });
        /// might want to add a socket emit here to let front end know there was an update
        // socket.emit('server', { success: true, code: 200, result: res });
        return;
      }
    });
  } catch (err) {
    console.log('make poem error');
    console.log(err);
    return;
  }
};
export { generateOnceADay, everyMinute, makePoem, chooseRandomHalf };
