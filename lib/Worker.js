var redis = require('redis');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var uuid = require('node-uuid');

var ip;

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
function MessageWorker(opts){
  var redishost = opts.redishost || null;
  var redisopts = opts.redisopts || null; 
  var redisdb = opts.redisdb || null;
  var self = this;
  this.queueName = opts.queueName || '';
  this.timeout = opts.timeout || 5000;
  this.workerId =  uuid.v1();
  this.publisher = createClient(redishost, redisopts, redisdb);
  this.subscriber = createClient(redishost, redisopts, redisdb);
  console.log('Message Worker ' + this.workerId + ' attached to message bus ' + this.queueName + 'JobQueue');
}
util.inherits(MessageWorker, EventEmitter);

MessageWorker.prototype.listen = function(){
  var self = this;
  self.subscriber.brpoplpush(self.queueName + 'JobQueue', self.queueName + 'WorkQueue', '0',
    function(err, evt){
      if(evt){
        //Create a job from the event, wrap queue delete logic on job
        var job = self.createJob(evt);
        self.emit('job', job);
      }
   self.listen();
  });
}

MessageWorker.prototype.createJob = function(jobString){
  var event = null;
  var self = this;
  //I always wrap code coming off the redis bus with this type of boilerplate
  //Its not needed after I remember to stringify on bot sides, but the error condition
  //should be handled better
  try{
    event = JSON.parse(jobString);
  }catch(e){
    console.log('parsing error... do you even stringify?');
  }

  var job = new Job(event);
  //create the clear work function for later so we don't have to store
  //the jobString anywhere else
  job.clearWorkQueue = function(){
    self.publisher.lrem([self.queueName + "WorkerQueue", "-1", jobString], function(e, r){
      console.log('removed ' + event.id + ' from workQueue');
    });
  }
  //Create the reply closure
  job.reply = function(res){
    console.log('publishing to ' + event.requester);
    var jobRes = { "reply"    : res,
                   "id"       : event.id,
                   "time"     : event.time,
                   "requester": event.requester };
    var jobThis = this;
    //Send response over the wire
    self.publisher.publish(event.requester, JSON.stringify(jobRes), function(){
      //Clear the worker Queue using the jobs this;
      jobThis.clearWorkQueue();
    });
  }
  return job;
}

function Job(request){
  this.data = request.request;
}

module.exports = MessageWorker;


