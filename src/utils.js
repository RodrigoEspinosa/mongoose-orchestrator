const mongoose = require('mongoose');

/**
 * Join a iterator with given link or use ',' as default.
 * @param  {Object} iterator
 * @param  {String} link=',' [description]
 * @return {String}
 */
const joinIterator = (iterator, link=',') => Array.from(iterator).join(link);

/**
 * Get a Mongoose model based on the passed schema.
 * Returns the model contructor.
 * @param   {Object} schema
 * @return  {Object}
 */
const getModelBySchema = (schema) => {

  // Iterate over all the registered models.
  for(let modelKey in mongoose.models) {

    // Check if the current model matches the passed schema.
    if(mongoose.models[modelKey].schema == schema) {

      // Return the model constructor.
      return mongoose.models[modelKey];
    }
  }
};

export {joinIterator, getModelBySchema};
