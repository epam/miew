# Contributing to Miew

Thank you for choosing to contribute!

**THE INSTRUCTION IS UNDER CONSTRUCTION** and doesn't cover recent repository changes to monorepo. We 
apologize for any inconvenience and are going to update it soon. 

There are many ways you can do this, and you do not even have to write code at all. You could
report issues or write docs instead if you'd like. We would also be happy if you could provide a
feedback: we are eager to learn your use cases, your experience with the viewer, your
expectations. Please contact us at [miew@epam.com] or via [GitHub Issues].

[GitHub Issues]: https://guides.github.com/features/issues/
[miew@epam.com]: mailto:miew@epam.com


## Introduction

We adhere to the [Semantic Versioning] scheme. The major version number changes when the external
API changes. While there is no external API specified yet it stays at zero for now.

According to the Continuous Integration principles, all the development occurs inside
the `main` branch, and we use the `latest` branch _for tagging_ released versions only.
We rarely use public feature branches as they [go against CI/CD].

There is a live [demo application] and [a set of examples] available.

[Semantic Versioning]: http://semver.org/
[go against CI/CD]: https://martinfowler.com/bliki/FeatureBranch.html
[demo application]: https://miew.opensource.epam.com/
[a set of examples]: https://miew.opensource.epam.com/examples/

## Reporting Issues

> Please **do not report sensitive / security issues** via public channels, try to contact
> maintainers privately first (e.g. at [miew@epam.com]).

We use [GitHub Issues] to keep track of tasks, enhancements, and bugs. For your convenience,
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

[an issue template]: https://github.com/epam/miew/tree/main/.github/ISSUE_TEMPLATE


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
cd packages/miew
yarn run ci

# run the demo application
yarn run demo
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
> main. If the changes do not fit the project roadmap, it might unfortunately happen that
> you have wasted your time.

### Core developers
Commit and push to the `origin/main` is forbidden.
All core developers should use Pull Requests. Clone the main repository and just start working 
in a new branch created from `main` branch. When you are ready create a PR and select a [reviewer].
When the PR is approved the author should merge it using "Squash and merge" approach following
with the branch deletion. **Note**:The PR should be synchonized with `main` branch at a moment of merging.

### External developers
External contributors are welcome to fork, branch and create pull-requests. Fork the project
[on GitHub] and clone your fork locally. Apply changes, run automated and manual tests to verify
that everything works correctly.

[on GitHub]: https://github.com/epam/miew
[reviewer]: #markdown-header-code-review

```sh
# grab the forked project
git clone git@github.com:username/miew.git
cd miew
git remote add upstream https://github.com/epam/miew.git

# create a branch
git checkout -b hotfix/great-fix-whatever -t origin/main

# install necessary Node.js modules
yarn

# start development server, with in-memory builds and live reload
cd packages/miew
yarn start
```

Before you commit and push, please ensure that the build is not broken:
  - Run the full build pipeline using `yarn run ci` command, it includes code linting and unit tests.
  - Verify that the demo application is working as expected (`yarn run demo`).
  - Check that examples for the library are working (see `build/examples/`).
  - It is also a good idea to run the graphics regression tests (`yarn run test:e2e`, `yarn run show:e2e`).
    Unfortunately, some tests fail yet.

### Code Review

When you create a new PR you should select a reviewer among core developers. By default we take 
2 days for a code review. If the reviewer's estimation is more than 2 days, he/she should notify the author.

When you choose a reviewer it's a good practice to select:

- an expert in the system you've changed
- or a person who should be noticed or learnt
- or an owner of changed code (default)

You can use the following list of recommendations as "what to look at" while code review:
[Google review guidelines|https://google.github.io/eng-practices/review/reviewer/looking-for.html#summary]

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
git rebase upstream/main

# lint, test and build
yarn run ci

# run automated and manual tests, etc.
...
```

## Releasing a Version

Unfortunately, it is still a semi-manual process.

1.  Ensure that you have a clean repo. Check the build pipeline etc.

        git status
        yarn run ci
        ...

2.  Use npm to automatically increment version (patch, minor or major).

        npm version patch

3.  Manually update some files.

    -   Increment product version in the `sonar-project.properties` file.

    -   Examine the changes since the last version. Check the commit log and follow the external
        links (PRs, issues) to refresh the knowledge.

            git log v0.0.1..HEAD --reverse \
                --first-parent --pretty=format:"%as - %s (%an)"

    -   Update `CHANGELOG.md` file. Don't copy the git log blindly, summarize, reword and reorder. Use the following groups order:

            ## [0.0.2] - 2000-01-01
            ### Added
            ### Changed
            ### Deprecated
            ### Removed
            ### Fixed
            ### Security
            ### Internal
            
    -   Update unreleased link in `CHANGELOG.md` file.
    
            [Unreleased]: https://github.com/epam/miew/compare/v0.0.2...HEAD

    -   Replace the automatic commit and move the tag.

            git add sonar-project.properties CHANGELOG.md 
            git commit --amend
            git tag -fa v0.0.2 -m "0.0.2"

4.  Merge `main` into `latest` branch.

        git checkout latest
        git merge --ff-only main
        git checkout main

5.  Push updated branches and tags.

        git push origin main latest
        git push --tags

6.  Update a release description at https://github.com/epam/miew/releases. 

    *  Press button `Draft a new release`.
    *  Select the new version tag among existing and fill in a description text box with new release link and list of changes (see `CHANGELOG.md`)
    *  Press `Publish`.

Upon push, GitHub Actions build `main`, `latest` branches and `v0.0.2` tag. The tag automatically initiates NPM publish process if the build is successful.
