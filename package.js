Package.describe({
  summary: "Type definitions for Meteor packages",
  name: "zodern:types",
  version: '1.0.0'
});

Package.registerBuildPlugin({
  name: 'types',
  sources: [ 'types.js', 'publish-packages.js' ],
  use: [
    'ecmascript'
  ]
})

Package.onUse(api => {
  api.use('isobuild:linter-plugin@1.0.0')
  api.use('isobuild:compiler-plugin@1.0.0')
});
