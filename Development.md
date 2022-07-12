## Publishing

Use this command to publish:

```
meteor publish --release METEOR@1.4.4.6
```

Meteor compiles and bundles build plugins when they are published. Using Meteor 1.4 ensures the published package is compatible with Meteor 1.4 and newer.

The package does not use `ecmascript` since that makes it difficult for build plugins to support a large number of Meteor versions. Only es6 features that are supported in Node 4 can be used. Adding `"use strict";` to the top of a module enables additional es6 features in Node 4.

The linter and the code run when publishing a package only run on Node 14.17 or newer, though the syntax still needs to be compatible with Node 4 since older Meteor versions do load the build plugin, but shouldn't use them.
