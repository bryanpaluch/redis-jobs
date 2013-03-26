var redis = require('redis');
var uuid = require('node-uuid');
var util = require('util');
var EventEmitter = require('events').EventEmitter;


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
//MessageQueue manages the jobs on the job queue, and their timeouts
//it can also give feedback on the performance of the worker cluster
function MessageQueue(opts){
  var opts = opts || {};
  var redishost = opts.redishost || null;
  var redisopts = opts.redisopts || null; 
  var redisdb = opts.redisdb || null;
  var self = this;
  this.queueName = opts.queueName || '';
  this.requestTimers = {};
  this.jobs = {};
  this.timeout = opts.timeout || 5000;
  this.requesterId =  uuid.v1();
  this.publisher = createClient(redishost, redisopts);
  this.subscriber = createClient(redishost, redisopts);
  //Replies come over a redis PUB/SUB
  this.subscriber.on('message', function(channel, message){
    var res = null; 
    try{
      res = JSON.parse(message);
    }catch(e){
      console.log('parsing error, do you even stringify?');
    }
    if(self.requestTimers[res.id]){
      clearTimeout(self.requestTimers[res.requestId]);
      delete self.requestTimers[res.requestId];
    }
    //Do some generic time reporting for computing performance averages later
    if(res.time){
      var end = new Date().getTime();
      var delta = ( end - res.time );
      util.log('request took ' + delta + ' ms');
    }
    //remove redis request/reply/event wrapper and emit
    if(self.jobs[res.id]){
      self.jobs[res.id].reply(res.reply);
      delete self.jobs[res.id];
    }else{
      console.log('unknown job id');  
    }

  });
  //Replies come back over the requesterId channel of the instance of mq
  //This is a less reliable interface than BRPOPLPUSH but its just a message and shouldn't blow up anything.
  this.subscriber.subscribe(this.requesterId);
}
//Creates a job and returns a promise like Object for listening to events from
//message bus and for starting the job
MessageQueue.prototype.createJob = function(jobData){
  var id = uuid.v1();
  var time = new Date().getTime();
  var req = {id: id, request: jobData, 
             time: time, requester: this.requesterId};
  var job = new Job(req);
  var self = this;
  job.start = function(){
    self.requestTimers[id] = setTimeout(function(){
      job.timeout();
    },self.timeout);
    self.publisher.rpush(self.queueName + 'JobQueue', JSON.stringify(this.req), function(){
    });
  }
  this.jobs[id] = job;
  return job;
}

function Job(request){
  this.req = request;
}
util.inherits(Job, EventEmitter);

Job.prototype.timeout = function (){
  this.emit('timeout');
  //Clear any other listeners to avoid a mem leak.
  this.removeAllListeners();
}

Job.prototype.reply = function (msg){
  this.emit('reply', msg);
  //Clear any other listeners to avoid a mem leak.
  this.removeAllListeners();
}

module.exports = MessageQueue;


