import _ from 'lodash';

const mongoose = require('mongoose');


/**
 * Get a Mongoose model based on the passed schema.
 * Returns the model contructor.
 * @param   {Object} schema
 * @return  {Object}
 */
const getModelsBySchema = (schema) => {

  // Iterate over all the registered models.
  return _.filter(mongoose.models, {schema: schema});

};

export { getModelsBySchema };
