const fs = require('fs');

const path = require('path');
const https = require('https');
const {auth, run, dir, request, addError, errors, main, runSh, increaseCount} = require('./utils');

const url = 'https://nexus.samokat.io/service/rest/v1/search?repository=nexus-npm-proxy'

let count = 0;


main(url, processChunk).catch((e) => {
    console.log('\n\nMAIN ERROR', e);
});


async function processAsset(item) {
    return new Promise((resolve, reject) => {

        const downloadUrl = item.assets[0].downloadUrl
        const fileName = downloadUrl.split('/').reverse()[0];
        const fullPath = path.join(dir, fileName);

        const file = fs.createWriteStream(fullPath);

        console.log('asset', item.name);

        const request = https.get(downloadUrl, {
            auth,
        }, (response) => {
            response.pipe(file);

            // after download completed close filestream
            file.on("finish", () => {
                file.close();
                console.log("\nDownload Completed", downloadUrl);

                upload();
            });
        });

        function upload() {
            console.log('upload', fullPath);

            makeSh(fullPath);

            resolve();
        }
    });
}


async function processChunk(res, all) {
    run(`rm`, [`-rf`, dir]);
    run('mkdir', [dir]);

    increaseCount(res.items.length);

    await Promise.all(res.items.map(async (item) => {
        if (all.has(item.id)) {
            throw item.name;
        }

        all.set(item.id, item);

        await processAsset(item)
    }));

    console.log('ready part');
}


function makeSh(fullPath) {

    const res =
        `#!/bin/bash
         curl -X POST -u ${auth} "https://nexus.samokat.io/service/rest/v1/components?repository=nexus-npm-external" -H "accept: application/json" -H "Content-Type: multipart/form-data" -F "npm.asset=@${fullPath};type=application/x-gzip";`

    runSh(res);
}

module.exports = {
    processChunk
}

