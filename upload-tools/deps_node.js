const {
    findPackages, clear, makeInitFiles,
    installPackages, makeNexusDependenciesList,
    getListOfNewDeps,
    checkDepsInBlacklist,
    processDependencies
} = require("./utils");

main().catch((e) => {
    console.log('Ошибка main', e);
});

async function main() {
    clear();

    makeInitFiles();
    installPackages();

    const foundPackages = findPackages();

    const nexusDepsList = makeNexusDependenciesList(foundPackages);

    const newDeps = await getListOfNewDeps(nexusDepsList);


    const {depsToUpload} = checkDepsInBlacklist(newDeps)

    await processDependencies(depsToUpload);

    console.log('\n ---ГОТОВО---');
}


