
// built-in plugins

Module.registerPlugin('$template', [ '$module' ], function ($module) {
  $module.addToRecipies(function (instance, settings) {
    
    var constructor = function Template () {};

    if (typeof Template !== 'undefined') {
      constructor.prototype = Object.create(Template.prototype);
      constructor.prototype.constructor = constructor;
    }

    var _Template = { prototype: constructor.prototype };

    instance.Template = _Template;

    instance.__addTemplate__ = function (templateName, templateFunc) {

      // TODO: better error messages
      if (_Template.hasOwnProperty(templateName)) {
        if (_Template[templateName].__makeView)
          throw new Error("There are multiple templates named '" + templateName + "'. Each template needs a unique name.");
        throw new Error("This template name is reserved: " + templateName);
      }

      var tmpl = new _Template.prototype.constructor;
      var templateNameWithPrefix = settings.__name__ + '_' + templateName;

      tmpl.__viewName     = 'Template.' + templateName;
      tmpl.__templateName = templateNameWithPrefix;
      tmpl.__render       = templateFunc;

      _Template[templateName] = tmpl;

      _Template.prototype[templateName] = tmpl;

      if (typeof Template !== 'undefined') {
        Template[templateNameWithPrefix] = tmpl;
      }
    };

    // "global" helpers scoped to the module namespace

    instance.registerHelper = function (helperName, helperFunc) {
      if (_Template.prototype.hasOwnProperty(helperName)) {
        throw new Error("Helper " + helperName + " already exists.");
      }
      _Template.prototype[helperName] = helperFunc;
    };

  });
});

Module.registerPlugin('$instance', [ '$module' ], function ($module) {
  $module.addToRecipies(function (instance) {
    instance.define('$instance', function () {
      return instance;
    });
  });
});

Module.registerPlugin('$ready', [ '$module' ], function ($module) {
  var readyDependency = new Deps.Dependency();
  var isReady = false;

  $module.addToRecipies(function (instance) {
    instance.ready = function () {
      readyDependency.depend();
      return isReady;
    }
  });

  Meteor.defer(function () { // to prevent circular dependencies

    $module.require('$config', function ($config) {
      $module.require($module.plugins.concat($config.plugins), function () {
        isReady = true;
        readyDependency.changed();
      });
    });

  });
});
