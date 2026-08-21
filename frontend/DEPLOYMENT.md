# Deploying to GitHub Pages

Follow this step-by-step guide to deploy your MTG Draft Trainer Progressive Web App (PWA) to the internet for free using GitHub Pages. This will allow you to access the app from your mobile device and save it to your home screen!

## Dual Environment Setup
This repository is configured to deploy two environments:
1. **Production:** Pushes to the `main` branch are deployed to the root URL (e.g. `https://your-username.github.io/mtg-draft-trainer/`).
2. **Preview:** Pushes to the `develop` branch are deployed to the `/preview/` subdirectory (e.g. `https://your-username.github.io/mtg-draft-trainer/preview/`).

To make this work, we use the `gh-pages` branch deployment method.

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

If you are deploying to a subdirectory, you need to tell Vite what your base URL is. Our `vite.config.js` is already configured to read from an environment variable:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/mtg-draft-trainer/',
})
```

## Step 3: Setup GitHub Pages (IMPORTANT)

Because we use a custom GitHub Action to deploy to subdirectories, you MUST configure GitHub Pages to deploy from the `gh-pages` branch.

1. Go to your repository on GitHub.
2. Click on the **Settings** tab.
3. On the left sidebar, click on **Pages**.
4. Under "Build and deployment", change the **Source** dropdown to **Deploy from a branch**.
5. Select the **`gh-pages`** branch and the `/ (root)` folder.
6. Click **Save**.

## Step 4: Access your App!

Whenever you push to `main` or `develop`, the GitHub Action (`.github/workflows/deploy.yml`) will automatically run and push the built files to the `gh-pages` branch.

1. Click on the **Actions** tab in your repository to watch the deployment process.
2. Once the workflow shows a green checkmark ✅, your app is live!
3. The URLs will be:
   - **Production:** `https://YOUR_USERNAME.github.io/mtg-draft-trainer/`
   - **Preview:** `https://YOUR_USERNAME.github.io/mtg-draft-trainer/preview/`

## Step 5: Save to Home Screen (PWA)

1. Open Safari on your iPhone or Chrome on your Android device.
2. Navigate to your new GitHub Pages URL.
3. Tap the **Share** button.
4. Select **Add to Home Screen**.
5. The MTG Draft Trainer is now installed on your phone like a native app!
