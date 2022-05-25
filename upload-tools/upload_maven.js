const {runSh, assetsDir, auth, artifactsDir, downloadAsset, makeDirs} = require("./utils");
const path = require("path");

main().catch((e) => {
    console.log('Ошибка main', e);
});

async function main() {
    makeDirs();

    const uploadJsonFile = process.argv[3] ||
        path.join(artifactsDir, 'upload.json');

    const depsToUpload = require(uploadJsonFile);

    for (const item of depsToUpload) {
        const {group, name, version} = item;

        const groupDir = group.replace(/\./g, '/');
        const discoveryUrl =`https://repo1.maven.org/maven2/${groupDir}/${name}/${version}/`

        console.log('discoveryUrl', discoveryUrl);

        const html = runSh(`curl ${discoveryUrl}`, {
            cwd: process.cwd(),
            env: process.env,
            stdio: 'pipe',
            encoding: 'utf-8'
        }).stdout.trim();

        const urls = [];

        const fileName = `${name}-${version}`

        html.replace(/href="([^"]+)"/gi, function (...params) {
            const linkFileName = params[1] || '';


            if (!linkFileName.startsWith(fileName)) {
                return;
            }

            const other = linkFileName.slice(fileName.length);

            if (other.split('.').length > 2) {
                return;
            }

            const ext = other.split('.')[1];
            const classifier = other.split('.')[0].substr(1);

            urls.push({
                discoveryUrl,
                linkFileName,
                downloadUrl: discoveryUrl + linkFileName,
                classifier,
                ext,
                saveAssetPath: path.join(assetsDir, linkFileName)
            });
        });

        await Promise.all(urls.map(({downloadUrl, saveAssetPath}) => downloadAsset(downloadUrl, saveAssetPath)))


        const assetString = urls.map((urlInfo, i) => {
            const {classifier, ext, saveAssetPath} = urlInfo;

            return `-F "maven2.asset${i + 1}=@${saveAssetPath}` +
                `" -F "maven2.asset${i + 1}.extension=${ext}"` +
                (classifier ? ` -F maven2.asset${i + 1}.classifier=${classifier}` : '')
        }).join(' ')

        const res = [
            'curl -X POST -u',
            auth,
            '"https://nexus.samokat.io/service/rest/v1/components?repository=maven-central"',

            `-F "maven2.groupId=${group}"`,
            `-F "maven2.artifactId=${name}"`,
            `-F version=${version}`,
            `-F maven2.generate-pom=false`,

            assetString
        ].join(' ');


        runSh(res);

        console.log(group, name, version, 'Загружен\n');
    }

    console.log('\n ---ГОТОВО---');
}



