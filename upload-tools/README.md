# Тулзы для загрузки артифактов в нексус

Загрузка модулей для maven
```node deps_maven.js login:pass org:some:module1:1.0.1  org:some:module2:1.0.1```

Загрузка модулей для npm
```node deps_node.js login:pass package1@1.0.1 package2@1.0.1 ...```

Работа с целым проектом, где можно забрать package.json файл
```node deps_project_node.js login:pass путь/к/проекту/``` 


Проверка версий пакетов происходит по файлу blacklist.json
