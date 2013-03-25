var assert = require('assert');
var mockery = require('mockery');
var fakeredis = require('fakeredis');
var redisjobs;
var queue;
var client = fakeredis.createClient();

describe('MessageQueue', function(){
  before(function(done){
    mockery.enable();
    mockery.registerMock('redis', fakeredis);
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    redisjobs = require('../index');
    done();
  });
  it('Constructor', function(done){
    queue = new redisjobs.Queue();
    assert.ok(queue);
    done();
  });
  it('MessageQueue.createJob(details) creates a job and returns it', function(done){
    var jobData = { foo: 'bar'};
    var job = queue.createJob(jobData);
    done();
  });
  it('Job.on(\'timeout\', function(){} will timeout after default 5000 ms', function(done){
    this.timeout(6000); 
    var jobData = { foo: 'bar'};
    var job = queue.createJob(jobData);
    job.on('timeout', function(){
      done();
    });
    job.start();
  });
  it('test', function(done){
    client.subscribe('blah', function(channel, msg){
      console.log(msg);
    });
    var client2 = fakeredis.createClient();
    client2.publish('blah', 'hi', function(){});

  });
  it('Job.on(\'reply\', function(){} will answer when the worker finishes a job', function(done){
    var jobData = { foo: 'bar'};
    var job = queue.createJob(jobData);
    job.on('reply', function(res){
      console.log(res);
      done();
    });
    console.log(job.req);
    var jobRes = { "reply"    : { foo: 'baz'},
                   "id"       : job.req.id,
                   "time"     : job.req.time,
                   "requester": job.req.requester };
    console.log(jobRes);
    job.start();
    console.log(queue.subscriber);
    queue.subscriber.pushMessage(job.req.requester, JSON.stringify(jobRes), function(){});

  });
});


