var redisjobs = require('../index');
var assert = require('assert');

describe('MessageQueue', function(){
  it('Constructor', function(done){
    var queue = new redisjobs.Queue();
    assert.ok(queue);
    done();
  });
  it('MessageQueue.createJob(details) creates a job and returns it', function(done){
    var queue = new redisjobs.Queue();
    var jobData = { foo: 'bar'};
    var job = queue.createJob(jobData);
    console.log(job);
    done();
  });
});


