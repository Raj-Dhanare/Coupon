const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, required: true, unique: true, trim: true },
  email:       { type: String, default: '', trim: true },
  totalOrders: { type: Number, default: 0 },
  totalSpent:  { type: Number, default: 0 },
  coupons: [{
    couponId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    code:      { type: String },
    isUsed:    { type: Boolean, default: false },
    usedAt:    { type: Date },
    assignedAt:{ type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);