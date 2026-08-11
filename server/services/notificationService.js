import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';
import { logger } from '../utils/logger.js';

/**
 * Sends an email notification using configured SMTP credentials.
 * Also logs the notification attempt to the database.
 * 
 * @param {Object} settings - Settings object containing SMTP credentials
 * @param {Object} notificationDetails - Subject and body of email
 * @returns {Promise<boolean>} - Success state
 */
export const sendEmailNotification = async (settings, { subject, body }) => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, emailAddress } = settings;

  logger.info(`Attempting to send email notification to: ${emailAddress}`);

  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports (587, etc.)
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // We increase timeout and allow self-signed certificates in dev
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"MS Rewards Notifier" <${smtpUser}>`,
    to: emailAddress,
    subject: subject,
    text: body,
    // Add simple HTML styling for premium appearance
    html: `
      <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; background-color: #f9f9f9; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
        <div style="text-align: center; border-bottom: 2px solid #0d6efd; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #0d6efd; margin: 0; font-size: 24px;">Microsoft Rewards Alert</h2>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          The Microsoft Rewards Croma Gift Card appears to be back in stock.
        </p>
        <div style="background-color: #e8f0fe; border-left: 4px solid #0d6efd; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <strong style="color: #0d6efd; font-size: 16px;">The Redeem button is now enabled.</strong>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          Open Microsoft Rewards immediately to redeem it.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${settings.rewardUrl}" target="_blank" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(13, 110, 253, 0.2);">Redeem Rewards Now</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 30px 0 15px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center; margin: 0;">
          This is an automated notification from your MS Rewards Availability Notifier.
        </p>
      </div>
    `
  };

  try {
    // 2. Verify connection configuration first (optional but good for debugging)
    // await transporter.verify();

    // 3. Send mail
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully. Message ID: ${info.messageId}`);

    // 4. Save to database
    await Notification.create({
      type: 'EMAIL',
      subject: subject,
      body: body,
      status: 'SENT'
    });

    return true;
  } catch (error) {
    logger.error(`Failed to send email notification: ${error.message}`);
    
    // Save failed notification to database
    await Notification.create({
      type: 'EMAIL',
      subject: subject,
      body: body,
      status: 'FAILED',
      error: error.message
    });

    return false;
  }
};

/**
 * Convenience method to send the Croma availability email.
 */
export const sendCromaAvailableNotification = async (settings) => {
  const subject = 'Microsoft Rewards - Croma Gift Card Available';
  const body = `The Microsoft Rewards Croma Gift Card appears to be back in stock.\n\nThe Redeem button is now enabled.\n\nOpen Microsoft Rewards immediately to redeem it.\n\nLink: ${settings.rewardUrl}`;
  return sendEmailNotification(settings, { subject, body });
};
