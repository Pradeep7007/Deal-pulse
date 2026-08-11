import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    required: true, // SUCCESS, FAILED
    enum: ['SUCCESS', 'FAILED']
  },
  buttonState: {
    type: String,
    required: true, // ENABLED, DISABLED, UNKNOWN
    enum: ['ENABLED', 'DISABLED', 'UNKNOWN']
  },
  responseTime: {
    type: Number, // In milliseconds
    required: true
  },
  error: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Log', LogSchema);
