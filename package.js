Package.describe({
  name: "zodern:types",
  summary: "Type definitions for Meteor packages",
  documentation: "./README.md",
  version: '1.0.0'
});

Package.registerBuildPlugin({
  name: 'types',
  sources: [ 'types.js', 'publish-packages.js' ],
  use: [
    'modules'
  ]
})

Package.onUse(api => {
  api.use('isobuild:linter-plugin@1.0.0')
  api.use('isobuild:compiler-plugin@1.0.0')
});
