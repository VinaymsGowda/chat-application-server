const getUTCDate = () => {
  const date = new Date().toISOString();
  return date;
};

module.exports = {
  getUTCDate,
};
