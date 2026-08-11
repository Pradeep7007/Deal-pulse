import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';

/**
 * Ensures the browser profile directory exists.
 */
const ensureProfileDir = (profilePath) => {
  const resolvedPath = path.resolve(profilePath);
  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
    logger.info(`Created browser profile directory at: ${resolvedPath}`);
  }
  return resolvedPath;
};

/**
 * Checks the reward availability of the gift card page.
 * @param {Object} settings - Database settings object
 * @returns {Promise<Object>} - Object with status, buttonState, responseTime, and error
 */
export const checkRewardAvailability = async (settings) => {
  const { rewardUrl, browserProfilePath } = settings;
  const profilePath = ensureProfileDir(browserProfilePath);
  
  const startTime = Date.now();
  let browserContext = null;
  let attempts = 0;
  const maxAttempts = 3;
  let lastError = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      logger.info(`Checking rewards status (Attempt ${attempts}/${maxAttempts})...`);
      
      // Launch persistent context
      browserContext = await chromium.launchPersistentContext(profilePath, {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled' // Helps bypass bot detection
        ],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      const page = await browserContext.newPage();
      
      // Set viewport
      await page.setViewportSize({ width: 1280, height: 800 });
      
      // Navigate to URL and wait for page load
      // Using 'domcontentloaded' wait to avoid long wait for tracking scripts
      const response = await page.goto(rewardUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000 // 30s timeout
      });

      if (!response || response.status() >= 400) {
        throw new Error(`Failed to load page. HTTP Status: ${response ? response.status() : 'No response'}`);
      }

      // Explicitly wait for the page element to be present
      // We look for common container or text
      await page.waitForSelector('body', { timeout: 10000 });

      // Run evaluation to find the redeem button and check its state
      const buttonInfo = await page.evaluate(() => {
        // Broad search for button elements
        const elements = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a, [role="button"], #redeem-now-button'));
        
        // Find element that contains "redeem" or "claim" (case insensitive)
        const redeemElements = elements.filter(el => {
          const text = (el.textContent || el.value || '').toLowerCase();
          return text.includes('redeem');
        });

        if (redeemElements.length === 0) {
          // Fallback: look for button with class containing 'redeem' or ID containing 'redeem'
          const fallbackBtn = document.querySelector('[class*="redeem" i], [id*="redeem" i]');
          if (fallbackBtn) {
            redeemElements.push(fallbackBtn);
          }
        }

        if (redeemElements.length === 0) {
          return { found: false, error: 'Redeem button not found on page' };
        }

        // Pick the best match (first element)
        const btn = redeemElements[0];

        // Determine availability using button state only:
        // Unavailable when: button.disabled == true OR disabled attribute exists OR data-disabled == "true"
        const hasDisabledAttr = btn.hasAttribute('disabled');
        const isDisabledProp = btn.disabled === true;
        const isDataDisabled = btn.getAttribute('data-disabled') === 'true' || btn.getAttribute('aria-disabled') === 'true';
        const hasDisabledClass = btn.classList.contains('disabled') || btn.classList.contains('btn-disabled');

        const isDisabled = hasDisabledAttr || isDisabledProp || isDataDisabled || hasDisabledClass;

        return {
          found: true,
          tagName: btn.tagName,
          text: (btn.textContent || btn.value || '').trim(),
          isDisabled: isDisabled,
          outerHTML: btn.outerHTML.substring(0, 300) // debugging snippet
        };
      });

      // Close browser context before processing results
      await browserContext.close();
      browserContext = null;

      const responseTime = Date.now() - startTime;

      if (!buttonInfo.found) {
        logger.warn(`Redeem button search completed: ${buttonInfo.error}`);
        return {
          status: 'SUCCESS',
          buttonState: 'UNKNOWN',
          responseTime,
          error: buttonInfo.error
        };
      }

      logger.info(`Redeem button found. Text: "${buttonInfo.text}". Disabled: ${buttonInfo.isDisabled}`);
      return {
        status: 'SUCCESS',
        buttonState: buttonInfo.isDisabled ? 'DISABLED' : 'ENABLED',
        responseTime,
        error: null
      };

    } catch (error) {
      logger.error(`Error in check attempt ${attempts}: ${error.message}`);
      lastError = error.message;

      // Close context in case of error
      if (browserContext) {
        try {
          await browserContext.close();
        } catch (closeError) {
          logger.error(`Error closing browser context: ${closeError.message}`);
        }
        browserContext = null;
      }

      // If this was not the last attempt, wait briefly before retrying
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // All retries failed
  const responseTime = Date.now() - startTime;
  logger.error(`All ${maxAttempts} check attempts failed. Last error: ${lastError}`);
  return {
    status: 'FAILED',
    buttonState: 'UNKNOWN',
    responseTime,
    error: lastError
  };
};

/**
 * Launches headful browser context to allow manual user login.
 * Keeps browser open for user action, returning when closed.
 */
export const launchLoginBrowser = async (settings) => {
  const { rewardUrl, browserProfilePath } = settings;
  const profilePath = ensureProfileDir(browserProfilePath);

  logger.info(`Launching login browser with profile: ${profilePath}`);
  
  // Launch persistent context in headful mode (headless: false)
  const browserContext = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await browserContext.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  logger.info(`Navigating user to reward URL for manual login: ${rewardUrl}`);
  await page.goto(rewardUrl);

  // Return a promise that resolves when the browser is closed by the user
  return new Promise((resolve) => {
    browserContext.on('close', () => {
      logger.info('Login browser context closed.');
      resolve(true);
    });

    // Automatically close browser after 10 minutes to prevent resource leak
    setTimeout(async () => {
      try {
        await browserContext.close();
        logger.info('Login browser auto-closed after timeout.');
        resolve(true);
      } catch (e) {
        // context might already be closed
        resolve(true);
      }
    }, 600000); // 10 minutes
  });
};
