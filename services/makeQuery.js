const createPoemQuery = (poemData) => {
  const { datestamp, category, content, goods, bads, sentiment } = poemData;

  const createPoemQuery = `INSERT INTO poetryNews(datestamp, category, content, goods, bads, sentiment) 
    VALUES ('${datestamp}', '${category}', '${content}', '${goods}', '${bads}', '${sentiment}')`;

  return createPoemQuery;
};

const getTodaysPoemsQuery = (key) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysPoemsQuery = `Select * FROM poetryNews 
  WHERE datestamp = '${today}' 
  AND category = '${key}'`;
  return todaysPoemsQuery;
};

export { createPoemQuery, getTodaysPoemsQuery };
