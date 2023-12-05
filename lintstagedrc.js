module.exports = {
  '*.{js,ts,wxs,wxml}': ['eslint --fix', 'prettier --write'],
  '*.{wxss,json,md}': ['prettier --write'],
  '{!(package)*.json,*.code-snippets,.!(browserslist)*rc}': ['prettier --write--parser json'],
}
