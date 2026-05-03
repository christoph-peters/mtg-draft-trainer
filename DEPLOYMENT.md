# Deploying to GitHub Pages

Follow this step-by-step guide to deploy your MTG Draft Trainer Progressive Web App (PWA) to the internet for free using GitHub Pages. This will allow you to access the app from your mobile device and save it to your home screen!

## Step 1: Push your code to GitHub

1. Go to [GitHub](https://github.com/) and create a new, empty repository. You can name it `mtg-draft-trainer`.
2. Open your terminal and navigate to the root of your project:
   ```bash
   cd /Users/christoph/.gemini/antigravity/scratch/mtg_draft_trainer/frontend
   ```
3. Initialize a git repository and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/mtg-draft-trainer.git
   git push -u origin main
   ```
   *(Make sure to replace `YOUR_USERNAME` with your actual GitHub username!)*

## Step 2: Update your Vite Configuration

If you are deploying to a subdirectory (like `https://your-username.github.io/mtg-draft-trainer/`), you need to tell Vite what your base URL is.

1. Open `frontend/vite.config.js`.
2. Update the configuration to include the `base` property matching your repository name:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/mtg-draft-trainer/', // Add this line!
   })
   ```
3. Commit and push this change to GitHub:
   ```bash
   git add vite.config.js
   git commit -m "Configure base URL for GitHub Pages"
   git push
   ```

## Step 3: Setup GitHub Actions Deployment

GitHub Actions is the easiest way to deploy a Vite React app. 

1. Go to your repository on GitHub.
2. Click on the **Settings** tab.
3. On the left sidebar, click on **Pages**.
4. Under "Build and deployment", change the **Source** dropdown from "Deploy from a branch" to **GitHub Actions**.
5. GitHub will recommend workflows. Look for the **"Static HTML"** workflow and click **Configure**.
6. **Stop!** Don't use the default Static HTML file. Instead, replace the entire contents of the editor with this workflow block:

```yaml
# .github/workflows/deploy.yml
name: Deploy static content to Pages

on:
  push:
    branches: ['main']

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

7. Click **Commit changes...** in the top right corner. 

## Step 4: Access your App!

Once you commit the workflow file, GitHub Actions will automatically run! 
1. Click on the **Actions** tab in your repository to watch the deployment process (it usually takes less than a minute).
2. Once the workflow shows a green checkmark ✅, your app is live!
3. The URL will be printed at the end of the deployment step, but it is typically:
   `https://YOUR_USERNAME.github.io/mtg-draft-trainer/`

## Step 5: Save to Home Screen (PWA)

1. Open Safari on your iPhone or Chrome on your Android device.
2. Navigate to your new GitHub Pages URL.
3. Tap the **Share** button.
4. Select **Add to Home Screen**.
5. The MTG Draft Trainer is now installed on your phone like a native app!
