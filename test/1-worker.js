var assert = require('assert');
var redis = require('redis');
var redisjobs = require('../index.js');
var queue = new redisjobs.Queue();

var worker;
describe('MessageWorker', function(){
  before(function(done){
    var client = redis.createClient();
    client.flushall(); 
    done();
  });
  it('Constructor', function(done){
    worker = new redisjobs.Worker();
    assert.ok(worker);
    done();
  });
  var request;
  it('Worker.on(\'job\', function(job)), job has a reply function and data', function(done){
    worker.once('job', function(req){
      request = req;
      assert.ok(req.reply);
      assert.ok(req.data);
      done();
    });
    worker.listen();
    var jobRes = { "request"    : { foo: 'baz'},
                   "id"       : "6c84fb90-12c4-11e1-840d-7b25c5ee775a",
                   "time"     : new Date().getTime(),
                   "requester" : "110ec58a-a0f2-4ac4-8393-c866d813b8d1" }
    var client = redis.createClient(); 
    client.rpush('JobQueue', JSON.stringify(jobRes), function(){});
  });
  it('job reply function sends a publish back to the requester id channel', function(done){
    var client = redis.createClient(); 
    client.on('message', function(channel, message){
      done();
    });
    client.subscribe( "110ec58a-a0f2-4ac4-8393-c866d813b8d1", function(){
      request.reply({foo: 'bar'});
    });               
  });
});
