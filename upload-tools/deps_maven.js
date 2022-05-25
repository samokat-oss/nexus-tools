const {
    findPackages, clear, makeInitFiles,
    installPackages, makeNexusDependenciesList,
    getListOfNewDeps,
    checkDepsInBlacklist,
    processDependencies,
    packageName,
    run, runSh, writeJson, request, assetsDir, auth
} = require("./utils");
const fs = require('fs');
const https = require("https");
const path = require("path");

main().catch((e) => {
    console.log('Ошибка main', e);
});

async function main() {
    clear();

    const template = fs.readFileSync('./template_build.gradle.kts', 'utf8');

    const replaceLibs = packageName.split(' ').map((name) => {

        return `api("${name.trim()}")`
    }).join('\n    ')

    const buildGradleFile = template.replace('__@dependencies__', replaceLibs);

    fs.writeFileSync('./build.gradle.kts', buildGradleFile, 'utf8');

    // ./gradlew dependencies | grep -v “Task “ | grep -v “ -> “ | grep -o “\S:\S:\S*” | sort | uniq >$ARTIFACTS/$output_file

    const res = runSh(
    './gradlew dependencies | grep -v "Task " | grep -v " -> " | grep -o "\\S*:\\S*:\\S*" | sort | uniq', {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe',
        encoding: 'utf-8'
    });

    const libs = res.stdout.trim();

    console.log(libs);



    const nexusDepsList = libs.split('\n').reduce((acc, str) => {
        if (str.trim()) {
            const parts = str.trim().split(':')

            acc.push({
                group: parts[0],
                name: parts[1],
                version: parts[2]
            });
        }

        return acc;
    }, [])

    writeJson('./artifacts/dependencies.json', nexusDepsList);

    clear();
    //
    // makeInitFiles();
    // installPackages();
    //
    // const foundPackages = findPackages();
    //
    // const nexusDepsList = makeNexusDependenciesList(foundPackages);
    //
    const newDeps = await getListOfNewDeps(nexusDepsList, [
        'maven-central',
        'maven-releases',
    ]);

    console.log('newDeps', newDeps);
    //
    //
    const {depsToUpload, blacklisted} = checkDepsInBlacklist(newDeps);

    if (blacklisted.length) {
        throw new Error('\n\nПодвезли наркоту!!! Валим! Смотрите в оба!')
    }

    const uploadFileName = './artifacts/upload.json';

    run('node', [
        'upload_maven.js',
        auth,
        uploadFileName
    ]);


    // console.log('\n ---ГОТОВО---');
}




