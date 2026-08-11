import mongoose from 'mongoose';

const MonitorStateSchema = new mongoose.Schema({
  isMonitoring: {
    type: Boolean,
    required: true,
    default: false
  },
  lastChecked: {
    type: Date,
    default: null
  },
  lastStatus: {
    type: String,
    default: null // SUCCESS, FAILED
  },
  lastButtonState: {
    type: String,
    default: 'UNKNOWN', // ENABLED, DISABLED, UNKNOWN
    enum: ['ENABLED', 'DISABLED', 'UNKNOWN']
  },
  lastError: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Ensure only one monitor state document exists
MonitorStateSchema.statics.getState = async function () {
  let state = await this.findOne();
  if (!state) {
    state = await this.create({
      isMonitoring: false,
      lastChecked: null,
      lastStatus: null,
      lastButtonState: 'UNKNOWN',
      lastError: null
    });
  }
  return state;
};

export default mongoose.model('MonitorState', MonitorStateSchema);
