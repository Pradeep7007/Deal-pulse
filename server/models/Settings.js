import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  rewardUrl: {
    type: String,
    required: true,
    default: 'https://rewards.bing.com/redeem/000702000287'
  },
  pollingInterval: {
    type: Number,
    required: true,
    default: 5 // In minutes
  },
  emailAddress: {
    type: String,
    required: true,
    default: 'recipient-email@gmail.com'
  },
  smtpHost: {
    type: String,
    required: true,
    default: 'smtp.gmail.com'
  },
  smtpPort: {
    type: Number,
    required: true,
    default: 587
  },
  smtpUser: {
    type: String,
    required: true,
    default: 'your-email@gmail.com'
  },
  smtpPass: {
    type: String,
    required: true,
    default: 'your-app-password'
  },
  browserProfilePath: {
    type: String,
    required: true,
    default: './browser-profile'
  },
  isMonitoringEnabled: {
    type: Boolean,
    required: true,
    default: false
  }
}, { timestamps: true });

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      rewardUrl: process.env.REWARDS_URL || 'https://rewards.bing.com/redeem/000702000287',
      pollingInterval: parseInt(process.env.CHECK_INTERVAL || '5', 10),
      emailAddress: process.env.EMAIL_TO || 'recipient-email@gmail.com',
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER || 'your-email@gmail.com',
      smtpPass: process.env.SMTP_PASS || 'your-app-password',
      browserProfilePath: process.env.BROWSER_PROFILE_PATH || './browser-profile',
      isMonitoringEnabled: false
    });
  }
  return settings;
};

export default mongoose.model('Settings', SettingsSchema);
