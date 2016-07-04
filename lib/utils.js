// Array.prototype.splice for Strings.
var stringSplice = function(str, start, deleteCount, item) {
  return str.slice(0, start) + (item || "") + str.slice(start + deleteCount);
};

// Generates a random integer in [lower, upper].
var genRandomIntExclusive = function(lower, upper) {
  if (upper - lower < 2) throw 'invalid bounds';
  var min = lower + 1;
  var max = upper - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
