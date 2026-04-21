const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User     = require('./models/User');
const Customer = require('./models/Customer');
const Coupon   = require('./models/Coupon');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany();
  await Customer.deleteMany();
  await Coupon.deleteMany();

  const admin = await User.create({ name: 'Admin User', email: 'admin@shop.com', password: 'admin123', role: 'admin' });
  await User.create({ name: 'Cashier One', email: 'cashier@shop.com', password: 'cashier123', role: 'cashier' });

  const coupons = await Coupon.insertMany([
    { code: 'SAVE20', description: '20% off on orders above ₹500', discountType: 'percentage', discountValue: 20, minOrderAmount: 500, maxUsage: 100, expiryDate: '2027-12-31', createdBy: admin._id },
    { code: 'FLAT150', description: '₹150 off on orders above ₹1000', discountType: 'flat', discountValue: 150, minOrderAmount: 1000, maxUsage: 50, expiryDate: '2027-06-30', createdBy: admin._id },
    { code: 'WELCOME10', description: '10% off - welcome coupon', discountType: 'percentage', discountValue: 10, minOrderAmount: 0, maxUsage: null, expiryDate: '2027-12-31', createdBy: admin._id },
    { code: 'MEGA30', description: '30% off on orders above ₹2000', discountType: 'percentage', discountValue: 30, minOrderAmount: 2000, maxUsage: 20, expiryDate: '2027-03-31', createdBy: admin._id },
    { code: 'FLAT200', description: '₹200 off on orders above ₹800', discountType: 'flat', discountValue: 200, minOrderAmount: 800, maxUsage: 30, expiryDate: '2027-09-30', createdBy: admin._id },
  ]);

  await Customer.insertMany([
    {
      name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@email.com',
      coupons: [
        { couponId: coupons[0]._id, code: 'SAVE20' },
        { couponId: coupons[1]._id, code: 'FLAT150' }
      ]
    },
    {
      name: 'Priya Singh', phone: '8765432109', email: 'priya@email.com',
      coupons: [{ couponId: coupons[2]._id, code: 'WELCOME10' }]
    },
    {
      name: 'Amit Kumar', phone: '7654321098',
      coupons: []
    },
    {
      name: 'Sunita Devi', phone: '9999999999', email: 'sunita@email.com',
      coupons: [
        { couponId: coupons[3]._id, code: 'MEGA30' },
        { couponId: coupons[4]._id, code: 'FLAT200' },
        { couponId: coupons[2]._id, code: 'WELCOME10' }
      ]
    },
  ]);

  console.log('Seed complete!');
  console.log('Admin login:   admin@shop.com / admin123');
  console.log('Cashier login: cashier@shop.com / cashier123');
  console.log('Test phones:   9876543210, 8765432109, 7654321098, 9999999999');
  mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });