'use strict';

const mongoose = require('mongoose');

/**
 * Join a iterator with given link or use ',' as default.
 * @param  {Object} iterator
 * @param  {String} link=',' [description]
 * @return {String}
 */
const joinIterator = (iterator, link=',') => Array.from(iterator).join(link);

/**
 * Mongoose plugin to keep references to attributes synchronized.
 * @param  {Object} schema The original schema.
 */
const orchestratorPlugin = function(schema) {

  // Store a list of all the paths that needs to be synced.
  const modelsToSync = new Map();

  // Add the reference to the model.
  const addPathToSync = function(modelName, pathName, referencedAttr) {
    // Get the model map and assign the new key.
    const modelMap = modelsToSync.has(modelName) ? modelsToSync.get(modelName) : new Map();
    modelMap.set(pathName, referencedAttr);

    modelsToSync.set(modelName, modelMap);
  };

  // Check if the check path has sync enabled for a specific schema.
  const hasSyncEnabled = function(pathName, schemaType) {
    return schemaType.options && schemaType.options.sync;
  };

  // Find every path that has a `sync` option.
  schema.eachPath((pathName, schemaType) => {
    if (hasSyncEnabled(pathName, schemaType)) {
      // Raise an error if the path does not has a reference, `ref` attribute.
      if (!schemaType.options.ref) {
        new Error('ValidationError'); // TODO
      }

      // Get the model and referenced attribute from the `ref`.
      const [model, attr] = schemaType.options.ref.split('.');

      // Set the map for reference-to-attribute population.
      addPathToSync(model, pathName, attr);
    }
  });


  /**
   * Pre-save flow for the instance that get-and-populate (sync)
   * each attribute that was required in the schema with the `sync` flag.
   * @param  {Function} done
   */
  const onPreSave = function(done) {

    /**
     * Get the instance of the requested model based on the
     * instance lowercased attribute.
     * @param  {String} modelName
     * @return {Promise}
     */
    const getReferenceInstance = (modelName) => {
      // Get the reference to the specific document.
      const documentId = this[modelName.toLowerCase()];

      // Get the values to select from the paths to be synced list.
      const select = joinIterator(modelsToSync.get(modelName).values());

      // Query the reference model.
      return mongoose.model(modelName).findById(documentId, select).exec();
    };

    // Set of promises of for populating all the instances.
    const promises = new Set();

    // Iterate over all the models that needs to be fetched.
    for (let modelName of modelsToSync.keys()) {
      /**
       * Set all the attributes for the current instance based on the
       * reference.
       * @param  {Object} reference
       * @return {Promise}
       */
      const setReferences = (reference) => {
        // Get the paths to sync for the current instance.
        let pathsToSync = modelsToSync.get(modelName);

        // Iterate over all the paths to sync.
        for (let [ownPathToSync, referenceAttr] of pathsToSync) {
          // Copy the value of the reference attribute to the current instance.
          this[ownPathToSync] = reference[referenceAttr];
        }

        // Always resolve the promise.
        return Promise.resolve();
      };

      // Get the reference and then set the attributes to the current instance.
      promises.add(getReferenceInstance(modelName).then(setReferences));
    }

    // Complete the `pre-save` after populating all attributes from all references.
    return Promise.all(promises).then(() => done()).catch(console.error);
  };

  // Set the `pre-save` hook on the current schema.
  schema.pre('save', onPreSave);

  // TODO -- Set the `post-save` hook on the referenced schemas.
};

module.exports = exports = orchestratorPlugin;
