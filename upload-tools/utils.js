const fs = require('fs');
const childProcess = require("child_process");
const path = require("path");
const https = require("https");
const {Version} = require("./Version");

const auth = (fs.existsSync('../.samokatNexus') ?
        fs.readFileSync('../.samokatNexus', 'utf8').trim() : ''
    ) || process.argv[2];

const packageName = process.argv.slice(3).join(' ');

const dir = path.join(__dirname, 'temp');
const assetsDir = path.join(dir, 'assets');
const artifactsDir = path.join(__dirname, 'artifacts');
const nmDir = makeNmDir(dir);
const pjName ='package.json';


const logToFile = true;


/**
 * @returns {Map<string, Set<string>>}
 */
function findPackages() {

    /**
     * @type {Map<string, Set<string>>}
     */
    const foundPackages = new Map();

    look(nmDir, foundPackages);

    return foundPackages;
}

/**
 * @param {string} dir
 * @param {Map<string, Set<string>>} foundPackages
 */
function look(dir, foundPackages) {

    eachFileInDir(dir, (file, pathFromDir) => {
        if (isDirectory(pathFromDir)) {
            look(pathFromDir, foundPackages);
        }
        else {
            if (file === pjName) {
                try {
                    const pj = require(pathFromDir);
                    const name = pj.name;
                    if (!name) {
                        return;
                    }

                    const version = pj.version;
                    if (!version) {
                        return;
                    }

                    // if (version === '0.0.0') {
                    //     return;
                    // }

                    if (!foundPackages.has(name)) {
                        foundPackages.set(name, new Set());
                    }

                    foundPackages.get(name).add(version);
                } catch (e) {
                    console.log('\n---\nОшибка в файле', '\n', e.message, '\n');
                }
            }
        }
    })
}


/**
 *
 * @param {Map<string, Set<string>>} foundPackages
 * @returns {{ group: string, name: string, version: string}[]}
 */
function makeNexusDependenciesList(foundPackages) {

    const deps = [];

    foundPackages.forEach((value, key) => {

        Array.from(value).forEach((version) => {
            let pg = [];
            try {
                pg = key.split('/');
            } catch (e) {
                console.log('Error', key, value);
            }

            if (pg.length > 2) {
                return;
            }

            if (pg.length > 1) {
                pg[0] = pg[0].replace(/^@/, '');
            } else {
                pg = ['', pg[0]];
            }

            const group = pg[0];
            const name = pg.slice(1).join('/');


            deps.push({
                group,
                name,
                version
            });
        })

    });

    writeJson('./artifacts/dependencies.json', deps);

    return deps;
}


function clear() {
    run(`rm`, [`-rf`, dir]);
    makeDirs();
}

function makeDirs() {
    if (!fs.existsSync(dir)) run('mkdir', [dir]);
    if (!fs.existsSync(assetsDir)) run('mkdir', [assetsDir]);
    if (!fs.existsSync(artifactsDir)) run('mkdir', [artifactsDir]);
}

function makeInitFiles() {
    const pjFile = path.join(dir, pjName);
    const npmrcFile = path.join(dir, '.npmrc');


    writeJson(pjFile, {
        "name": "package-checker",
        "version": "1.0.0"
    })

    fs.writeFileSync(npmrcFile, 'save-exact=true\n', 'utf8');
}

function installPackages() {

    console.log('Устанавливаем пакеты:\n', `'${packageName}'`);
    run('npm' ,['install', '--ignore-scripts', ...packageName.split(' ')], {
        cwd: dir
    });
}

/**
 *
 * @param {{ group: string, name: string, version: string}[]} deps
 * @param {string[]} [repo]
 * @returns {Promise<{ group: string, name: string, version: string}[]>}
 */
async function getListOfNewDeps(deps, repo = ['nexus-npm-group']) {
    const newDeps = [];
    // const exists = [];

    for (const item of deps) {

        const {group, name, version} = item;

        let counter = 0;

        await Promise.all(repo.map(async (repoName) => {
            await request(`https://nexus.samokat.io/service/rest/v1/search?repository=${repoName}&group=${group}&name=${name}&version=${version}`, true).then((res) => {

                const realItems = res.items.filter((item) => (
                    item.group == (group || null) &&
                    item.name == name &&
                    item.version == version
                ));

                if (realItems.length) {
                    counter++;
                }
            });
        }))

        if (!counter) {
            newDeps.push(item)
        } else {
            // exists.push(item)
            console.log('Уже закачано', group, name, version);
        }
    }

    writeJson(path.join(artifactsDir, 'new.json'), newDeps);

    return newDeps;
}

/**
 * @returns {Object<string,{name: string, from: string, to: string}>}
 */
function getBlacklistMap() {
    /**
     *
     * @type {{name: string, from: string, to: string}[]}
     */
    const blacklist = require("./blacklist.json");

    return blacklist.reduce((acc, item) => {
        acc[item.name] = item;
        return acc;
    }, {});
}

/**
 * @param {{ group: string, name: string, version: string}[]} newDeps
 * @returns {{blacklisted: { group: string, name: string, version: string}[], depsToUpload: { group: string, name: string, version: string}[]}}
 */
