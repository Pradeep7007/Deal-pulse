# Microsoft Rewards Croma Gift Card Availability Notifier

A complete, production-ready, full-stack application designed to monitor the Microsoft Rewards Croma Gift Card redemption page and notify you immediately via email (using Gmail SMTP) when the reward becomes available (the "Redeem now" button is enabled).

---

## 🌟 Features

*   **Professional Bootstrap Dashboard**: Sleek, modern dark-themed responsive UI with active monitoring status indicators, diagnostic cards, logs history, and SMTP notifications timeline.
*   **Dynamic Monitoring Controls**: Start, stop, or trigger manual checks of the rewards availability instantly from the dashboard.
*   **Authentication Helper**: Launch an interactive browser session to log in to your Microsoft Account manually, saving cookies to the persistent profile so future background crawling works seamlessly.
*   **Robust Playwright Crawler**: Evaluates the true disabled/enabled state of the button. Ignores restock notification texts and targets the button attributes directly.
*   **State-Transition Alert Logic**: Sends email notifications *only* when the gift card availability transitions from `DISABLED`/`UNKNOWN` to `ENABLED`, preventing spam.
*   **Comprehensive Diagnostics**: Stores all checks, response times, errors, and email transmission histories in MongoDB for analytics.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, Bootstrap 5, Bootstrap Icons, React Router DOM, Axios
*   **Backend**: Node.js, Express.js, MongoDB + Mongoose, Playwright (Chromium)
*   **Alerts**: Nodemailer (Gmail SMTP)
*   **Logging**: Winston + Morgan

---

## 📂 Folder Structure

```text
rewards/
├── client/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── logController.js
│   │   ├── monitorController.js
│   │   ├── notificationController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   └── validation.js
│   ├── models/
│   │   ├── Log.js
│   │   ├── MonitorState.js
│   │   ├── Notification.js
│   │   └── Settings.js
│   ├── routes/
│   │   └── api.js
│   ├── services/
│   │   ├── notificationService.js
│   │   ├── playwrightService.js
│   │   └── schedulerService.js
│   ├── utils/
│   │   └── logger.js
│   ├── package.json
│   └── server.js
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

1.  **Configure Environment Variables**:
    Copy the `.env.example` file to `.env` and fill in your MongoDB URI, target Rewards URL, and Gmail SMTP settings:
    ```bash
    cp .env.example .env
    ```

2.  **Install All Dependencies**:
    Run `npm install` from the root workspace directory. This will automatically install dependencies for both the `client` and `server` packages.
    ```bash
    npm install
    ```

3.  **Install Playwright Browser Binary**:
    Download the Chromium engine required for crawling:
    ```bash
    npx -w server playwright install chromium
    ```

4.  **Run Development Servers**:
    Launch both the Vite client dev server (port 3000) and Express server (port 5000) concurrently:
    ```bash
    npm run dev
    ```

5.  **Open the Web Dashboard**:
    Navigate to `http://localhost:3000` in your web browser.

---

## 🔒 Microsoft Rewards Authentication Guide

Microsoft Rewards requires an authenticated session to view redemption details. To log in and cache your session cookies:

1.  Navigate to the **Settings** page on the dashboard.
2.  Review/save your configuration (make sure the **Chrome User Profile Directory** is set, e.g., `./browser-profile`).
3.  Under **Authentication Helper**, click the **Open Browser for Login** button.
4.  This opens a visible Chromium browser window on your host machine.
5.  Log in manually to your Microsoft account. Complete any two-factor authentication or CAPTCHAs.
6.  Once you see your Microsoft Rewards redeem page successfully logged in, **close the browser window**.
7.  The application will reuse these authenticated session cookies for all subsequent scheduled checks!

---

## 🐳 Docker Deployment

The application is fully containerized. A Named volume is utilized to persist the browser profile, ensuring you don't lose your login session when containers restart.

To run using Docker Compose:
```bash
docker-compose up --build -d
```
The application will be accessible at `http://localhost:5000` (combining frontend and backend).

---

## 📝 License

This project is open-source and free to use.
