// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
define(function(require, exports, module) {

var GUID = function GUID () {};
var exports = module.exports = GUID;

exports.prototype.create = function () {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
}

});
