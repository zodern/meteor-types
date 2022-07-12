Package.describe({
  name: "zodern:types",
  summary: "Type definitions for Meteor packages",
  documentation: "./README.md",
  version: '1.0.6',
  git: 'https://github.com/zodern/meteor-types.git'
});

Package.registerBuildPlugin({
  name: 'types',
  sources: [ 'types.js', 'publish-packages.js' ],
  use: [
    'modules@0.8.2'
  ]
})

Package.onUse(api => {
  api.use('isobuild:linter-plugin@1.0.0')
  api.use('isobuild:compiler-plugin@1.0.0')
});
