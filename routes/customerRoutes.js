const express = require('express');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/authmiddleware');
const router = express.Router();

// GET /api/customers/phone/:phone — lookup by phone + return coupons
router.get('/phone/:phone', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone })
      .populate('coupons.couponId');
    if (!customer)
      return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/customers — all customers
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/customers — create customer
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (await Customer.findOne({ phone }))
      return res.status(400).json({ success: false, message: 'Phone already registered' });
    const customer = await Customer.create({ name, phone, email });
    res.status(201).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/customers/:id/assign-coupon
router.post('/:id/assign-coupon', protect, async (req, res) => {
  try {
    const { couponCode } = req.body;
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon)
      return res.status(404).json({ success: false, message: 'Coupon not found or inactive' });
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ success: false, message: 'Customer not found' });
    const already = customer.coupons.find(c => c.code === couponCode.toUpperCase() && !c.isUsed);
    if (already)
      return res.status(400).json({ success: false, message: 'Coupon already assigned' });
    customer.coupons.push({ couponId: coupon._id, code: coupon.code });
    await customer.save();
    res.json({ success: true, message: 'Coupon assigned', customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;