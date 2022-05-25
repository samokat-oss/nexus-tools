const {run, auth, request} = require("./utils");
const pjContent = {
        "name": "buyk-sam",
        "version": "1.1.0",
        "private": true,
        "scripts": {
            "init": "npm i && git submodule update --init --recursive && cp .env.example .env.development && npm run husky",
            "start": "react-app-rewired start",
            "build": "react-app-rewired build",
            "test": "react-app-rewired test",
            "test:ci": "CI=true react-app-rewired test",
            "husky": "husky install src/common/infra/.husky",
            "storybook": "start-storybook -p 6006 -s public",
            "build-storybook": "build-storybook -s public",
            "gql:codegen": "dotenv -e .env.development -- graphql-codegen",
            "gql:codegen:download": "dotenv -e .env.development -- graphql-codegen --config codegen.download.yml"
        },
        "dependencies": {
            "@2gis/mapgl": "1.25.0",
            "@airbrake/browser": "2.1.5",
            "@apollo/client": "3.5.8",
            "@mapbox/mapbox-gl-draw": "1.3.0",
            "@mapbox/mapbox-gl-geocoder": "4.7.4",
            "@mapbox/mapbox-sdk": "0.13.2",
            "@turf/turf": "6.5.0",
            "classnames": "2.3.1",
            "date-fns": "2.27.0",
            "date-fns-tz": "1.1.6",
            "file-saver": "2.0.5",
            "fuzzy": "0.1.3",
            "graphql": "15.5.1",
            "i18next": "20.3.0",
            "i18next-browser-languagedetector": "6.1.2",
            "immutability-helper": "3.1.1",
            "lodash": "4.17.21",
            "mapbox-gl": "2.6.1",
            "mapbox-gl-controls": "2.3.5",
            "mime-types": "2.1.33",
            "phoenix": "1.6.6",
            "react": "17.0.2",
            "react-datepicker": "4.1.1",
            "react-dnd": "14.0.3",
            "react-dnd-html5-backend": "14.0.0",
            "react-dom": "17.0.2",
            "react-hook-form": "7.20.5",
            "react-hot-toast": "2.0.0",
            "react-i18next": "11.8.15",
            "react-map-gl": "6.1.19",
            "react-modal": "3.14.4",
            "react-popper": "2.2.5",
            "react-router-dom": "5.2.0",
            "react-transition-group": "4.4.2",
            "react-use": "17.2.4",
            "react-virtualized-auto-sizer": "1.0.6",
            "react-window": "1.8.6",
            "react-window-infinite-loader": "1.0.7",
            "sass": "1.43.4",
            "tz-lookup": "6.1.25",
            "use-local-storage-state": "16.0.1",
            "uuid": "8.3.2",
            "xlsx": "0.17.0"
        },
        "devDependencies": {
            "@graphql-codegen/add": "3.1.0",
            "@graphql-codegen/cli": "2.1.1",
            "@graphql-codegen/fragment-matcher": "3.1.0",
            "@graphql-codegen/near-operation-file-preset": "2.1.2",
            "@graphql-codegen/schema-ast": "2.1.0",
            "@graphql-codegen/typescript": "2.1.2",
            "@graphql-codegen/typescript-operations": "2.1.2",
            "@storybook/addon-actions": "6.4.19",
            "@storybook/addon-essentials": "6.4.19",
            "@storybook/addon-links": "6.4.19",
            "@storybook/node-logger": "6.4.19",
            "@storybook/preset-create-react-app": "3.2.0",
            "@storybook/react": "6.4.19",
            "@testing-library/jest-dom": "5.12.0",
            "@testing-library/react": "11.2.7",
            "@testing-library/user-event": "12.8.3",
            "@trivago/prettier-plugin-sort-imports": "3.1.1",
            "@types/file-saver": "2.0.3",
            "@types/geojson": "7946.0.8",
            "@types/jest": "27.0.1",
            "@types/lodash": "4.14.172",
            "@types/mapbox__mapbox-gl-draw": "1.2.3",
            "@types/mapbox__mapbox-sdk": "0.13.2",
            "@types/mime-types": "2.1.1",
            "@types/node": "16.7.2",
            "@types/phoenix": "1.5.4",
            "@types/react": "17.0.19",
            "@types/react-datepicker": "4.1.5",
            "@types/react-dom": "17.0.9",
            "@types/react-modal": "3.13.1",
            "@types/react-router-dom": "5.1.8",
            "@types/react-transition-group": "4.4.4",
            "@types/react-virtualized-auto-sizer": "1.0.1",
            "@types/react-window-infinite-loader": "1.0.5",
            "@types/tz-lookup": "6.1.0",
            "@types/uuid": "8.3.1",
            "@types/yandex-maps": "2.1.20",
            "babel-loader": "8.1.0",
            "dotenv-cli": "4.1.0",
            "eslint-config-prettier": "8.3.0",
            "eslint-plugin-compat": "4.0.0",
            "eslint-plugin-prettier": "4.0.0",
            "eslint-plugin-react-hooks": "4.3.0",
            "husky": "7.0.0",
            "jest-extended": "1.2.0",
            "lint-staged": "11.0.0",
            "prettier": "2.4.1",
            "react-app-rewire-alias": "1.1.7",
            "react-app-rewired": "2.1.11",
            "react-error-overlay": "6.0.9",
            "react-scripts": "4.0.3",
            "storybook-addon-designs": "6.2.1",
            "storybook-readme": "5.0.9",
            "typescript": "4.3.5"
        },
        "browserslist": {
            "production": [
                "> 0.3%",
                "not dead",
                "not op_mini all",
                "not ie 11"
            ],
            "development": [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version"
            ]
        },
        "eslintConfig": {
            "extends": "./src/common/infra/.eslintrc.json"
        },
        "eslintIgnore": [
            "/src/common/markup/**"
        ],
        "config-overrides-path": "./src/common/infra/configOverrides.js",
        "prettier": "./src/common/infra/prettier.js"
    }
;
//
// main().catch((e) => {
//     console.log('e', e);
// })
//
// async function main() {
//     console.log('main');
//     const res = await request('https://gitlab.samokat.io/pinky/a30_online-monitoring_webapp/-/raw/feature/ci-cd/package.json');
//     console.log('res', res);
// }

const deps = [
        ...Object.entries(pjContent.dependencies || {}),
        ...Object.entries(pjContent.devDependencies || {}),
        ...Object.entries(pjContent.peerDependencies || {}),
    ].map(([name, version]) => {
        return `${name}@${version}`
    }).join(' ')


run('node', [
    'deps_node.js',
    auth,
    deps
]);
    // .forEach(([]) => {

    // })
