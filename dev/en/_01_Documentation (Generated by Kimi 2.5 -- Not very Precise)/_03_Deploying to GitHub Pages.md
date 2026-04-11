---
title: Deploying to GitHub Pages
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex->v0plex@outlook.com
has_custom_tsx: false
tags: [guide, deployment]
---

# Deploying to GitHub Pages

GitHub Pages is a convenient choice for hosting static sites. It integrates seamlessly with GitHub repositories, supports custom domains, and provides free HTTPS certificates. This chapter covers how to deploy v0plex-generated sites to GitHub Pages.

## Prerequisites

Before beginning deployment, some preparation work is required. First, ensure you have created a repository on GitHub and that your local project is connected to it. If you obtained v0plex through a fork, this step is already complete.

Second, confirm that the configuration in `next.config.mjs` suits your deployment requirements. This file comes pre-configured with static export settings: `output: 'export'` enables static export mode, `distDir: 'gh-page-output'` specifies the output directory, and `trailingSlash: true` ensures URLs end with a trailing slash, which is more friendly for static hosting services. If your repository is not a user or organization site (meaning the repository name is not `username.github.io`), you also need to set `basePath` to the repository name.

For example, if the repository is named `my-docs`, the configuration should be modified to:

```javascript
const nextConfig = {
    output: 'export',
    distDir: 'gh-page-output',
    basePath: '/my-docs',
    trailingSlash: true,
    // ...other configuration
}
```

## Configuring GitHub Actions

GitHub Pages supports automatic deployment via GitHub Actions, meaning the site is automatically rebuilt and published each time you push to the main branch.

Create the `.github/workflows/deploy.yml` file in the project root with the following content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Build site
        run: |
          pnpm vmd:gen
          pnpm lex:gen
          pnpm build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./gh-page-output

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

This workflow defines two jobs: the build job installs dependencies, builds the site, and uploads the build artifacts in an Ubuntu environment; the deploy job deploys the artifacts to GitHub Pages. The `workflow_dispatch` trigger allows you to manually initiate deployment, which is useful during debugging.

## Enabling GitHub Pages

After configuring the workflow, you need to enable the Pages feature in your GitHub repository settings.

Go to the Settings page of your repository and find the Pages option in the left menu. In the Build and deployment section, select Source as GitHub Actions. After saving, GitHub automatically detects workflow files in the repository.

Return to the code repository page and click the Actions tab. You should see the Deploy to GitHub Pages workflow you just created. Since it hasn't been triggered yet, the list may be empty. Perform a push operation or manually trigger the workflow to test deployment.

## First Deployment

Commit the workflow file to your repository:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

After pushing, GitHub Actions automatically triggers the build process. Go to the Actions page to view progress. The entire process usually takes 2 to 5 minutes. If everything is functioning correctly, the build job displays a green checkmark, followed by the deploy job executing and showing a deployment success message.

After deployment completes, visit `https://username.github.io/repository-name` (replacing username and repository-name with your actual values) to view the site. If you configured a user site (repository named `username.github.io`), the access address is `https://username.github.io`.

## Configuring a Custom Domain

GitHub Pages supports custom domains, allowing you to configure a more professional address for your documentation site.

Create a file named `CNAME` in the `gh-page-output` directory (or static file source directory), containing one line with your custom domain, such as `docs.example.com`. In your GitHub repository's Pages settings, find the Custom domain section, enter the same domain, and save.

Next, add a record with your DNS provider. If the primary domain is `example.com`, you need to add a CNAME record pointing the `docs` subdomain to `username.github.io`. If the primary domain uses APEX records (bare domain), you need to add A records pointing to GitHub Pages' IP addresses (consult GitHub documentation for current addresses).

DNS changes may take anywhere from a few minutes to several hours to take effect. GitHub automatically detects DNS configuration and provisions HTTPS certificates.

## Verifying Deployment Results

After deployment, several key points should be verified. First, the homepage loads normally without 404 errors. Second, navigation links work correctly, and the URL structure is as expected. Third, image assets display properly without being blocked by cross-origin or path issues. Fourth, search functionality works correctly and returns Chinese search results.

If resources fail to load, check the browser's developer tools network panel to confirm whether request URLs are correct. A common issue is improper `basePath` configuration causing incorrect resource paths.

## Troubleshooting

Issues that may be encountered during deployment and their solutions:

If the Actions workflow fails, click the failed run record to view detailed logs. Common causes include dependency installation failures, build command errors, or permission configuration issues.

If the deployed site displays blank, there may be an issue with Next.js's static export configuration. Check that `output` in `next.config.mjs` is `'export'` and that `distDir` matches the path in your workflow.

If the custom domain does not take effect, confirm that the CNAME file has been correctly committed to the repository and that DNS records point to the correct target. The GitHub Pages Custom domain settings page displays DNS check status.

If CSS or JavaScript files fail to load, this is typically a path issue. Check error messages in the browser console to confirm whether resource URLs include the correct `basePath`.
