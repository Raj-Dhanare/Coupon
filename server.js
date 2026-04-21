const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/customers',require('./routes/customerRoutes'));
app.use('/api/coupons',  require('./routes/couponRoutes'));
app.use('/api/bills',    require('./routes/billRoutes'));
app.use('/api/qr',       require('./routes/qrRoutes'));

app.get('/', (req, res) => res.json({ message: 'Coupon System API Running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => { console.error('DB Error:', err); process.exit(1); });