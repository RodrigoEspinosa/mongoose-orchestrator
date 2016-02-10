'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var mongoose = require('mongoose');

/**
 * Join a iterator with given link or use ',' as default.
 * @param  {Object} iterator
 * @param  {String} link=',' [description]
 * @return {String}
 */
var joinIterator = function joinIterator(iterator) {
  var link = arguments.length <= 1 || arguments[1] === undefined ? ',' : arguments[1];
  return Array.from(iterator).join(link);
};

/**
 * Mongoose plugin to keep references to attributes synchronized.
 * @param  {Object} schema The original schema.
 */
var orchestratorPlugin = function orchestratorPlugin(schema) {

  // Store a list of all the paths that needs to be synced.
  var modelsToSync = new Map();

  // Add the reference to the model.
  var addPathToSync = function addPathToSync(modelName, pathName, referencedAttr) {
    // Get the model map and assign the new key.
    var modelMap = modelsToSync.has(modelName) ? modelsToSync.get(modelName) : new Map();
    modelMap.set(pathName, referencedAttr);

    modelsToSync.set(modelName, modelMap);
  };

  // Check if the check path has sync enabled for a specific schema.
  var hasSyncEnabled = function hasSyncEnabled(pathName, schemaType) {
    return schemaType.options && schemaType.options.sync;
  };

  // Find every path that has a `sync` option.
  schema.eachPath(function (pathName, schemaType) {
    if (hasSyncEnabled(pathName, schemaType)) {
      // Raise an error if the path does not has a reference, `ref` attribute.
      if (!schemaType.options.ref) {
        new Error('ValidationError'); // TODO
      }

      // Get the model and referenced attribute from the `ref`.

      var _schemaType$options$r = schemaType.options.ref.split('.');

      var _schemaType$options$r2 = _slicedToArray(_schemaType$options$r, 2);

      var model = _schemaType$options$r2[0];
      var attr = _schemaType$options$r2[1];

      // Set the map for reference-to-attribute population.

      addPathToSync(model, pathName, attr);
    }
  });

  /**
   * Pre-save flow for the instance that get-and-populate (sync)
   * each attribute that was required in the schema with the `sync` flag.
   * @param  {Function} done
   */
  var onPreSave = function onPreSave(done) {
    var _this = this;

    /**
     * Get the instance of the requested model based on the
     * instance lowercased attribute.
     * @param  {String} modelName
     * @return {Promise}
     */
    var getReferenceInstance = function getReferenceInstance(modelName) {
      // Get the reference to the specific document.
      var documentId = _this[modelName.toLowerCase()];

      // Get the values to select from the paths to be synced list.
      var select = joinIterator(modelsToSync.get(modelName).values());

      // Query the reference model.
      return mongoose.model(modelName).findById(documentId, select).exec();
    };

    // Set of promises of for populating all the instances.
    var promises = new Set();

    // Iterate over all the models that needs to be fetched.
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      var _loop = function _loop() {
        var modelName = _step.value;

        /**
         * Set all the attributes for the current instance based on the
         * reference.
         * @param  {Object} reference
         * @return {Promise}
         */
        var setReferences = function setReferences(reference) {
          // Get the paths to sync for the current instance.
          var pathsToSync = modelsToSync.get(modelName);

          // Iterate over all the paths to sync.
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = pathsToSync[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var _step2$value = _slicedToArray(_step2.value, 2);

              var ownPathToSync = _step2$value[0];
              var referenceAttr = _step2$value[1];

              // Copy the value of the reference attribute to the current instance.
              _this[ownPathToSync] = reference[referenceAttr];
            }

            // Always resolve the promise.
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          return Promise.resolve();
        };

        // Get the reference and then set the attributes to the current instance.
        promises.add(getReferenceInstance(modelName).then(setReferences));
      };

      for (var _iterator = modelsToSync.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        _loop();
      }

      // Complete the `pre-save` after populating all attributes from all references.
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return Promise.all(promises).then(function () {
      return done();
    }).catch(console.error);
  };

  // Set the `pre-save` hook on the current schema.
  schema.pre('save', onPreSave);

  // TODO -- Set the `post-save` hook on the referenced schemas.
};

module.exports = exports = orchestratorPlugin;