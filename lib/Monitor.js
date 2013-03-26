var redis = require('redis');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var uuid = require('node-uuid');


function createClient(ip, opts, db){
  var client = redis.createClient(null, ip, opts);
  if(db){
    client.select(db, function(){
    return client;
    });
  }else{
    return client;
  }
}
//MessageWorker listens to the job List and emits works
//The jobs have the function reply which sends messages back to the requester
//

function QueueMonitor(opts){
  var self = this;
  this.queueName = opts.queueName;
  this.timeout = opts.timeout || 5000;
  this.monitorId =  uuid.v1();
  this.monitor = createClient();
}

util.inherits(QueueMonitor, EventEmitter);

QueueWorker.prototype.listen = function(){
  var self = this;
}

module.exports = QueueWorker;


