const fs = require('fs');


const {auth, run, dir, request, addError, errors, main, runSh, increaseCount, all} = require('./utils');

const url = 'https://nexus.samokat.io/service/rest/v1/search?repository=nexus-npm-proxy'

main(url, processChunk, () => {
    const allArray = Array.from(all.values());

    fs.writeFileSync('./nexus-npm-proxy.json', JSON.stringify(allArray, null, 2), 'utf8')
}).catch((e) => {
    console.log('\n\nMAIN ERROR', e);
});

async function processChunk(res, all) {

    increaseCount(res.items.length);

    await Promise.all(res.items.map(async (item) => {
        if (all.has(item.id)) {
            addError(new Error(`Повтор либы ${item.group} ${item.name} ${item.version}`));
            // return;
            // throw item.name;
        }

        all.set(item.id, item);
    }));

    console.log('ready part');
}


