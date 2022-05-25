const fs = require('fs');

const path = require('path');
const https = require('https');

const {auth, run, dir, request, addError, errors, main, runSh, increaseCount, nexusHost} = require('./utils');

const fromRepository = nexusHost + '/service/rest/v1/search?repository=maven-central'
const toRepository = nexusHost + '/service/rest/v1/components?repository=maven-central-backup'

main(fromRepository, processChunk).catch((e) => {
    console.log('\n\nMAIN ERROR', e);
});

function makeSh({group, name, version, files}) {
    const assetString = files.map((filePath, i) => {
        const ext = filePath.split('.').reverse()[0];

        if (
            ext === 'sha1' ||
            ext === 'md5'
        ) {
            return '';
        }

        return `-F "maven2.asset${i + 1}=@${filePath}` +
                (ext === 'jar' ? ';type=application/java-archive' : '') +
                `" -F "maven2.asset${i + 1}.extension=${ext}"` +
                (filePath.includes('-sources') ? ' -F maven2.asset2.classifier=sources': '');
    }).join(' ');


    const res = [
        '#!/bin/bash\n\ncurl --silent -v -X POST -u',
        auth,
        `"${toRepository}"`,

        `-F "maven2.groupId=${group}"`,
        `-F "maven2.artifactId=${name}"`,
        `-F version=${version}`,
        `-F maven2.generate-pom=false`,

        assetString
    ].join(' ');

    runSh(res);
}

function processAsset(item) {

    const files = [];

    return Promise.all(item.assets.map(async (asset) => {
        const downloadUrl = asset.downloadUrl
        const fileName = downloadUrl.split('/').reverse()[0];
        const fullPath = path.join(dir, fileName);

        const file = fs.createWriteStream(fullPath);

        files.push(fullPath);

        try {
            await new Promise((resolve, reject) => {
                https.get(downloadUrl, {
                    auth,
                }, (response) => {
                    response.pipe(file);

                    // after download completed close filestream
                    file.on("finish", () => {
                        file.close();
                        console.log("Download Completed", downloadUrl);

                        resolve();
                    });
                });
            })
        } catch (e) {
            addError(e);
            console.log('\n\n\nERROR', e);
        }

    })).then(() => {
        if (files.length) {
            makeSh({
                group: item.group,
                name: item.name,
                version: item.version,
                files
            });
        }
    });
}


async function processChunk(res, all) {
    run(`rm`, [`-rf`, dir]);
    run('mkdir', [dir]);

    increaseCount(res.items.length);

    await Promise.all(res.items.map(async (item) => {
        if (all.has(item.id)) {
            addError(new Error(`Повтор либы ${item.group} ${item.name} ${item.version}`));
        }

        all.set(item.id, item);

        await processAsset(item);
    }));

    console.log('ready part');
}


