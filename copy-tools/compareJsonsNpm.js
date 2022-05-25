const proxy = require('./proxy.json');
const external = require('./external.json');
const fs = require("fs");
// const {processChunk} = require("./copy-npm-repository");

console.log('proxy', proxy.length);
console.log('external', external.length);


const proxyPkgs = proxy.reduce((acc, item) => {
    const {group, name, version} = item;
    acc.set(`${group === null ? '' : group}:${name}:${version}`, item)

    return acc;
}, new Map());

const externalPkgs = new Map();

external.forEach((item) => {
    const {group, name, version} = item;

    const pname = `${group === null ? '' : group}:${name}:${version}`;
    if (proxyPkgs.has(pname)) {
        proxyPkgs.delete(pname)
    } else {
        externalPkgs.set(pname, item);
    }

});
const empty = Array.from(proxyPkgs.keys());

console.log('Не хватает в бекапе', empty.length);
console.log('Не хватает в прокси', externalPkgs.size);

const res = empty.join('\n')

empty.forEach((item) => {
    console.log(item);
});

fs.writeFileSync('./npm-empty.txt', res, 'utf8')

// processChunk({
//     items: Array.from(proxyPkgs.values())
// }, new Map());
