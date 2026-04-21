const express = require('express');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/authmiddleware');
const router = express.Router();

// POST /api/bills — create bill
router.post('/', protect, async (req, res) => {
  try {
    const { items, customerPhone, customerName } = req.body;
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    let customer = null;
    if (customerPhone) {
      customer = await Customer.findOne({ phone: customerPhone });
    }
    const bill = await Bill.create({
      customer: customer?._id || null,
      customerName: customer?.name || customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items,
      subtotal,
      discount: 0,
      totalAmount: subtotal,
      status: 'pending',
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/bills/:id/finalize — finalize bill after QR decision
router.patch('/:id/finalize', protect, async (req, res) => {
  try {
    const { discount, couponCode, couponId, status } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    bill.discount = discount || 0;
    bill.totalAmount = bill.subtotal - (discount || 0);
    bill.couponCode = couponCode || '';
    bill.couponApplied = couponId || null;
    bill.status = status;

    if (status === 'approved' && couponId) {
      await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
      if (bill.customer) {
        await Customer.updateOne(
          { _id: bill.customer, 'coupons.code': couponCode },
          { $set: { 'coupons.$.isUsed': true, 'coupons.$.usedAt': new Date() },
            $inc: { totalOrders: 1, totalSpent: bill.totalAmount } }
        );
      }
    } else if (status === 'completed' || status === 'declined') {
      if (bill.customer) {
        await Customer.findByIdAndUpdate(bill.customer, {
          $inc: { totalOrders: 1, totalSpent: bill.totalAmount }
        });
      }
    }

    await bill.save();
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bills — all bills
router.get('/', protect, async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 }).limit(50).populate('customer', 'name phone');
    res.json({ success: true, bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bills/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('customer').populate('couponApplied');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;