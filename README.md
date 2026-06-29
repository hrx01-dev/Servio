# Servio 

A modern SaaS website built with React, Vite, and Tailwind CSS. This project is based on the Figma design.

## 🚀 Tech Stack

- **Framework:** React
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **Icons:** Lucide React
- **Animations:** Motion
- **Testing:** Vitest + Testing Library + axe-core (accessibility)

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 Testing

Unit, component, and accessibility tests run with Vitest + Testing Library.

```bash
npm test            # run the full suite
npm run test:a11y   # accessibility checks only (axe-core)
```

Accessibility is enforced in CI: axe-core scans the public components and pages
on every push and pull request, and a new WCAG violation fails the build. See
[docs/ACCESSIBILITY_TESTING.md](docs/ACCESSIBILITY_TESTING.md).

## 🚀 Deployment

This project uses **Firebase Hosting** for production deployments.

### Prerequisites

- [Firebase CLI](https://firebase.google.com/docs/cli) installed globally:
  ```bash
  npm install -g firebase-tools
  ```
- A Firebase project with Hosting enabled
- Firebase authentication via `firebase login`

### Environment Variables

Create a `.env` file at the project root with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Manual Deployment

1. Build and deploy to production:
   ```bash
   npm run deploy
   ```

2. Deploy a preview channel:
   ```bash
   npm run deploy:preview
   ```

### Automated Deployment (CI/CD)

Deployments are automated via GitHub Actions:

- **Production:** Merges to `main` trigger a build and deploy to the live Firebase Hosting channel.
- **Preview:** Pull requests automatically deploy to a temporary preview URL (posted as a PR comment).

To enable automated deployments, add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON key (see [setup guide](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md)) |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID |

### Firebase Project Setup

1. Update the project ID in `.firebaserc` to match your Firebase project.
2. The `firebase.json` configures:
   - `dist/` as the public directory (Vite build output)
   - SPA rewrites (all routes serve `index.html`)
   - Cache headers for static assets

## ✨ Key Features

- **Web Development Services:** Professional development of high-performance landing pages, corporate websites, and custom SaaS applications tailored for business growth.
- **Responsive Sidebar:** A full-featured sidebar with desktop/mobile support and keyboard shortcuts (`Ctrl+B` / `Cmd+B`).
- **Dynamic Quote Form:** Interactive project proposal form with validation and loading states.
- **Theming:** Custom theme implementation using CSS variables and the OKLCH color space.
