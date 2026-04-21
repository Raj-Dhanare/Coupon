const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:     { type: String, default: '' },
  discountType:    { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue:   { type: Number, required: true },
  minOrderAmount:  { type: Number, default: 0 },
  maxUsage:        { type: Number, default: null },
  usedCount:       { type: Number, default: 0 },
  expiryDate:      { type: Date, required: true },
  isActive:        { type: Boolean, default: true },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

couponSchema.methods.calculateDiscount = function(orderAmount) {
  if (this.discountType === 'percentage') {
    return Math.round((orderAmount * this.discountValue) / 100);
  }
  return Math.min(this.discountValue, orderAmount);
};

module.exports = mongoose.model('Coupon', couponSchema);