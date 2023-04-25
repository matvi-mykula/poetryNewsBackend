import express from 'express';
const app = express();
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
import { Configuration, OpenAIApi } from 'openai';
app.use(cors());
app.use(bodyParser.json());
import axios from 'axios';
import { getTopWords } from './services/scraper.js';
import pkg from 'pg';
const { Pool } = pkg;
import { createPoemQuery } from './services/makeQuery.js';
////// --------- end of imports

// Set up PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
pool.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('connected to db');
  }
});

//////// ------------- OPENAI
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

    return res.send({ success: true, code: 200, response: haiku });
  } catch (err) {
    console.log(err);
    return res.send({ success: false, code: 500, response: 'ERROR' });
  }
});
///////////////---------SOCKET.io
import { createServer } from 'http';
const server = createServer(app);
import { Server } from 'socket.io';
import * as socketio from 'socket.io'; /// needed?
const io = new Server(server, { cors: {} });
// make one function socket.on('newpoem') => create query
// make one function socket.on('vote') => update query
io.on('connection', (socket) => {
  socket.on('calendar:updated', () => {
    console.log(socket.id);
    console.log('socket emit');
    // Emit the event to all connected clients
    io.emit('calendar:updated', { foo: 1 });
  });
});
///////////------
app.get('/', (req, res) => {
  res.send('Hello World!');
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

app.listen(process.env.PORT, () => {
  console.log(`Express server listening on ${process.env.PORT}`);
});
