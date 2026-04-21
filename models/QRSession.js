const mongoose = require('mongoose');

const qrSessionSchema = new mongoose.Schema({
  token:      { type: String, required: true, unique: true },
  billId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  couponCode: { type: String, required: true },
  discount:   { type: Number, required: true },
  finalAmount:{ type: Number, required: true },
  customerPhone:{ type: String, required: true },
  status:     { type: String, enum: ['pending', 'approved', 'declined', 'expired'], default: 'pending' },
  expiresAt:  { type: Date, required: true },
  respondedAt:{ type: Date }
}, { timestamps: true });

module.exports = mongoose.model('QRSession', qrSessionSchema);