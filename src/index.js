import 'babel-polyfill';
import _ from 'lodash';

const mongoose = require('mongoose');

import { getModelsBySchema } from './utils';

/**
 * Mongoose plugin to keep references to attributes synchronized.
 * @param  {Object} schema The original schema.
 */
const orchestratorPlugin = function(schema) {

  // Store a list of all the paths that needs to be synced.
  const modelsToSync = new Map();

  // Add the reference to the model.
  const addPathToSync = function(modelName, pathName, syncData) {
    // Get the model map and assign the new key.
    const modelMap = modelsToSync.has(modelName) ? modelsToSync.get(modelName) : new Map();
    modelMap.set(pathName, syncData);

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
        // TODO -- Throw error.
        new Error('ValidationError');
      }

      // Get the model and referenced attribute from the `ref`.
      const [model, attr] = schemaType.options.ref.split('.');

      // Get the source attribute where the `ObjectId` for the specified model.
      const source = schemaType.options.source || model.toLowerCase();

      // Build the object with the data so it can synchronize.
      const syncData = { attribute: attr, source: source };

      // Set the map for reference-to-attribute population.
      addPathToSync(model, pathName, syncData);
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
    const getReferenceInstances = (modelName) => {
      const ids = new Set();
      const select = new Set();

      for (let syncData of modelsToSync.get(modelName).values()) {
        // Get the reference to the specific document.
        const documentId = _.get(this, syncData.source);

        // Get the ids to fetch.
        ids.add(documentId);

        // Get the values to select from the paths to be synced list.
        select.add(syncData.attribute);
      }

      // Query the reference model.
      return mongoose.model(modelName)
        .find({_id: {$in: [...ids]}})
        .select([...select].join(' '))
        .exec();
    };

    /**
     * Set all the attributes for the current instance based on the
     * reference.
     * @param  {Object} reference
     * @return {Promise}
     */
    const setReferences = (modelName) => {
      return (references) => {

        // Get the paths to sync for the current instance.
        let pathsToSync = modelsToSync.get(modelName);

        // Iterate over all the paths to sync.
        for (let [ownPathToSync, syncData] of pathsToSync) {
          const {attribute: sourceAttribute, source: idSource} = syncData;

          // Get the corresponding reference based on the id.
          const sourceId = _.get(this, idSource);
          const reference = _.find(references, (reference) => {
            return reference._id.equals(sourceId);
          });

          // Copy the value of the reference attribute to the current instance.
          _.set(this, ownPathToSync, _.get(reference, sourceAttribute));
        }

        // Always resolve the promise.
        return Promise.resolve();
      };
    };

    // Set of promises of for populating all the instances.
    const promises = new Set();

    // Iterate over all the models that needs to be fetched.
    for (let modelName of modelsToSync.keys()) {
      // TODO -- Check if the instance is not new and no sync is required.
      // for(let attr of modelsToSync.get(modelName).keys()) {
      //   console.log(attr);
      // }

      // Get the reference and then set the attributes to the current instance.
      promises.add(
        getReferenceInstances(modelName).then(setReferences(modelName))
      );
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
    let pathsToSync = modelsToSync.get(sourceModelName);

    // Get the model needed to be updated.
    const targetModels = getModelsBySchema(schema);

    const promises = new Set();

    // Set an object with the attributes to be updated and their values.
    const toUpdate = new Map();

    // Iterate over all the paths to sync.
    for (let [targetAttribute, syncData] of pathsToSync) {
      const {attribute: sourceAttribute, source: idSource} = syncData;

      const toUpdateAttrs = toUpdate.get(idSource) || {};

      // Add the attribute to the update list if this was modified.
      if(this.isModified(sourceAttribute)) {
        const newValue = _.get(this, sourceAttribute);

        _.set(toUpdateAttrs, targetAttribute, newValue);
      }

      toUpdate.set(idSource, toUpdateAttrs);
    }


    for (let [key, update] of toUpdate) {
      const find = {}; find[key] = this._id;

      update = {$set: update};

      for (let targetModel of targetModels) {
        // Run the query to update those values.
        promises.add(targetModel.update(find, update, {multi: true}));
      }
    }

    return Promise.all(promises).then(done);
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
