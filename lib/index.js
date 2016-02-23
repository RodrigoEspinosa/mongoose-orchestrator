'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

require('babel-polyfill');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var mongoose = require('mongoose');

/**
 * Mongoose plugin to keep references to attributes synchronized.
 * @param  {Object} schema The original schema.
 */
var orchestratorPlugin = function orchestratorPlugin(schema) {

  // Store a list of all the paths that needs to be synced.
  var modelsToSync = new Map();

  // Add the reference to the model.
  var addPathToSync = function addPathToSync(modelName, pathName, syncData) {
    // Get the model map and assign the new key.
    var modelMap = modelsToSync.has(modelName) ? modelsToSync.get(modelName) : new Map();
    modelMap.set(pathName, syncData);

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
        // TODO -- Throw error.
        new Error('ValidationError');
      }

      // Get the model and referenced attribute from the `ref`.

      var _schemaType$options$r = schemaType.options.ref.split('.');

      var _schemaType$options$r2 = _slicedToArray(_schemaType$options$r, 2);

      var model = _schemaType$options$r2[0];
      var attr = _schemaType$options$r2[1];

      // Get the source attribute where the `ObjectId` for the specified model.

      var source = schemaType.options.source || model.toLowerCase();

      // Build the object with the data so it can synchronize.
      var syncData = { attribute: attr, source: source };

      // Set the map for reference-to-attribute population.
      addPathToSync(model, pathName, syncData);
    }
  });

  /**
   * Pre-save flow for the instance that get-and-populate (sync)
   * each attribute that was required in the schema with the `sync` flag.
   * @param  {Function} done
   */
  var onSchemaPreSave = function onSchemaPreSave(done) {
    var _this = this;

    /**
     * Get the instance of the requested model based on the
     * instance lowercased attribute.
     * @param  {String} modelName
     * @return {Promise}
     */
    var getReferenceInstances = function getReferenceInstances(modelName) {
      var ids = new Set();
      var select = new Set();

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = modelsToSync.get(modelName).values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var syncData = _step.value;

          // Get the reference to the specific document.
          var documentId = _lodash2.default.get(_this, syncData.source);

          // Get the ids to fetch.
          ids.add(documentId);

          // Get the values to select from the paths to be synced list.
          select.add(syncData.attribute);
        }

        // Query the reference model.
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

      return mongoose.model(modelName).find({ _id: { $in: [].concat(_toConsumableArray(ids)) } }).select([].concat(_toConsumableArray(select)).join(' ')).exec();
    };

    /**
     * Set all the attributes for the current instance based on the
     * reference.
     * @param  {Object} reference
     * @return {Promise}
     */
    var setReferences = function setReferences(modelName) {
      return function (references) {

        // Get the paths to sync for the current instance.
        var pathsToSync = modelsToSync.get(modelName);

        // Iterate over all the paths to sync.
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          var _loop = function _loop() {
            var _step2$value = _slicedToArray(_step2.value, 2);

            var ownPathToSync = _step2$value[0];
            var syncData = _step2$value[1];
            var sourceAttribute = syncData.attribute;
            var idSource = syncData.source;

            // Get the corresponding reference based on the id.

            var sourceId = _lodash2.default.get(_this, idSource);
            var reference = _lodash2.default.find(references, function (reference) {
              return reference._id.equals(sourceId);
            });

            // Copy the value of the reference attribute to the current instance.
            _lodash2.default.set(_this, ownPathToSync, _lodash2.default.get(reference, sourceAttribute));
          };

          for (var _iterator2 = pathsToSync[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            _loop();
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
    };

    // Set of promises of for populating all the instances.
    var promises = new Set();

    // Iterate over all the models that needs to be fetched.
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = modelsToSync.keys()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var modelName = _step3.value;

        // TODO -- Check if the instance is not new and no sync is required.
        // for(let attr of modelsToSync.get(modelName).keys()) {
        //   console.log(attr);
        // }

        // Get the reference and then set the attributes to the current instance.
        promises.add(getReferenceInstances(modelName).then(setReferences(modelName)));
      }

      // Complete the `pre-save` after populating all attributes from all references.
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return Promise.all(promises).then(function () {
      return done();
    }).catch(console.error);
  };

  /**
   * Post-save flow for the instance that modifies an
   * attribute is required to be `sync` by another schemas.
   */
  var onSourcePreSave = function onSourcePreSave(done) {
    // Get the model name from the instance.
    var sourceModelName = this.constructor.modelName;

    // Get the attributes to sync.
    var pathsToSync = modelsToSync.get(sourceModelName);

    // Get the model needed to be updated.
    var targetModel = (0, _utils.getModelBySchema)(schema);

    var promises = new Set();

    // Set an object with the attributes to be updated and their values.
    var toUpdate = new Map();

    // Iterate over all the paths to sync.
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = pathsToSync[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var _step4$value = _slicedToArray(_step4.value, 2);

        var targetAttribute = _step4$value[0];
        var syncData = _step4$value[1];
        var sourceAttribute = syncData.attribute;
        var idSource = syncData.source;


        var toUpdateAttrs = toUpdate.get(idSource) || {};

        // Add the attribute to the update list if this was modified.
        if (this.isModified(sourceAttribute)) {
          var newValue = _lodash2.default.get(this, sourceAttribute);

          _lodash2.default.set(toUpdateAttrs, targetAttribute, newValue);
        }

        toUpdate.set(idSource, toUpdateAttrs);
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = toUpdate[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var _step5$value = _slicedToArray(_step5.value, 2);

        var key = _step5$value[0];
        var update = _step5$value[1];

        var find = {};find[key] = this._id;

        update = { $set: update };

        // Run the query to update those values.
        promises.add(targetModel.update(find, update, { multi: true }));
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    return Promise.all(promises).then(done);
  };

  // Set the `pre-save` hook on the current schema.
  schema.pre('save', onSchemaPreSave);

  // Set the `pre-save` hook on the source schema.
  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = modelsToSync.keys()[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var sourceModel = _step6.value;

      // Get the source schema.
      var sourceSchema = mongoose.models[sourceModel].schema;

      // Attach the `post-save` hook.
      sourceSchema.pre('save', onSourcePreSave);
    }
  } catch (err) {
    _didIteratorError6 = true;
    _iteratorError6 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion6 && _iterator6.return) {
        _iterator6.return();
      }
    } finally {
      if (_didIteratorError6) {
        throw _iteratorError6;
      }
    }
  }
};

exports.default = orchestratorPlugin;
module.exports = exports['default'];