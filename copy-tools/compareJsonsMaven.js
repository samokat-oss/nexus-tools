const mavenCentral = require('./maven-central.json');
const mavenCentralBackup = require('./maven-central-backup.json');
const fs = require("fs");

console.log('mavenCentral', mavenCentral.length);
console.log('mavenCentralBackup', mavenCentralBackup.length);


const mavenCentralPgs = mavenCentral.reduce((acc, {group, name, version}) => {
    acc.add(`${group}:${name}:${version}`)

    return acc;
}, new Set());

mavenCentralBackup.forEach(({group, name, version}) => {

    mavenCentralPgs.delete(`${group}:${name}:${version}`)

});
const empty = Array.from(mavenCentralPgs);

console.log('empty', empty.length);

const res = empty.join('\n')

empty.forEach((item) => {
    console.log(item);
})

fs.writeFileSync('./empty.txt', res, 'utf8')
