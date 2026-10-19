# 🚀 Deploying VELOCE (SwiftCab) to Vercel

This project is fully pre-configured for instant zero-config deployment on **Vercel** with complete SPA routing rewrites (preventing 404 errors on page refresh on `/profile`, `/dashboard`, `/cars`, `/admin`).

---

## ⚡ Quick Deployment (GitHub + Vercel)

### Step 1: Push your code to GitHub
```bash
git add .
git commit -m "feat: user profile, logout, enhanced search box, and vercel deployment files"
git push origin main
```

---

### Step 2: Import Project on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)**.
2. Select your GitHub repository (`swiftcab`).
3. Vercel will automatically detect the settings:
   - **Framework Preset**: `Vite` (automatically detected from `vercel.json`)
   - **Root Directory**: `./` (leave default as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`

*(Note: If you choose to set the Root Directory to `frontend` in Vercel settings, `frontend/vercel.json` is also provided and will automatically route SPA pages to `dist/index.html`!)*

---

### Step 3: Configure Environment Variables in Vercel Dashboard
In your Vercel Project Settings -> **Environment Variables**, add:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-api.onrender.com` (or your backend URL) | Connects the frontend to your live backend API |

> **Tip**: If you are using external database hosting like **MongoDB Atlas** and deploying the backend to **Render**, **Railway**, or **AWS**, simply put that backend URL into `VITE_API_URL`. The frontend automatically handles appending `/api` routes!

---

### Step 4: Click "Deploy"
Vercel will run `npm run build`, bundle all assets, and provide you with a live URL:
`https://swiftcab.vercel.app` (or custom domain).

---

## 🛠️ Files Added for Vercel Deployment

1. **`vercel.json` (Root)**:
   - Configures Vite framework build command (`npm run build`).
   - Specifies output directory (`frontend/dist`).
   - Defines SPA rewrite rule (`/(.*)` -> `/index.html`) to ensure direct visits to `/profile`, `/cars`, `/dashboard`, etc. never show 404 errors.
   - Routes `/api/(.*)` requests.

2. **`frontend/vercel.json`**:
   - Fallback configuration if deployed directly from the `frontend/` directory.

3. **`api/index.js`**:
   - Vercel Serverless Function entrypoint if deploying backend serverless API endpoints on Vercel.

4. **`package.json`**:
   - Added `"type": "module"`, `"build:frontend"`, and `"vercel-build"` build scripts for Vercel's build pipeline.

5. **`.gitignore`**:
   - Prevents committing `node_modules/`, `dist/`, `.vercel/`, and local secret `.env` files.
