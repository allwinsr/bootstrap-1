/* jshint node: true */
/*!
 * Bootstrap Grunt task for taking screenshots in various browsers via Sauce
 * http://getbootstrap.com
 * Copyright 2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

var path = require('path');
var wd = require('wd');


function filenameForBrowser(browserSpec) {
  var cleanVersion = (browserSpec.version === undefined ? '' : browserSpec.version);
  var filename = (browserSpec.browserName + '-' + browserSpec.platform + '-' + cleanVersion).replace(/ /g, '_') + '.png';
  return filename
}


module.exports = function takeSauceScreenshots(grunt, options) {
  var timeoutMs = options.timeout || (5 * 60 * 1000);
  var done = this.async();

  grunt.log.writeln('Connecting to Sauce Labs...');
  var browser = wd.promiseChainRemote('ondemand.saucelabs.com', 80, process.env.SAUCE_USERNAME, process.env.SAUCE_ACCESS_KEY);

  var screenshotsPromise = options.browsers.reduce(function (browserPromise, browserSpec) {
    var filename = filenameForBrowser(browserSpec);
    var filepath = path.join(options.destDir, filename);
    return (browserPromise
      .init(browserSpec)
      .then(function () {
        grunt.log.writeln();
        grunt.log.writeflags(browserSpec, 'Taking screenshot in');
      })
      .get(options.url)
      .takeScreenshot(function (err, base64png) {
        if (err) {
          throw err;
        }
        var pngBuf = new Buffer(base64png, 'base64');
        grunt.file.write(filepath, pngBuf);
        grunt.log.writeln('Screenshot ' + filename.bold.cyan + ' snapped.');
      }));
  }, browser);

  screenshotsPromise
    .timeout(timeoutMs, 'Sauce screenshotting process timed out!')
    .fin(function() {
      return browser.quit();
    })
    .fail(function (err) {
      grunt.fail.warn(err);
    })
    .then(function () {
      done(true);
    });
};
