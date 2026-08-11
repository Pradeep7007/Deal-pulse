# Installation Guide

Follow these steps to set up the Microsoft Rewards Croma Gift Card Availability Notifier on your local machine.

## Prerequisites

Before starting, make sure you have the following installed on your system:

1.  **Node.js**: Version 18.0.0 or higher (Node 22 is recommended).
2.  **npm**: Version 8.0.0 or higher (comes bundled with Node.js).
3.  **MongoDB**: A running local MongoDB instance (e.g., `mongodb://localhost:27017`) or a MongoDB Atlas cloud connection string.
4.  **Gmail Account**: For sending email notifications. You will need to generate a Google **App Password** (OAuth is not required, simple SMTP with App Password works).

---

## Step-by-Step Local Setup

### Step 1: Clone or Open the Project
Ensure the project folder structure is in place inside your workspace.

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory by copying the `.env.example` file:
```bash
cp .env.example .env
```
Open `.env` in a text editor and fill in the values:
*   `MONGODB_URI`: Your MongoDB connection string.
*   `REWARDS_URL`: The URL of the Microsoft Rewards redemption page for the Croma Gift Card.
*   `CHECK_INTERVAL`: Polling frequency in minutes (e.g., `5` to check every 5 minutes).
*   `BROWSER_PROFILE_PATH`: Path to save browser profile data (e.g., `./browser-profile`).
*   `SMTP_USER` / `SMTP_PASS`: Your Gmail address and Google App Password (not your primary password).
*   `EMAIL_TO`: The email address where you want to receive alerts.

### Step 3: Install Dependencies
Run the following command from the root directory to install all packages for both the client (React 19) and server (Node/Express):
```bash
npm install
```
This leverages NPM Workspaces to perform a unified installation.

### Step 4: Install Playwright Chromium Engine
Playwright needs browser binaries to perform headless checks. Install the Chromium browser by running:
```bash
npx -w server playwright install chromium
```
*Note: If you run into network resolution errors while downloading, verify your internet connection or DNS settings and re-run the command.*

### Step 5: Start the Application
Run the following command from the root directory to start the development servers:
```bash
npm run dev
```
This runs the frontend on `http://localhost:3000` and the backend server on `http://localhost:5000` concurrently.

---

## Verification & Manual Login

1.  Open your browser and navigate to `http://localhost:3000`.
2.  Go to the **Settings** page.
3.  Verify all information is correct.
4.  Click the **Open Browser for Login** button.
5.  A Chromium browser will open. Navigate to the Microsoft login page, enter your credentials, and solve any CAPTCHAs.
6.  Once you see your Microsoft Rewards page logged in, **close the browser**. Your login state is now saved to `./browser-profile`.
7.  Click **Check Now** on the dashboard to test a manual run. Verify that no login prompts appear in the logs.
8.  Click **Start Monitoring** to activate the background cron scheduler.
