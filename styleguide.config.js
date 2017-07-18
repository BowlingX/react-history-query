module.exports = {
  ignore: [
    '**/__tests__/**',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.js',
    '**/*.spec.jsx',
    '**/shared/**'
  ],
  webpackConfig: require('./webpack.config.js'),
  sections: [
    {
      name: 'API',
      components: 'src/lib/components/**/*.js'

    },
    {
      name: 'Demos',
      components: 'src/demo/**/index.js'
    }
  ]
};
