import express from 'express';
const app = express();
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
import { Configuration, OpenAIApi } from 'openai';
app.use(cors());
app.use(bodyParser.json());
import { getTopWords } from './services/scraper.js';
import pkg from 'pg';
const { Pool } = pkg;
import {
  createPoemQuery,
  getTodaysPoemsQuery,
  makeUpdateQuery,
} from './services/makeQuery.js';
import { generateOnceADay } from './services/poemsPerDay.js';
////// --------- end of imports

///////////////---------SOCKET.io
import { createServer } from 'http';
const server = createServer(app);
import { Server } from 'socket.io';
import { getSentiment } from './services/getSentiment.js';
const io = new Server(server, { cors: {} });

io.on('connection', (socket) => {
  console.log('socket connected');
  ///------ NEW POEM ----------------

  ///GET ALL POEMS ON TODAY ---------------
  socket.on('get_todays_poems', (key) => {
    console.log('get_today emit recieved');
    console.log({ key });
    const query = getTodaysPoemsQuery(key);
    console.log({ query });

    pool.query(query, (err, result) => {
      if (err) {
        console.log(err);
        socket.emit('error', 'Error while retrieving entry');
      } else {
        /// is this ok or do i need try catch??
        console.log(result.rows.length);
        console.log('get poems succesful');
        result.rows.forEach((poem) => {
          poem.content = poem.content.split(',');
        });
        console.log(result.rows);
        socket.emit('todays_poems', {
          success: true,
          code: 200,
          data: result.rows,
        });
      }
    });
  });
  //// UPDATE POEMDATA
  socket.on('poem:updated', (poemData) => {
    console.log('update');
    console.log(poemData);
    const query = makeUpdateQuery(poemData);
    pool.query(query, (err, result) => {
      if (err) {
        console.log(err);
        socket.emit('error', 'Error while updating data');
      } else {
        console.log('update succesful');
        console.log(result);
        socket.emit('get_todays_poems', poemData.category); // will this rerender page??
        /// dont need to do anything else
        /// emit 'get_todays_poems; from frontend
      }
    });
  });
});
///////////------
const isProd = app.get('env') === 'development' ? false : true;

let pool;
isProd
  ? (pool = new Pool({
      connectionString: process.env.CONNECTION_STRING,
    }))
  : (pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    }));

// Set up PostgreSQL pool
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// const pool = new Pool({
//   connectionString: process.env.CONNECTION_STRING,
// });
const createTable = `CREATE TABLE poetryNews (
  id SERIAL PRIMARY KEY,
  datestamp DATE,
  category TEXT,
  content TEXT,
  goods INTEGER,
  bads INTEGER,
  sentiment TEXT
);`;

pool.connect((err) => {
  if (err) {
    console.log('postgres problems');
    console.log(err);
  } else {
    console.log('connected to db');
    // pool.query(createTable, (err, result) => {
    //   if (err) {
    //     console.log('err');
    //   } else {
    //     console.log('success');
    //   }
    // });
  }
});

//////// ------------- OPENAI
////// this isnt beign used this was just to work out OPENAI
const configuration = new Configuration({
  organization: 'org-KZwE34ORK6RH6KIXeLyykQAd',
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/', async (req, res) => {
  try {
    const topWords = await getTopWords('news');
    console.log({ topWords });
    const topList = [];
    for (let i = 0; i < topWords.length; i++) {
      topList.push(topWords[i].word);
    }

    // after release cut down the prompt a bunch to save money
    const prompt = `Write a haiku using some of these words: ${topList}`;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    console.log(response.data.choices);
    const haiku = response.data.choices[0].text;
    console.log({ haiku });

    return res.send({ success: true, code: 200, response: haiku });
  } catch (err) {
    console.log(err);
    return res.send({ success: false, code: 500, response: 'ERROR' });
  }
});
app.get('/', (req, res) => {
  res.send('Hello from subconscious server!');
});
app.post('/save', async (req, res) => {
  /////if new poem then create new
  //// if old poem then update
  try {
    console.log(req.body);
    //validate with schema
    const newPoem = req.body.poem;
    const { datestamp, category, content, goods, bads, sentiment } = newPoem;
    const createPoemQuery = createPoemQuery(newPoem);
    pool.query(createPoemQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        return res.send({ success: true, code: 200, result: result });
      }
    });
  } catch (err) {
    console.log(err);
    res.send({ success: true, code: 200, result: err });
  }
});

const port = process.env.PORT || '8080';
server.listen('8080', () => {
  console.log(`Express server listening on ${port}`);
});
export { openai, pool };
generateOnceADay;
