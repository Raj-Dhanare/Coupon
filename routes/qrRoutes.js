const express = require('express');
const QRCode = require('QRCode');
const { v4: uuidv4 } = require('uuid');
const QRSession = require('../models/QRSession');
const { protect } = require('../middleware/authmiddleware');
const router = express.Router();

// POST /api/qr/generate — generate QR for coupon approval
router.post('/generate', protect, async (req, res) => {
  try {
    const { billId, couponCode, discount, finalAmount, customerPhone } = req.body;
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.QR_EXPIRE_MINUTES) || 10) * 60 * 1000);

    await QRSession.create({ token, billId, couponCode, discount, finalAmount, customerPhone, expiresAt });

    const qrData = JSON.stringify({
      token,
      couponCode,
      discount,
      finalAmount,
      approveUrl: `http://localhost:5173/approve/${token}`
    });

    const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    res.json({ success: true, token, qrImage, expiresAt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/qr/session/:token — get session info (for customer approval page)
router.get('/session/:token', async (req, res) => {
  try {
    const session = await QRSession.findOne({ token: req.params.token }).populate('billId');
    if (!session)
      return res.status(404).json({ success: false, message: 'Invalid QR token' });
    if (new Date() > session.expiresAt || session.status === 'expired')
      return res.status(410).json({ success: false, message: 'QR code has expired' });
    if (session.status !== 'pending')
      return res.status(400).json({ success: false, message: `Already ${session.status}`, status: session.status });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/qr/respond/:token — customer approves or declines
router.post('/respond/:token', async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'decline'
    const session = await QRSession.findOne({ token: req.params.token });
    if (!session)
      return res.status(404).json({ success: false, message: 'Invalid token' });
    if (new Date() > session.expiresAt)
      return res.status(410).json({ success: false, message: 'QR expired' });
    if (session.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Already responded' });

    session.status = action === 'approve' ? 'approved' : 'declined';
    session.respondedAt = new Date();
    await session.save();

    res.json({ success: true, status: session.status, token: req.params.token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/qr/status/:token — cashier polls this to check customer response
router.get('/status/:token', protect, async (req, res) => {
  try {
    const session = await QRSession.findOne({ token: req.params.token });
    if (!session)
      return res.status(404).json({ success: false, message: 'Not found' });
    if (new Date() > session.expiresAt && session.status === 'pending') {
      session.status = 'expired';
      await session.save();
    }
    res.json({ success: true, status: session.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;