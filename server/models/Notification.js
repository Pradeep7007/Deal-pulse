import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  type: {
    type: String,
    required: true,
    default: 'EMAIL',
    enum: ['EMAIL', 'TELEGRAM', 'DISCORD']
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true, // SENT, FAILED
    enum: ['SENT', 'FAILED']
  },
  error: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
