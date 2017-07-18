// convert args to named args
const namedArgs = process.argv.reduce((o, v) => {
  o[v] = true;
  return o;
}, {});

const files = [];
const customPath = process.env.npm_config_path;

if (!customPath) {
  files.push('src/**/__tests__/**/*.js');
} else {
  files.push(customPath);
}

files.push(
  {
    pattern: 'src/**/__tests__/fixtures/**/*',
    watched: true,
    included: false,
    served: true
  }
);

export default (config) => {
  config.set({
    basePath: '',
    browserNoActivityTimeout: 50000,
    files,
    frameworks: ['jasmine-ajax', 'jasmine'],
    browsers: ['Chrome'],
    preprocessors: { './src/**/*.js': ['webpack'] },
    reporters: '--ci' in namedArgs ? ['spec', 'junit', 'coverage'] : ['spec'],
    coverageReporter: {
      dir: 'reports',
      reporters: [
        { type: 'lcov', subdir: 'report-lcov' }
      ]
    },
    webpack: require('./webpack.config'),
    plugins: [
      'karma-webpack',
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-jasmine-ajax',
      'karma-junit-reporter',
      'karma-coverage',
      'karma-spec-reporter'
    ],
    webpackMiddleware: {
      noInfo: true
    },
    junitReporter: {
      outputDir: 'test_out',
      suite: 'unit'
    }
  });
};
