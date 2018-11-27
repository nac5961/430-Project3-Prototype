// Function to set a string to null if it is
// set to 'undefined' due to a force cast to a string
const verifyString = (string) => {
  let value = string;

  if (value && value === 'undefined') {
    value = null;
  }

  return value;
};

module.exports = {
  verifyString,
};
