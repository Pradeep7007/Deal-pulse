# Deployment Guide

This guide details how to deploy the Microsoft Rewards Croma Gift Card Availability Notifier to a production environment.

---

## Deployment Option 1: Docker Compose (Recommended)

Docker is the easiest way to deploy this application because it encapsulates all Playwright Chromium browser system dependencies automatically.

### Production Setup Steps

1.  **Clone the project** onto your production server.
2.  **Configure environment variables**:
    Create a `.env` file in the root directory. Modify the variables for production, specifying your real SMTP credentials, destination email, and MongoDB URI.
    ```env
    PORT=5000
    MONGODB_URI=mongodb://mongodb:27017/rewards
    REWARDS_URL=https://rewards.bing.com/redeem/000702000287
    CHECK_INTERVAL=5
    BROWSER_PROFILE_PATH=/app/browser-profile
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your-email@gmail.com
    SMTP_PASS=your-app-password
    EMAIL_TO=recipient-email@gmail.com
    NODE_ENV=production
    ```
3.  **Launch the containers**:
    Run Docker Compose in detached mode:
    ```bash
    docker-compose up --build -d
    ```
4.  **Complete Authentication**:
    Because the application runs in a container, you must complete the initial login flow.
    *   If your server has a GUI, you can click **Open Browser for Login** from the settings page, which will launch the browser window on the server.
    *   If your server is headless (CLI only), you can run a local instance of Chromium on your personal computer with the same browser profile folder, log in there, and copy the `browser-profile` folder over to your server's mapped docker volume directory!
    *   Alternatively, you can run the Docker container with VNC or X11 forwarding enabled, though copying the local `browser-profile` folder is usually the fastest method.

---

## Deployment Option 2: PM2 (Process Manager) on VPS

If you prefer to run the application directly on a Linux VPS (Ubuntu/Debian) without Docker, follow these steps.

### Prerequisites

Install system dependencies for Playwright on your server:
```bash
sudo npx playwright install-deps chromium
```

### Installation & Build

1.  **Clone code and install dependencies**:
    ```bash
    npm install
    npx -w server playwright install chromium
    ```

2.  **Build the Frontend**:
    Compile the Vite assets into static files:
    ```bash
    npm run build
    ```
    This builds the frontend React 19 app and places it inside `client/dist`. The Express server will automatically serve these files.

3.  **Deploy using PM2**:
    Install PM2 globally if you haven't:
    ```bash
    sudo npm install pm2 -g
    ```
    Start the server process from the root directory:
    ```bash
    NODE_ENV=production pm2 start server/server.js --name "rewards-notifier"
    ```

4.  **Manage PM2 logs and restarts**:
    ```bash
    pm2 save
    pm2 startup
    pm2 logs rewards-notifier
    ```

---

## Production Security & Best Practices

1.  **Do Not Commit `.env`**: Make sure `.env` is listed in your `.gitignore` file and never pushed to public repositories.
2.  **SMTP Passwords**: Never use your primary Gmail password. Always generate a dedicated 16-character **App Password** via Google Accounts -> Security -> 2-Step Verification -> App Passwords.
3.  **Reverse Proxy**: In production, it is best practice to run Nginx or Caddy in front of the application on port 80/443, proxying requests to port 5000, and enabling SSL/HTTPS certificates (e.g. using Let's Encrypt).
4.  **Browser Profile Volume Persistence**: Always ensure the volume `/app/browser-profile` is backed up or persistent, as losing this volume requires re-authenticating the Microsoft Account.
