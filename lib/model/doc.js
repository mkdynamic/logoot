// Our replica of a document, with a list of 'items', in 'pid' order.
var Doc = (function() {
  var INT_MIN = 1; // avoid 0 to allow presence checking via a || b
  var INT_MAX = Math.pow(2, 53) - 1; // max safe int in JS
  var ITEM_BEGIN = [[INT_MIN, INT_MIN], null, '', INT_MIN]; // [ <pos(p, siteId)> <ts> <val> <siteId> ]
  var ITEM_END = [[INT_MAX, INT_MAX], null, '', INT_MAX];   //   |------- pid -------|

  var constructor = function(tag) {
    this.tag = tag;
    this.items = [ITEM_BEGIN, ITEM_END]; // must be kept in pid order
    this.string = ""; // hot copy of string
    this.index = {}; // hashItem(item) -> true
    this.version = {}; // siteId -> maxTs
  };

  var hashItem = function(item) {
    return item[0].join(',');
  };

  var compareItems = function(item_a, item_b) {
    var pos_a = item_a[0] || [];
    var pos_b = item_b[0] || [];
    var ts_a = item_a[1];
    var ts_b = item_b[1];
    var len_a = pos_a.length;
    var len_b = pos_b.length;

    for (var idx = 0, len = Math.min(len_a, len_b); idx < len; idx++) {
      var ydx = idx * 2;
      var zdx = ydx + 1;
      var p_a = pos_a[ydx];
      var p_b = pos_b[ydx];
      var siteId_a = pos_a[zdx];
      var siteId_b = pos_b[zdx];

      if (p_a < p_b || p_a === p_b && siteId_a < siteId_b) {
        return -1;
      } else if (p_a > p_b || p_a === p_b && siteId_a > siteId_b) {
        return 1;
      }
    }

    if (len_a < len_b || len_a === len_b && ts_a < ts_b) {
      return -1
    } else if (len_a > len_b || len_a === len_b && ts_a > ts_b) {
      return 1;
    } else {
      return 0;
    }
  };

  // Assumes a < b, and no c s.t. a < c & c < b.
  constructor.prototype.genPos = function(pos_a, pos_b, siteId) {
    var p_a = pos_a[0] || INT_MIN;
    var p_b = pos_b[0] || INT_MAX;
    var siteId_a = pos_a[1] || siteId;
    var siteId_b = pos_b[1] || siteId;

    if (p_a + 1 < p_b) { // space between p_a, p_b
      return [genRandomIntExclusive(p_a, p_b), siteId];
    } else if (p_a + 1 === p_b && siteId_a < siteId) { // no space, but siteId_a < siteId
      return [p_a, siteId];
    } else { // no space, recur right
      return [p_a, siteId_a].concat(this.genPos(pos_a.slice(2), pos_b.slice(2), siteId));
    }
  };

  constructor.prototype.getItem = function(idx) { // O(1)
    return this.items[idx + 1]; // account for invisible begin char 
  };

  constructor.prototype.containsItem = function(item) { // O(1)
    return hashItem(item) in this.index;
  };

  constructor.prototype.ins = function(item) {
    if (this.containsItem(item)) return true; // already applied

    var idx_prev = this.items.findIndex(function(item_i) {
      return compareItems(item_i, item) > -1;
    });

    var idx_next = idx_prev++;
    if (idx_next < 0) throw 'invalid item (prev not found)';

    this.items.splice(idx_next, 0, item);
    this.string = stringSplice(this.string, idx_next - 1, 0, item[2]);
    this.index[hashItem(item)] = true;

    var siteId = String(item[3]);
    var ts = item[1];
    this.version[siteId] = this.version[siteId] || 0;
    this.version[siteId] = Math.max(this.version[siteId], ts);

    return true;
  };

  constructor.prototype.del = function(item) {
    if (!this.containsItem(item)) return false; // already deleted or not yet present (consider as failure because caller should retry in case the char is not yet present)

    var idx = this.items.findIndex(function(item_i) {
      return compareItems(item_i, item) === 0;
    });

    this.items.splice(idx, 1);
    this.string = stringSplice(this.string, idx - 1, 1);
    delete this.index[hashItem(item)];

    return true;
  };

  constructor.prototype.reduce = function(reducer, initial) {
    return this.items.reduce(reducer, initial);
  };

  return constructor;
})();
