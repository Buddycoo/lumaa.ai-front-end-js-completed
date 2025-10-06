const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const DASHBOARD_API = process.env.DASHBOARD_API || 'http://localhost:4001';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'landing-page' });
});

// Contact form submission - forwards to dashboard API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;
    
    // Forward to dashboard API to create admin notification
    await axios.post(`${DASHBOARD_API}/api/contact`, {
      name,
      email,
      phone,
      company,
      message
    });
    
    res.json({ 
      success: true,
      message: 'Thank you for contacting us! We\'ll get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit form. Please try again.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Landing Page Backend running on http://localhost:${PORT}`);
});