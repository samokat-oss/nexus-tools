const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');

const packageName = process.argv.slice(3).join(' ');
const resultFile = process.argv[2] || 'result.json';

console.log('Package names:', packageName);

const pjName ='package.json';
const dir = path.join(__dirname, 'temp');
const nmDir = makeNmDir(dir);
const pjFile = path.join(dir, pjName);
const npmrcFile = path.join(dir, '.npmrc');
// const resultFile = path.join(dir, 'result.json');

/**
 * @type {Map<string, Set<string>>}
 */
const res = new Map();

const r = {};
const rs = [];



run(`rm`, [`-rf`, dir]);
run('mkdir', [dir]);

fs.writeFileSync(pjFile, JSON.stringify({
    "name": "package-checker",
    "version": "1.0.0"
}, null, 2));

fs.writeFileSync(npmrcFile, 'save-exact=true\n');

run('npm' ,['install', ...packageName.split(' ')], {
    cwd: dir
});


look(nmDir);


res.forEach((value, key) => {
    r[key] = Array.from(value);


    Array.from(value).forEach((version) => {
        let pg = [];
        try {
            pg = key.split('/');
        } catch (e) {
            console.log('Error', key, value);
        }

        if (pg.length > 1) {
            pg[0] = pg[0].replace(/^@/, '');
        } else {
            pg = ['', pg[0]];
        }

        rs.push(`${pg[0]}:${pg.slice(1).join(':')}:${version}`)
    })

    // rs.push(`${key}=${Array.from(value).join(' | ')}`)
})

console.log(rs.join('\n'));

// fs.writeFileSync(resultFile, JSON.stringify(r, null, 2));
fs.writeFileSync(resultFile, rs.join('\n') + '\n');

console.log('Результат в файле', resultFile);

// ---------------------------

function makeNmDir(dir) {
    return path.join(dir, 'node_modules');
}

function look(dir) {

    eachFileInDir(dir, (file, pathFromDir) => {
        if (isDirectory(pathFromDir)) {
            look(pathFromDir);
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
                    if (!res.has(name)) {
                        res.set(name, new Set());
                    }

                    res.get(name).add(version);
                } catch (e) {
                    console.log('\n---\nОшибка в файле', '\n', e.message, '\n');
                }
            }
        }
    })
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
 * @callback IEachFileInDirCb
 * @param {string} file
 * @param {string} pathFromDir
 * @return {any}
 */


/**
 *
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
 *
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
 *
 * @param {string} dir
 * @param {...string[]} str
 * @return {string}
 */
function pathFromDir(dir, ...str) {
    return path.join(dir, ...(str.map(s=>(''+s))));
}


/**
 *
 * @param {string} filename
 * @return {boolean}
 */
function isDirectory(filename) {
    if (fs.existsSync(filename)) {
        return fs.statSync(filename).isDirectory();
    }

    return false;
}
