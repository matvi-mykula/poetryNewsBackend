import axios from 'axios';
import { stopwords } from '../utils/stopwords.js';
const scrapeResponse = async (url) => {
  try {
    const response = await axios.get(url);

    const postData = response.data.data.children.map((post) => {
      return post.data.title;
    });
    return { success: true, postData: postData };
  } catch (err) {
    console.log(err);
    return { success: false, postData: [] };
  }
};

const getTopWords = async (key) => {
  let url;
  if (key === 'pop') {
    url = 'https://www.reddit.com/r/popular/top.json';
  }
  if (key === 'news') {
    url = 'https://www.reddit.com/r/news/top.json';
  }
  const response = await scrapeResponse(url);
  const pageTitles = response.postData;
  const combinedTitles = pageTitles.join(' ');
  combinedTitles.replace(/[^\p{L}\s]/gu, ''); ///removes non letter characters

  const words = combinedTitles.split(' ');
  let filteredWords = words.filter((str) => parseInt(str) !== Number(str));

  filteredWords = filteredWords.filter(
    (word) => !stopwords.includes(word.toLocaleLowerCase())
  );

  const wordCounts = {};
  for (let i = 0; i < filteredWords.length; i++) {
    const word = filteredWords[i];
    if (wordCounts[word]) {
      wordCounts[word]++;
    } else {
      wordCounts[word] = 1;
    }
  }
  const wordCountArray = [];
  for (const word in wordCounts) {
    wordCountArray.push({ word, count: wordCounts[word] });
  }
  wordCountArray.sort((a, b) => b.count - a.count);
  const top20Words = wordCountArray.slice(0, 10);
  console.log({ top20Words });
  return top20Words;
};

export { getTopWords };
