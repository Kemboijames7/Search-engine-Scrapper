const Redis = require('ioredis');
const redis = new Redis();

const QUEUE_KEY = 'search:queue';
const RESULT_KEY = 'search:result';

//Producer - add job to queue
async function enqueue(job) {
    job.id = Date.now();
    job.status = 'pending';
    await redis.lpush(  QUEUE_KEY, JSON.stringify(job));
    console.log('Job enqueued in queue to worker:', job.id);
    return job.id;
}

//Consumer - take job from queue
async function dequeue() {
    const data = await redis.rpop(QUEUE_KEY);
    return data ? JSON.parse(data) : null;
}


//Store result when job is done
async function storeResult(jobId, data) {
   await redis.set(`${RESULT_KEY}:${jobId}`, JSON.stringify(data), 'EX', 3600);
}

//Get result by jobId
async function getResult(jobId) {
    const data = await redis.get(`${RESULT_KEY}:${jobId}`);
    return data ? JSON.parse(data) : null;
}

//Queue size
async function size () {
    return await redis.llen(QUEUE_KEY)
}



module.exports = {enqueue, dequeue, storeResult, getResult, size};