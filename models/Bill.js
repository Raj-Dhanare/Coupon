const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber:   { type: String, unique: true },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone:{ type: String, default: '' },
  items: [{
    name:     { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price:    { type: Number, required: true },
    total:    { type: Number, required: true }
  }],
  subtotal:      { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },
  couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponCode:    { type: String, default: '' },
  qrToken:       { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'qr_sent', 'approved', 'declined', 'completed'],
    default: 'pending'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

billSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    const count = await this.constructor.countDocuments();
    this.billNumber = 'BILL' + String(count + 1).padStart(5, '0');
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);