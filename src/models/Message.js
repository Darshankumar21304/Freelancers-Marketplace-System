const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.Mixed, required: true },
  receiver_id: { type: mongoose.Schema.Types.Mixed, required: true },
  message_text: { type: String, default: '' },
  file_url: { type: String, default: null },
  room: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
