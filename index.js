'use strict';

const Pusher = require('pusher'),
      AWS = require('aws-sdk'),      
      s3 = new AWS.S3();

const pusher = new Pusher({
    appId: process.env.pusherAppId,
    key: process.env.pusherKey,
    secret: process.env.pusherSecret,
    cluster: 'us2',
    encrypted: true
});

exports.handler = (event, context, callback) => {

  context.callbackWaitsForEmptyEventLoop = false;
  
        getS3Data()
        .then(sortKeys)
        .then((data) => {
        pusher.trigger('my-channel', 'my-event', data);
    })
};

function getS3Data()
{
    return new Promise((resolve,reject) => {
      
        let params = { 
            Bucket: 'adobe-mime',
            Delimiter: '/',
            Prefix: 'output/'
        }

        s3.listObjects(params,  (err, data) => {
            if(err) {
                reject(err);
            } else {          
                console.log(data.Contents);      
                resolve(data.Contents);
            }
        });
    });
}

function sortKeys(files)
{
    let videoObj = {};

    files.sort().reverse().forEach((file, i) => {

        let start_pos = file.Key.indexOf('/') + 1;
        let end_pos = file.Key.indexOf('-', start_pos);
        let videoId = file.Key.substring(start_pos,end_pos)

        if(!videoObj[videoId]) { 
            videoObj[videoId] = {};
        }

        if (file.Key.includes('thumb')){
            videoObj[videoId].s3keyThumbnail = file.Key.split('/')[1];
        } else if (file.Key.includes('videofile') && !file.Key.includes('.mov')){
            videoObj[videoId].s3keyVideo = file.Key.split('/')[1];
        }
    });

    return videoObj;
}
