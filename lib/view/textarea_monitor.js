var TextareaMonitor = function(el, callback) {
  this.el = el;
  this.callback = callback;
  this.resync();
};

TextareaMonitor.prototype.resync = function() {
  this.valLast = this.el.value;
};

TextareaMonitor.prototype.monitor = function() {
  // https://github.com/share/ShareJS/blob/master/lib/client/textarea.js#L26
  var applyChange = function(ctx, oldval, newval) {
    if (oldval === newval) return;

    var commonStart = 0;
    while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
      commonStart++;
    }

    var commonEnd = 0;
    while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
        commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
      commonEnd++;
    }

    if (oldval.length !== commonStart + commonEnd) {
      ctx.remove(commonStart, oldval.length - commonStart - commonEnd);
    }
    if (newval.length !== commonStart + commonEnd) {
      ctx.insert(commonStart, newval.slice(commonStart, newval.length - commonEnd));
    }
  };

  this.el.addEventListener("input", function(event) {
    var valNext = this.el.value;
    var ctx = {
      insert: function(pos, str) {
        for (var idx = 0; idx < str.length; idx++) {
          this.callback(["ins", pos + idx, str.slice(idx, idx + 1)]);
        } 
      }.bind(this),
      remove: function(pos, len) {
        for (var idx = len - 1; idx >= 0; idx--) {
          this.callback(["del", pos + idx + 1]);
        }
      }.bind(this)
    };
    applyChange(ctx, this.valLast, valNext);
    this.resync();
  }.bind(this));
};
