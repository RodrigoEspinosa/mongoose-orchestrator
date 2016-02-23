const mongoose = require('mongoose');

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

export { getModelBySchema };
