redis-jobs
==========

creates jobs and puts it on a reliable redis queue for workers


[![Build
Status](https://travis-ci.org/bryanpaluch/redis-jobs.png?branch=master)](https://travis-ci.org/bryanpaluch/redis-jobs)


Basic Usage

npm install redis-jobs

```javascript

var redisjobs = require('redis-jobs');
var queue = new redisjobs.Queue();

var job = queue.createJob({foo: 'bar'});

job.on('timeout', function(){
  console.log('request timed out on message bus');
});

job.on('reply', function(res){
 console.log(res);
});

job.start();



//On worker drone

var worker = new redisjobs.Worker();

worker.on('job', function(job){
  var res = job.data.foo + 'baz';
  job.reply(res);
});
```

Jobs are put onto a Redis List and popped off the list using BRPOPLPUSH; When a worker uses reply the message is deleted from the 
temporary work queue and sent over a publish message to the job
requester. This allows jobs to queue up but the responses will be
streamed back immediatly. Later releases will include a queue monitor
interface to handle automatic load scaling.


