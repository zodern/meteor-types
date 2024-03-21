## 1.0.13 March 21, 2024

- Republished 1.0.12 to fix compatibility with old Meteor versions

## 1.0.12 March 20, 2024

- Fix support for Windows

## 1.0.11 Dec 22, 2023

- Support running Meteor from checkout

## 1.0.10 Oct 26, 2023

- Fix using `typesEntry` on Windows

## 1.0.9 Aug 12, 2022

- Partial workaround for bug in Meteor that causes it to crash with `Error: conflicts in compiler?` 

## 1.0.8 Aug 8, 2022

- Force `meteor lint` to exit immediately after the types are updated to avoid the bugs with `meteor lint`
- Document needing to set typescript's `preserveSymlinks` option for Meteor packages to use types from npm packages
- Improve performance so it takes 1/10th of the time it did before during each rebuild
- Fix package types for default export
- Remove message when catalog is not available
