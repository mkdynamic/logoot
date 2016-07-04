// Sites represent sessions, and generate ops against a local document replica.
// Received ops are applied to the replica in way that maintains casual relations.
var Site = (function() {
  var CLOCK_INTIAL = 1; // avoid 0

  var constructor = function(id) {
    this.id = id;
    this.clock = CLOCK_INTIAL;
    this.pending = [];
  };

  var getVersion = function(doc) {
    return Object.assign({}, doc.version);
  };

  var compareVersions = function(v_a, v_b, siteId_src) {
    var eq = 0;

    if (typeof v_a[siteId_src] === "undefined") {
      return -1; // initial op
    }

    for (var siteId_a in v_a) {
      var ts_a = v_a[siteId_a];
      var ts_b = v_b[siteId_a];

      if (ts_a < ts_b) {
        return -1;
      } else if (ts_a == ts_b) {
        eq++;
      }
    }

    if (eq === Object.keys(v_a).length) {
      return 0;
    } else {
      return 1;
    }
  };

  var canApplyOp = function(doc, op, sid) {
    // if (op[0] === 'del') return true;
    var v_op = op[2];
    var v_doc = getVersion(doc);
    return compareVersions(v_op, v_doc, op[1][3]) <= 0;
  };

  // Returns true is op successfully applied, false otherwise (retry later).
  var applyOp = function(doc, op, sid) {
    if (canApplyOp(doc, op, sid)) {
      return doc[op[0]](op[1]);
    } else {
      return false;
    }
  };

  constructor.prototype.getTs = function() {
    return this.clock++;
  };

  constructor.prototype.genIns = function(doc, idx, val) {
    var idx_prev = idx - 1;
    var idx_next = idx;
    var item_prev = doc.getItem(idx_prev); // find item id in doc before idx
    var item_next = doc.getItem(idx_next); // find item id in doc after idx (at insertion slot)
    var pos = doc.genPos(item_prev[0], item_next[0], this.id);
    var ts = this.getTs(); // generate a new item id inbetween (will increment clock)
    var item = [pos, ts, val, this.id];
    var v = getVersion(doc);
    return ['ins', item, v]; // return the op
  };

  constructor.prototype.genDel = function(doc, idx) {
    var item = doc.getItem(idx - 1); // find item of the element at idx
    var v = getVersion(doc);
    return ['del', item, v]; // return the op
  };

  constructor.prototype.flushPending = function() {
    var job;
    var remaining = [];
    while (job = this.pending.shift()) {
      if (applyOp(job.doc, job.op, this.id)) {
        if (job.callback) job.callback();
      } else {
        remaining.push(job);
      }
    }

    if (remaining.length > 0) {
      this.pending = remaining;
      window.clearTimeout(this.pendingTimeout);
      this.pendingTimeout = window.setTimeout(this.flushPending.bind(this), 500);
    }
  };

  constructor.prototype.rcvOp = function(doc, op, callback) {
    this.pending.push({ doc: doc, op: op, callback: callback });
    this.flushPending();
  };

  return constructor;
})();
