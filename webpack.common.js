const path = require('path');

module.exports = {
  entry: {
    app: './js/mainPage.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: './js/mainPage.js',
  },
};
