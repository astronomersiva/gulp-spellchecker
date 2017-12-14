const spellchecker = require('spellchecker');
const through = require('through2');
const gutil = require('gulp-util');

const uniqueArray = list => list.filter((element, index) => list.indexOf(element) === index);

const {
  PluginError,
  colors: {
    cyan: infoLog,
    gray: misspellingLog,
    underline: fileLog
  }
} = gutil;

const {
  log
} = console;

const PLUGIN_NAME = 'gulp-spellchecker';

module.exports = function (userOptions) {
  function transform(file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    if (file.isBuffer()) {
      try {
        const fileContents = file.contents.toString('utf8');
        const misspellingIndices = spellchecker.checkSpelling(fileContents);
        const caughtMisspellings = [];

        const options = userOptions || { exclude: [] };
        const { exclude } = options;
        const excludeRegex = new RegExp(exclude.join('|'));

        misspellingIndices.forEach((misspellingIndex) => {
          const caughtMisspelling = fileContents.substring(misspellingIndex.start, misspellingIndex.end);
          if (!exclude.length || !excludeRegex.test(caughtMisspelling)) {
            caughtMisspellings.push(caughtMisspelling);
          }
        });

        if (caughtMisspellings.length) {
          log(fileLog(`\n${file.path}`));

          uniqueArray(caughtMisspellings).forEach((caughtMisspelling) => {
            log(misspellingLog(`\t${caughtMisspelling}`));
          });
        }

        cb();
      } catch (err) {
        return cb(new PluginError(PLUGIN_NAME, err));
      }
    }

    return cb(null, file);
  }

  log(infoLog(PLUGIN_NAME), 'Checking spellings');

  return through.obj(transform);
};
