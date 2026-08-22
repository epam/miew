# Releases

Miew is distributed as npm packages (`miew`, `miew-react`) and deployed as a web application (`miew-app`).

## Release Workflow

1. **Prerequisites & Verification**:
   - Ensure a clean working tree and that CI passes cleanly across all workspaces:
     ```bash
     yarn ci
     ```
2. **Version Bump**:
   - Increment package versions using npm/yarn (patch, minor, or major):
     ```bash
     npm version <patch|minor|major>
     ```
3. **Synchronize Metadata & Changelog**:
   - Update the version in `sonar-project.properties`.
   - Update `CHANGELOG.md` with categorized changes (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, `Internal`) and update unreleased comparison links.
   - Amend the release commit and recreate the version tag:
     ```bash
     git add sonar-project.properties CHANGELOG.md
     git commit --amend
     git tag -fa v<version> -m "<version>"
     ```
4. **Branch Synchronization**:
   - Fast-forward merge `main` into the `latest` branch:
     ```bash
     git checkout latest
     git merge --ff-only main
     git checkout main
     ```
5. **Publishing**:
   - Push updated branches and tags to origin:
     ```bash
     git push origin main latest
     git push --tags
     ```
   - GitHub Actions automated workflow builds and triggers npm package publication on tagged releases.
   - Draft and publish the GitHub Release at `https://github.com/epam/miew/releases`.
