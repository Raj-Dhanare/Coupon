const express = require('express');
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/authmiddleware');
const router = express.Router();

// POST /api/coupons/validate
router.post('/validate', protect, async (req, res) => {
  const { code, orderAmount } = req.body;
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.isActive)
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon' });
    if (new Date() > coupon.expiryDate)
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    if (coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    if (orderAmount < coupon.minOrderAmount)
      return res.status(400).json({
        success: false,
        message: `Minimum order ₹${coupon.minOrderAmount} required`
      });
    const discount = coupon.calculateDiscount(orderAmount);
    res.json({
      success: true,
      coupon: { id: coupon._id, code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
      discount,
      finalAmount: orderAmount - discount,
      message: `Coupon valid! You save ₹${discount}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coupons
router.get('/', protect, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coupons
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/coupons/:id/toggle
router.patch('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/coupons/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;