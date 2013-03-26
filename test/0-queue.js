var assert = require('assert');
var redis = require('redis');
var redisjobs = require('../index.js');
var queue = new redisjobs.Queue();

describe('MessageQueue', function(){
  before(function(done){
    var client = redis.createClient();
    client.flushall(); 
    done();
  });
  it('Constructor', function(done){
    queue = new redisjobs.Queue({timeout: 1000});
    assert.ok(queue);
    done();
  });
  it('MessageQueue.createJob(details) creates a job and returns it', function(done){
    var jobData = { foo: 'bar'};
    var job = queue.createJob(jobData);
    done();
  });
  it('Job.on(\'timeout\', function(){} will timeout after timeout value that was set', function(done){
    this.timeout(6000); 
    var jobData = { foo: 'bar'};
    var job = queue.createJob(jobData);
    job.on('timeout', function(){
      done();
    });
    job.start();
  });
  it('Job.on(\'reply\', function(){} will answer when the worker finishes a job', function(done){
    var jobData = { foo: 'bar'};
    var job = queue.createJob(jobData);
    job.on('reply', function(res){
      assert.equal(res.foo, 'baz');
      done();
    });
    var jobRes = { "reply"    : { foo: 'baz'},
                   "id"       : job.req.id,
                   "time"     : job.req.time,
                   "requester": job.req.requester };
    job.start();
    setTimeout(function(){
      var client = redis.createClient();
      client.publish(job.req.requester, JSON.stringify(jobRes), function(){});
    }, 50);
  });
});

