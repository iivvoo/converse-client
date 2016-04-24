/*jshint node:true*/
/* global require, module */
var path = require('path');

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var config = {};

  if(EmberApp.env() === "es6dev") {
    config.babel = config.babel || {};
    config.babel.blacklist = [
     'es6.forOf',
     'regenerator',
     'es6.arrowFunctions',
     'es6.constants',
     'es6.blockScoping',
     'es6.templateLiterals'];
  }
  var app = new EmberApp(defaults, config);
  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.
  var bootstrapPath   = path.join(app.bowerDirectory,'/bootstrap/dist/');
  app.import(path.join(bootstrapPath, 'js/bootstrap.js'));
  app.import(path.join(bootstrapPath, 'css/bootstrap.css'));
  app.import(path.join(bootstrapPath, 'fonts/glyphicons-halflings-regular.eot'), { destDir: '/fonts' });
  app.import(path.join(bootstrapPath, 'fonts/glyphicons-halflings-regular.svg'), { destDir: '/fonts' });
  app.import(path.join(bootstrapPath, 'fonts/glyphicons-halflings-regular.ttf'), { destDir: '/fonts' });
  app.import(path.join(bootstrapPath, 'fonts/glyphicons-halflings-regular.woff'), { destDir: '/fonts' });
  app.import(path.join(bootstrapPath, 'fonts/glyphicons-halflings-regular.woff2'), { destDir: '/fonts'});

  return app.toTree();
};
