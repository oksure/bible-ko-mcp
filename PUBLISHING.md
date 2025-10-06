# Publishing to NPM

This document explains how to publish this package to NPM automatically when you create a GitHub release.

## Setup (One-time)

### 1. Create an NPM Account
If you don't have one already:
1. Go to https://www.npmjs.com/signup
2. Create an account
3. Verify your email

### 2. Generate an NPM Access Token

1. Log in to https://www.npmjs.com
2. Click your profile picture → Access Tokens
3. Click "Generate New Token" → "Granular Access Token"
4. Configure the token:
   - **Token name:** `bible-ko-mcp-github-actions`
   - **Expiration:** 1 year (or your preference)
   - **Packages and scopes:**
     - Select "Read and write"
     - For "Packages", select "All packages" or specifically allow `bible-ko-mcp`
5. Click "Generate Token"
6. **Copy the token immediately** (you won't be able to see it again)

### 3. Add NPM Token to GitHub

1. Go to your GitHub repository: https://github.com/oksure/bible-ko-mcp
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste the token you copied from NPM
6. Click **Add secret**

### 4. Verify Package Name is Available

Check if the package name is available on NPM:
```bash
npm view bible-ko-mcp
```

If you get "404 Not Found", the name is available. If not, you'll need to:
- Choose a different name in `package.json`
- Or use a scoped package: `@oksure/bible-ko-mcp`

## Publishing a New Version

### Method 1: Using GitHub Releases (Recommended)

This triggers automatic publishing via GitHub Actions.

1. **Update version in package.json:**
   ```bash
   npm version patch  # For bug fixes (0.1.0 → 0.1.1)
   npm version minor  # For new features (0.1.0 → 0.2.0)
   npm version major  # For breaking changes (0.1.0 → 1.0.0)
   ```

2. **Push the version commit and tag:**
   ```bash
   git push && git push --tags
   ```

3. **Create a GitHub Release:**
   - Go to https://github.com/oksure/bible-ko-mcp/releases
   - Click "Create a new release"
   - Choose the tag you just pushed (e.g., `v0.1.1`)
   - Title: `v0.1.1` (match the tag)
   - Description: Write release notes (features, fixes, changes)
   - Click "Publish release"

4. **Wait for GitHub Actions:**
   - Go to the Actions tab: https://github.com/oksure/bible-ko-mcp/actions
   - Watch the "Publish to NPM" workflow run
   - If successful, your package is now live on NPM!

### Method 2: Manual Publishing

If you prefer to publish manually:

```bash
# Make sure you're logged in to NPM
npm login

# Verify package.json version is updated
npm version patch  # or minor/major

# Run tests and build
npm test
npm run build

# Publish to NPM
npm publish --access public
```

## Verifying Publication

After publishing, verify your package:

1. **View on NPM:**
   - https://www.npmjs.com/package/bible-ko-mcp

2. **Test installation:**
   ```bash
   npm install -g bible-ko-mcp
   bible-ko-mcp
   ```

3. **Check version:**
   ```bash
   npm view bible-ko-mcp version
   ```

## Troubleshooting

### "You must be logged in to publish packages"
- Your NPM_TOKEN might be invalid or expired
- Regenerate the token and update the GitHub secret

### "Package name already taken"
- Change the name in `package.json`
- Or use a scoped package: `@oksure/bible-ko-mcp`

### "Tests failed"
- Fix the failing tests before publishing
- The `prepublishOnly` script will prevent publishing if tests fail

### "403 Forbidden"
- Your NPM token doesn't have write permissions
- Generate a new token with "Read and write" permissions

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.0.0 → 2.0.0): Breaking changes
  - Changed API, removed features, incompatible changes

- **MINOR** version (0.1.0 → 0.2.0): New features
  - Added new tools, enhanced functionality
  - Backward compatible

- **PATCH** version (0.1.0 → 0.1.1): Bug fixes
  - Fixed bugs, improved parsing
  - No new features, backward compatible

## Release Checklist

Before creating a release:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] README.md is up to date
- [ ] CHANGELOG or release notes prepared
- [ ] Version bumped in package.json
- [ ] Git tag created and pushed
- [ ] GitHub release created with detailed notes

## CI/CD Workflow

This project has two automated workflows:

1. **CI (Continuous Integration)** - `.github/workflows/ci.yml`
   - Runs on every push and pull request
   - Tests on Node.js 18 and 20
   - Ensures tests pass and build succeeds

2. **Publish** - `.github/workflows/publish.yml`
   - Runs when you create a GitHub release
   - Runs tests, builds, and publishes to NPM
   - Uses provenance for supply chain security

## First-time Publication

For the very first publication (v0.1.0):

```bash
# Make sure you're ready
npm test
npm run build

# Login to NPM (if not already)
npm login

# Publish for the first time
npm publish --access public

# After successful publication, set up the GitHub workflow
# for future automated releases
```

## Support

If you encounter issues:
- Check GitHub Actions logs
- Verify NPM token is valid
- Ensure package name is available
- Test locally with `npm pack` before publishing
