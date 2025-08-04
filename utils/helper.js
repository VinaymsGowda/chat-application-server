const uuidv4 = require("uuid").v4;

const getUTCDate = () => {
  const date = new Date().toISOString();
  return date;
};

const generateUniqueFileName = (fileName) => {
  const uniqueName = uuidv4() + "-" + fileName;
  return uniqueName;
};

module.exports = {
  getUTCDate,
  generateUniqueFileName,
};
