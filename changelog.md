## 1.0.8 Aug 8, 2022

- Force `meteor lint` to exit immediately after the types are updated to avoid the bugs with `meteor lint`
- Document needing to set typescript's `preserveSymlinks` option for Meteor packages to use types from npm packages
- Improve performance so it takes 1/10th of the time it did before during each rebuild
- Fix package types for default export
- Remove message when catalog is not available
