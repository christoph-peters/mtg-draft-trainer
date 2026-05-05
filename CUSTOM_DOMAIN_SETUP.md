# Custom Domain Setup Guide

Follow these steps to point your own domain (e.g., `www.mtgdrafttrainer.com`) to this project.

## 1. GitHub Configuration

1. Go to your repository on GitHub.
2. Click **Settings** (top tab) -> **Pages** (left sidebar).
3. Under **Custom domain**, enter your domain name (e.g., `draft.example.com`).
4. Click **Save**.
   - *Note: GitHub will automatically create a `CNAME` file in your repository. Do not delete it.*

## 2. DNS Provider Configuration

Log in to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains) and add the following records:

### For a Subdomain (e.g., `draft.example.com`)
| Type | Name | Value |
| :--- | :--- | :--- |
| CNAME | `draft` | `christoph-peters.github.io` |

### For a Root Domain (e.g., `example.com`)
Add four **A records** pointing to GitHub's IP addresses:
- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

Then add a **CNAME record** for `www`:
| Type | Name | Value |
| :--- | :--- | :--- |
| CNAME | `www` | `christoph-peters.github.io` |

## 3. Vite Configuration Update

When moving from a GitHub subdirectory (`/mtg-draft-trainer/`) to a custom domain (root `/`), you **MUST** update your Vite config:

1. Open `vite.config.js`.
2. Change the `base` property:
   ```javascript
   // From:
   base: '/mtg-draft-trainer/',
   
   // To:
   base: '/',
   ```
3. Commit and push this change.

## 4. Secure your Site (HTTPS)

1. Wait for DNS to propagate (can take 5 mins to 24 hours).
2. Go back to GitHub **Settings** -> **Pages**.
3. Once the domain is verified, check **Enforce HTTPS**.

---
**Tip:** Use a tool like [whatsmydns.net](https://www.whatsmydns.net/) to check if your DNS records have spread across the world yet.