function checkDepsInBlacklist(newDeps) {
    const blacklistMap = getBlacklistMap();

    /**
     * @type {{ group: string, name: string, version: string}[]}
     */
    const depsToUpload = [];
    /**
     * @type {{ group: string, name: string, version: string}[]}
     */
    const blacklisted = [];

    newDeps.forEach((item) => {
        const {group, name, version} = item;
        const blName = `${group}:${name}`;
        const blItem = blacklistMap[blName];

        if (blItem) {
            const v = new Version(version);

            if (
                v.compare(new Version(blItem.from)) > -1 &&
                v.compare(new Version(blItem.to)) < 1
            ) {
                blacklisted.push(item);
                return;
            }

        }

        depsToUpload.push(item)
    });

    function list(items) {
        return items.map(({group, name, version}) => {
            return `${group} ${name} ${version}`
        }).join('\n')
    }

    if (blacklisted.length) {
        writeJson('./artifacts/blacklisted.json', blacklisted);
        console.log('\nЗапрещенка\n', list(blacklisted));
    }

    if (depsToUpload.length) {
        writeJson('./artifacts/upload.json', depsToUpload);
        console.log('\nМожно догрузить\n', list(depsToUpload));
    }

    console.log('\n');

    return {depsToUpload, blacklisted};
}

/**
 * @param {{ group: string, name: string, version: string}[]} canUpload
 * @returns {Promise<void>}
 */
async function processDependencies(canUpload) {
    for (let item of canUpload) {
        const {group, name, version} = item;
        let npmPackageName = name + '@' + version;

        if (group) {
            npmPackageName = '@' + group + '/' + npmPackageName;
        }

        console.log('\nОбрабатываем пакет', npmPackageName);

        const res = run('npm', ['view', npmPackageName, 'dist.tarball'], {
            cwd: process.cwd(),
            env: process.env,
            stdio: 'pipe',
            encoding: 'utf-8'
        });

        const downloadUrl = res.stdout.trim();

        if (!downloadUrl) {
            console.log('Пакет не найден\n');
            continue;
        }

        console.log('downloadUrl', downloadUrl);

        const fileName = downloadUrl.split('/').reverse()[0];
        const saveAssetPath = path.join(assetsDir, fileName);


        try {
            await downloadAsset(downloadUrl, saveAssetPath);
            uploadByShScript(saveAssetPath);
        } catch (e) {
            console.log('Ошибка скачивания файла\n', e.message);
        }

    }
}

/**
 * @param {string} downloadUrl
 * @param {string} saveAssetPath
 * @returns {Promise<unknown>}
 */
async function downloadAsset(downloadUrl, saveAssetPath) {
    return new Promise((resolve, reject) => {
        try {
            const request = https.get(downloadUrl, {}, (response) => {
                const file = fs.createWriteStream(saveAssetPath);
                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    console.log("Скачан", downloadUrl);

                    resolve();
                });
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * @param {string} fullPath
 */
function uploadByShScript(fullPath) {
    const res = `curl -X POST -u ${auth} "https://nexus.samokat.io/service/rest/v1/components?repository=nexus-npm-external" -H "accept: application/json" -H "Content-Type: multipart/form-data" -F "npm.asset=@${fullPath};type=application/x-gzip";`

    runSh(res);

    console.log('Загружен');
}



//------------------------------------------//


/**
 * @callback IEachFileInDirCb
 * @param {string} file
 * @param {string} pathFromDir
 * @return {any}
 */


/**
 * @param {string} dir
 * @return {string[]}
 */
function dirList(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir);
}


/**
 * @param {string} dir
 * @param {IEachFileInDirCb} fn
 * @return {any[]}
 */
function eachFileInDir(dir, fn) {
    const list = dirList(dir);
    return (list || []).map((file) => {
        return fn(file, pathFromDir(dir, file));
    });
}

/**
 * @param {string} dir
 * @param {...string[]} str
 * @return {string}
 */
function pathFromDir(dir, ...str) {
    return path.join(dir, ...(str.map(s=>(''+s))));
}


/**
 * @param {string} filename
 * @return {boolean}
 */
function isDirectory(filename) {
    if (fs.existsSync(filename)) {
        return fs.statSync(filename).isDirectory();
    }

    return false;
}

/**
 * @param {string} name
 * @param {*} data
 */
function writeJson(name, data) {
    fs.writeFileSync(name, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * @param {string} url
 * @param {boolean} [json]
 * @returns {Promise<object>}
 */
function request(url, json) {
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
                        if (json) {
                            resolve(JSON.parse(resStr))
                        } else {
                            resolve(resStr)
                        }
                    } catch (e) {
                        console.log('Ошибка запроса', url, '\n', resStr);
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
    });
}

/**
 * @param {string} code
 * @param {object} [options]
 */
function runSh(code, options) {
    const shPath = path.join(__dirname, 'script.sh');
    fs.writeFileSync(shPath, `#!/bin/bash\n${code}`);

    return run('sh', [shPath], options);
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
        stdio: [process.stdin, process.stdout, process.stderr],
        ...options
    });
}

/**
 * @param {string} dir
 * @returns {string}
 */
function makeNmDir(dir) {
    return path.join(dir, 'node_modules');
}



module.exports = {
    downloadAsset,
    artifactsDir,
    packageName,
    processDependencies,
    checkDepsInBlacklist,
    getBlacklistMap,
    getListOfNewDeps,
    makeNexusDependenciesList,
    installPackages,
    makeInitFiles,
    clear,
    findPackages,
    writeJson,
    look,
    auth,
    run,
    dir,
    request,
    runSh,
    assetsDir,
    makeDirs
}
