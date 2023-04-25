const createPoemQuery = (poemData) => {
  const { datestamp, category, content, goods, bads, sentiment } = newPoem;

  const createPoemQuery = `INSERT INTO poems(datestamp, category, content, goods, bads, sentiment) 
    VALUES ('${datestamp}', '${category}', '${content}', '${goods}', '${bads}', '${sentiment}')`;

  return createPoemQuery;
};

export { createPoemQuery };
