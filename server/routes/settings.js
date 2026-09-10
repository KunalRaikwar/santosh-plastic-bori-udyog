const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { auth } = require('../middleware/auth');

// Get settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'सेटिंग्स लाने में समस्या हुई।', error: error.message });
  }
});

// Update settings
router.put('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    const { businessName, address, mobile, gstNumber, invoicePrefix, defaultPaymentMode, currency } = req.body;
    if (businessName !== undefined) settings.businessName = businessName;
    if (address !== undefined) settings.address = address;
    if (mobile !== undefined) settings.mobile = mobile;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (invoicePrefix !== undefined) settings.invoicePrefix = invoicePrefix;
    if (defaultPaymentMode !== undefined) settings.defaultPaymentMode = defaultPaymentMode;
    if (currency !== undefined) settings.currency = currency;
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'सेटिंग्स अपडेट करने में समस्या हुई।', error: error.message });
  }
});

module.exports = router;
