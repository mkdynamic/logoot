var EventBus = function() {
  this.subscribers = [];
};

EventBus.prototype.publish = function(clientId, event) {
  // for (var idx = 0; idx < this.subscribers.length; idx++) {
  //   var subscriber = this.subscribers[idx]
  //   if (subscriber.clientId !== clientId) {
  //     var eventClone = JSON.parse(JSON.stringify(event));
  //     subscriber.callback(eventClone);
  //   }
  // }
  var body = JSON.stringify({ clientId: clientId, event: event });

  fetch('http://localhost:8080/snd', { method: 'POST', body: body });
};

EventBus.prototype.subscribe = function(clientId, callback) {
  // this.subscribers.push({ clientId: clientId, callback: callback });
  var body = JSON.stringify({ clientId: clientId });

  var poll = function() {
    fetch('http://localhost:8080/rcv', { method: 'POST', body: body })
      .then(function(res) {
        return res.json();
      })
      .then(function(msgs) {
        for (var idx = 0; idx < msgs.length; idx++) {
          var msg = msgs[idx];
          if (msg.clientId !== clientId) callback(msg.event);
        }
        window.setTimeout(poll, 500);
      });
  };

  poll();
};
