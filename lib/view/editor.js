var Editor = function(element, site, doc, eventBus) {
  var monitor = new TextareaMonitor(element, function(change) {
    var op;

    if (change[0] === "del") {
      op = site.genDel(doc, change[1]);
    } else {
      op = site.genIns(doc, change[1], change[2]);
    }

    site.rcvOp(doc, op, function() {
      eventBus.publish(site.id, { op: op });
    });
  });

  eventBus.subscribe(site.id, function(event) {
    site.rcvOp(doc, event.op, function() {
      element.value = doc.string;
      monitor.resync();
    });
  });

  element.value = doc.string;
  monitor.resync();
  monitor.monitor();
};
