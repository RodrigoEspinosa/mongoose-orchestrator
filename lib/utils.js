'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getModelsBySchema = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mongoose = require('mongoose');

/**
 * Get a Mongoose model based on the passed schema.
 * Returns the model contructor.
 * @param   {Object} schema
 * @return  {Object}
 */
var getModelsBySchema = function getModelsBySchema(schema) {

  // Iterate over all the registered models.
  return _lodash2.default.filter(mongoose.models, { schema: schema });
};

exports.getModelsBySchema = getModelsBySchema;