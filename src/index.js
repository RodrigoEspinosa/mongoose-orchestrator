import 'babel-polyfill';

const mongoose = require('mongoose');

import {joinIterator, getModelBySchema} from './utils';

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
  const onSchemaPreSave = function(done) {

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


  /**
   * Post-save flow for the instance that modifies an
   * attribute is required to be `sync` by another schemas.
   */
  const onSourcePreSave = function(done) {
    // Get the model name from the instance.
    const sourceModelName = this.constructor.modelName;

    // Get the attributes to sync.
    let attrsToSync = modelsToSync.get(sourceModelName);

    // Get the model needed to be updated.
    const targetModel = getModelBySchema(schema);

    let sourceId = {};
    // TODO -- Should be dynamic.
    sourceId[sourceModelName.toLowerCase()] = this._id;

    // Set an object with the attributes to be updated and their values.

    const toUpdate = {};

    for(let [targetAttribute, sourceAttribute] of attrsToSync) {
      // Add the attribute to the update list if this was modified.
      if(this.isModified(sourceAttribute)) {
        toUpdate[targetAttribute] = this[sourceAttribute];
      }
    }

    // Check if there is anything to update.
    if (Object.keys(toUpdate).length) {
      // Run the query to update those values.
      targetModel.update(sourceId, toUpdate, done);
    } else {
      done(null, this);
    }
  };


  // Set the `pre-save` hook on the current schema.
  schema.pre('save', onSchemaPreSave);

  // Set the `pre-save` hook on the source schema.
  for (let sourceModel of modelsToSync.keys()) {
    // Get the source schema.
    let sourceSchema = mongoose.models[sourceModel].schema;

    // Attach the `post-save` hook.
    sourceSchema.pre('save', onSourcePreSave);
  }

};

export default orchestratorPlugin;
