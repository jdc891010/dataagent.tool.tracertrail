# Release Process

This project follows [Semantic Versioning](https://semver.org/).

## Versioning Scheme
- **Major** (x.0.0): Breaking changes
- **Minor** (1.x.0): New features (backward compatible)
- **Patch** (1.0.x): Bug fixes (backward compatible)

## How to Release

1. **Update Version**: Run one of the following commands to bump the version in `package.json`. This will also create a git tag (if git is initialized).

   ```bash
   # For bug fixes
   npm run release:patch

   # For new features
   npm run release:minor

   # For breaking changes
   npm run release:major
   ```

2. **Verify**: The new version will be automatically reflected in the application (e.g., in the navigation bar) after restarting the development server or rebuilding.

3. **Build**: Create a production build.
   ```bash
   npm run build
   ```

## Current Version
The current version is defined in `package.json`.
