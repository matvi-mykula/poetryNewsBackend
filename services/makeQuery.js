const createPoemQuery = (poemData) => {
  const { datestamp, category, content, goods, bads, sentiment } = poemData;

  const createPoemQuery = `INSERT INTO poetryNews(datestamp, category, content, goods, bads, sentiment) 
    VALUES ('${datestamp}', '${category}', '${content}', '${goods}', '${bads}', '${sentiment}')`;

  return createPoemQuery;
};

const getTodaysPoemsQuery = (key) => {
  // const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const today = now
    .toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      format: 'isoString',
    })
    .split(', ');
  console.log(today[0]);
  console.log('today');

  const todaysPoemsQuery = `Select * FROM poetryNews 
  WHERE datestamp = '${today[0]}' 
  AND category = '${key}'`;
  return todaysPoemsQuery;
};

// search and update on id, id is unique and will not change
const makeUpdateQuery = (newPoem) => {
  console.log(newPoem.id);
  const updatePoemQuery = `UPDATE poetryNews
    SET 
    goods = ${newPoem.goods}, 
    bads = ${newPoem.bads}
    WHERE id = ${newPoem.id};`;
  // these are the only things beign updated
  return updatePoemQuery;
};
export { createPoemQuery, getTodaysPoemsQuery, makeUpdateQuery };
