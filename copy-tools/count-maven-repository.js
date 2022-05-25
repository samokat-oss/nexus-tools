const fs = require('fs');


const {auth, run, dir, request, addError, errors, main, runSh, increaseCount, all, nexusHost} = require('./utils');

const url = nexusHost + '/service/rest/v1/search?repository=maven-central'

main(url, processChunk, () => {
    const allArray = Array.from(all.values());

    fs.writeFileSync('./maven-central.json', JSON.stringify(allArray, null, 2), 'utf8')
}).catch((e) => {
    console.log('\n\nMAIN ERROR', e);
});


async function processChunk(res, all) {

    increaseCount(res.items.length);

    await Promise.all(res.items.map(async (item) => {
        if (all.has(item.id)) {
            addError(new Error(`Повтор либы ${item.group} ${item.name} ${item.version}`));
        }

        all.set(item.id, item);
    }));

    console.log('ready part');
}


