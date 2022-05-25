const {
    findPackages, makeInitFiles,
    makeNexusDependenciesList,
    getListOfNewDeps,
    checkDepsInBlacklist,
    processDependencies, dir, run, makeDirs, auth
} = require("./utils");
const path = require("path");
const fs = require("fs");

main().catch((e) => {
    console.log('Ошибка main', e);
});

// Работаем с целым package.json файлом из проекта
async function main() {

    makeDirs();
    makeInitFiles();

    const prDir = process.argv[3];

    fs.copyFileSync(path.join(prDir, 'package.json'), path.join(dir, 'package.json'));
    // fs.copyFileSync(path.join(prDir, 'package-lock.json'), path.join(dir, 'package-lock.json'));


    const npmrcContent = `
@my-samokat:registry=https://nexus.samokat.io/repository/nexus-npm
@samokat:registry=https://nexus.samokat.io/repository/nexus-npm
@logistics:registry=https://nexus.samokat.io/repository/nexus-npm
@core-colibri:registry=https://nexus.samokat.io/repository/nexus-npm
@timelabse:registry=https://nexus.samokat.io/repository/nexus-npm
@srp:registry=https://nexus.samokat.io/repository/nexus-npm
save-exact=true
_auth=${Buffer.from(auth).toString('base64')}
    `

    const npmrcFile = path.join(dir, '.npmrc');

    fs.writeFileSync(npmrcFile, npmrcContent, 'utf8');

    run('npm', ['i'], {
        cwd: dir
    });

    const foundPackages = findPackages();

    const nexusDepsList = makeNexusDependenciesList(foundPackages);

    const newDeps = await getListOfNewDeps(nexusDepsList);


    const {depsToUpload} = checkDepsInBlacklist(newDeps)

    await processDependencies(depsToUpload);

    console.log('\n ---ГОТОВО---');
}


