const fs = require('fs');
const childProcess = require("child_process");
const path = require("path");
const https = require("https");

const auth = process.argv[2] ||
    (fs.existsSync('../.samokatNexus') ? fs.readFileSync('../.samokatNexus', 'utf8').trim() : '');

const dir = path.join(__dirname, 'nexus');
const tokenFile = path.join(__dirname, 'token.txt');
const countFile = path.join(__dirname, 'count.txt');

const errors = [];
let count = 0;

const all = new Map();

module.exports = {
    auth,
    run,
    dir,
    request,
    addError,
    errors,
    runSh,
    main,
    count,
    increaseCount,
    all
}




async function main(url, processChunk, mainCb) {

    run(`rm`, [`-rf`, dir]);
    run('mkdir', [dir]);

    try {
        async function search(url, continuationToken, all, cb) {
            let res;
            try {
                res = await request(url + (continuationToken? '&continuationToken='+ continuationToken : ''));
            } catch (e) {
                addError(e);
                console.log('\n\n\nОшибка запроса', url, e.message);

                console.log('Повтор через секунду', e.message);

                setTimeout(() => {
                    search(url, continuationToken, all, cb)
                }, 1000)
                return;
            }

            await processChunk(res, all);

            if (res.continuationToken) {
                console.log('res.continuationToken', res.continuationToken);

                fs.writeFileSync(tokenFile, res.continuationToken, 'utf8');

                setImmediate(() => {
                    search(url, res.continuationToken, all, cb)
                })

            } else {
                cb();
            }
        }

        let token = ''
        if (fs.existsSync(tokenFile)) {
            token = fs.readFileSync(tokenFile, 'utf8');

            console.log('\nStart with Use token', token, '\n\n');
        }

        if (fs.existsSync(countFile)) {
            count = Number(fs.readFileSync(countFile, 'utf8')) || 0;

            console.log('\nStart with count', count, '\n\n');
        }

        await search(url, token, all, () => {

            run(`rm`, [`-rf`, tokenFile]);
            run(`rm`, [`-rf`, countFile]);

            console.log('\n\nerrors', errors);

            mainCb && mainCb(all);
        });
    } catch (e) {
        addError(e);
        console.log('e', e);
        console.log('\n\nerrors', errors);
    }
}

function increaseCount(val) {
    count += val;
    fs.writeFileSync(countFile, count + '', 'utf8');
    console.log('\ncount', count, val, '\n');
}

function addError(e) {
    errors.push(e.message);
    fs.writeFileSync('./errors.txt', JSON.stringify(errors, null, 2), 'utf8')
}


function request(url) {
    return new Promise((resolve, reject) => {

        try {
            const req = https.request(url, {
                auth,
            }, (res) => {

                let resStr = '';

                res.setEncoding('utf8');


                res.on('data', (chunk) => {
                    resStr += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(resStr))
                    } catch (e) {
                        console.log('resStr', resStr);
                        reject(e)
                    }
                });

            })

            req.on('error', (e) => {
                reject(e)
            });

            req.end();
        } catch (e) {
            console.log('ПИЗДЕЦ', e);
            reject(e)
        }

// Write data to request body
// req.write(postData);


    })

}


function runSh(code) {
    const shPath = path.join(dir, 'upload.sh');
    fs.writeFileSync(shPath, code)

    run('sh', [shPath]);
}

/**
 *
 * @param exec
 * @param [string[]] args
 * @param {SpawnSyncOptionsWithBufferEncoding} [options]
 * @return {SpawnSyncReturns<Buffer>}
 */
function run(exec, args = [], options) {
    args = [].concat(args);
    return childProcess.spawnSync(exec, args, {
        // stdio: [process.stdin, process.stdout, process.stderr],
        ...options
    });
}
