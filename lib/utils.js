'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
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

exports.joinIterator = joinIterator;