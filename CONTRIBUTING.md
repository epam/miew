# Contributing to Miew

Thank you for considering contributing to Miew! There are many ways you can do this, you don't even
have to do coding at all. We would be happy to know about your use cases, your experience with the
viewer, your expectations.

According to the CI principles all the development occurs inside
the `master` branch, and the `latest` branch is used _for tagging_ released versions only.

We adhere to the [Semantic Versioning](http://semver.org/) scheme. The major version number changes
when the external API is changed. While there's no external API specified yet it stays at zero for now.

## Reporting Issues

> Please **don't report sensitive / security issues** via public channels, try to contact
> maintainers privately first (e.g. at [miew@epam.com](miew@epam.com)).

We use [GitHub Issues](https://guides.github.com/features/issues/) to keep track of tasks,
enhancements, and bugs. For your convenience there's [an issue template](.github/ISSUE_TEMPLATE.md)
available.

## Making Changes

> Please make sure maintainers are expecting your changes and will consider merging them into
> master. If the changes do not fit the project roadmap, it might unfortunately happen that
> you've wasted your time.

First, prepare your development environment. Ensure that [git] and [Node.js] are installed.
You're also encouraged to use [Yarn] package manager to guarantee that package versions are
consistent across all build machines. [Gulp.js] v3 is used as a task manager.

```sh
# install Gulp globally
yarn global add gulp-cli
```

[git]: https://git-scm.com/
[Node.js]: https://nodejs.org/
[Yarn]: https://yarnpkg.com/
[Gulp.js]: http://gulpjs.com/

### Core developers: clone the origin

We won't use pull requests in our everyday life. Clone the main repository and start working
on `master` branch. Commit and push to the origin but make sure you don't ruin anything. Check
the steps below and adopt them to your case.

### External developers: fork and branch

Fork the project [on GitHub](https://github.com/epam/miew) and clone your fork locally.
Check that everything works correctly.

```sh
# grab the project
git clone git@github.com:username/miew.git
cd miew
git remote add upstream https://github.com/epam/miew.git

# install necessary Node.js modules
yarn install

# execute the build pipeline
gulp

# run the demo application
gulp serve:demo
```

For developing new features and bug fixes, the `master` branch should be pulled and built upon.

```sh
# create a branch
git checkout -b hotfix/great-fix-whatever -t origin/master

# start development server, with in-memory builds and live reload
gulp serve
```

### Commit

The commit message should describe what changed and why. The first line should:

- start from an uppercase verb in imperative mood,
- don't end with a period,
- be 50 characters or less.

The second line should be empty.

### Rebase and test

Use `git rebase` (not `git merge`) to synchronize your work with the main repository.

```sh
# update
git fetch upstream
git rebase upstream/master

# lint, test and build
gulp
```
