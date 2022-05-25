const {
    findPackages, makeInitFiles,
    makeNexusDependenciesList,
    getListOfNewDeps,
    checkDepsInBlacklist,
    processDependencies, dir, run, makeDirs, auth
} = require("./utils");
const path = require("path");
const fs = require("fs");
const {nexusHost} = require("../copy-tools/utils");

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

// тут можно ввести свои scoped пакеты, которые уже лежат в нексусе
    const npmrcContent = `
@myscope:registry=${nexusHost}/repository/nexus-npm

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


