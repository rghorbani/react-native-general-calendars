module.exports = {
  extends: 'eslint-config-kajoo',
  // "globals": {
  //   "__DEV__": true,
  //   "__dirname": false,
  //   "console": false,
  //   "document": false,
  //   "jest": false,
  //   "Map": true,
  //   "Promise": true,
  //   "Set": true,
  //
  //   // Flow global types.
  //   "ReactElement": false,
  // },
  rules: {
    // "react/display-name": 0,
    'react/prop-types': 0,
    'react-native/no-inline-styles': 0,
  },
};
