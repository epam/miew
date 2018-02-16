# Contributing to Miew

Thank you for choosing to contribute!

There are many ways you can do this, and you do not even have to write code at all. You could
report issues or write docs instead if you'd like. We would also be happy if you could provide a
feedback: we are eager to learn your use cases, your experience with the viewer, your
expectations. Please contact us at [miew@epam.com] or via [GitHub Issues].

[GitHub Issues]: https://guides.github.com/features/issues/
[miew@epam.com]: mailto:miew@epam.com


## Introduction

We adhere to the [Semantic Versioning] scheme. The major version number changes when the external
API changes. While there is no external API specified yet it stays at zero for now.

According to the Continuous Integration principles all the development occurs inside
the `master` branch, and we use the `latest` branch _for tagging_ released versions only.
We rarely use public feature branches as they [go against CI/CD].

There is a live [demo application] and [a set of examples] available. Each branch or tag gets its
own subdirectory on the server, e.g. [`master`] or [`v0.7.10`].

[Semantic Versioning]: http://semver.org/
[go against CI/CD]: https://martinfowler.com/bliki/FeatureBranch.html
[demo application]: http://miew.opensource.epam.com/
[a set of examples]: http://miew.opensource.epam.com/examples/
[`master`]: http://miew.opensource.epam.com/master/
[`v0.7.10`]: http://miew.opensource.epam.com/v0.7.10/


## Reporting Issues

> Please **do not report sensitive / security issues** via public channels, try to contact
> maintainers privately first (e.g. at [miew@epam.com]).

We use [GitHub Issues] to keep track of tasks, enhancements, and bugs. For your convenience
there is [an issue template] available.

It is always good to know the version of the project where the issue appears. You may learn the
exact version of the library in a comment at the first line of a compiled library code.
The demo application displays the version on `About` panel of the main menu. The full version
number consists of several parts, e.g. `0.7.10+20171225.164646.68e4556`:
  - `0.7.10` is the last release version,
  - `20171225` is the date the build took place, e.g. Dec 25, 2017,
  - `164646` is the UTC time of the build,
  - `68e4556` is a hash of the commit used for the build,
  - `-mod` suffix is appended if the project directory contained unversioned or changed files
    during the build.

[an issue template]: .github/ISSUE_TEMPLATE.md


## Building and Running

First, prepare your development environment. Ensure that you installed [git] and [Node.js].
You are also encouraged to use [Yarn] package manager to guarantee that package versions are
consistent across all build machines. [NPM scripts] are used to perform development tasks.

[git]: https://git-scm.com/
[Node.js]: https://nodejs.org/
[Yarn]: https://yarnpkg.com/
[NPM scripts]: https://docs.npmjs.com/misc/scripts/

```sh
# grab the project
git clone git@github.com:epam/miew.git
cd miew

# install necessary Node.js modules
yarn

# execute the full build pipeline
npm run ci

# run the demo application
npm run demo
```


## Debugging

During the build process we generate source maps for the transpiled and minified demo
application. You may use browser capabilities (e.g. DevTools built into Google Chrome web browser)
or an IDE like WebStorm for debugging.

Sometimes you may need to switch the uglification off in `webpack.config.babel.js` to ensure
better debugging experience.

It might be of help to know that the demo application exports `miew` global object accessible from
the browser console.


## Making Changes

> Please make sure maintainers are expecting your changes and will consider merging them into
> master. If the changes do not fit the project roadmap, it might unfortunately happen that
> you have wasted your time.

Core developers do not normally use pull requests. If you have rights to push, then clone the main
repository and just start working on `master` branch. Commit and push to the origin but make sure
you do not ruin anything.

External contributors are welcome to fork, branch and create pull-requests. Fork the project
[on GitHub] and clone your fork locally. Apply changes, run automated and manual tests to verify
that everything works correctly.

[on GitHub]: https://github.com/epam/miew

```sh
# grab the forked project
git clone git@github.com:username/miew.git
cd miew
git remote add upstream https://github.com/epam/miew.git

# create a branch
git checkout -b hotfix/great-fix-whatever -t origin/master

# install necessary Node.js modules
yarn

# start development server, with in-memory builds and live reload
npm start
```

Before you commit and push, please ensure that the build is not broken:
  - Run the full build pipeline using `npm run ci` command, it includes code linting and unit tests.
  - Verify that the demo application is working as expected (`npm run demo`).
  - Check that examples for the library are working (see `build/examples/`).
  - It is also a good idea to run the graphics regression tests (`npm run test:e2e`, `npm run show:e2e`).
    Unfortunately, some tests fail yet.


## Commiting

The commit message should describe what changed and why. The first line should:

- start from an uppercase verb in imperative mood,
- do not end with a period,
- be 50 characters or less.

E.g. "Add Contact Surface mode", "Change style of the terminal panel".
The second line should be empty, and then details should follow if any.

If you do not change the code but only a documentation or supplementary files, consider
adding a `[skip ci]` phrase at the end of commit message details. This will let Continuous
Integration tools to ignore the changes and to not initiate an extra build.

Before creating a PR use `git rebase` (not `git merge`) to synchronize your work with the main
repository. Ensure again that the build is not broken (see [Making Changes](#making-changes)
section).

```sh
# update
git fetch upstream
git rebase upstream/master

# lint, test and build
npm run ci

# run automated and manual tests, etc.
...
```
