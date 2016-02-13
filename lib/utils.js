'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
 * Get a Mongoose model based on the passed schema.
 * Returns the model contructor.
 * @param   {Object} schema
 * @return  {Object}
 */
var getModelBySchema = function getModelBySchema(schema) {

  // Iterate over all the registered models.
  for (var modelKey in mongoose.models) {

    // Check if the current model matches the passed schema.
    if (mongoose.models[modelKey].schema == schema) {

      // Return the model constructor.
      return mongoose.models[modelKey];
    }
  }
};

exports.joinIterator = joinIterator;
exports.getModelBySchema = getModelBySchema;