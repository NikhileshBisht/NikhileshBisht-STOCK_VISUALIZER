const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_super_secret_key_change_this_for_production';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(bodyParser.json());



// Register Endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    try {
        // Check if user already exists
        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('*')
            .or(`username.eq.${username},email.eq.${email}`);

        if (checkError) throw checkError;

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ message: 'User or email already exists' });
        }

        // Insert new user
        const { data, error: insertError } = await supabase
            .from('users')
            .insert([{ username, email, password }]) // In a real app, hash the password!
            .select();

        if (insertError) throw insertError;

        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.status(201).json({ message: 'User created successfully', token, user: { username } });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password); // Plain text check as per previous logic

        if (error) throw error;

        const user = users && users.length > 0 ? users[0] : null;

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token, user: { username } });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// In-memory OTP store (Use Redis or DB in production)
const otpStore = {};

// Nodemailer Transporter
const nodemailer = require('nodemailer');


// Transporter for Gmail
// IMPORTANT: If you have 2FA enabled on your Gmail account, you MUST use an App-Specific Password
// To generate one: https://myaccount.google.com/apppasswords
// The EMAIL_PASS in your .env file should be the 16-character app-specific password, NOT your regular password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter verification failed:', error.message);
        if (error.code === 'EAUTH') {
            console.error('\n⚠️  GMAIL AUTHENTICATION ERROR ⚠️');
            console.error('If you have 2FA enabled, you need to use an App-Specific Password.');
            console.error('Steps to fix:');
            console.error('1. Go to: https://myaccount.google.com/apppasswords');
            console.error('2. Generate a new app password for "Mail"');
            console.error('3. Copy the 16-character password');
            console.error('4. Update EMAIL_PASS in your .env file with this app-specific password');
            console.error('5. Make sure EMAIL_USER is set to your Gmail address\n');
        }
    } else {
        console.log('✅ Email transporter is ready to send emails');
    }
});

app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (error) throw error;

        if (users && users.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }
    } catch (error) {
        console.error('Error checking email:', error);
        return res.status(500).json({ message: 'Internal server error checking email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;

    console.log(`[DEV] OTP for ${email}: ${otp}`);  

    try {
        await transporter.sendMail({
            from: `"MyApp" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is: ${otp}`
        });
        res.json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        console.error('Error sending email:', error);

        // Provide helpful error message for authentication issues
        if (error.code === 'EAUTH') {
            return res.status(500).json({
                message: 'Email authentication failed. Please check your email configuration. If you have 2FA enabled, use an App-Specific Password.',
                error: 'Authentication error'
            });
        }

        res.status(500).json({ message: 'Failed to send OTP email' });
    }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStore[email] === otp) {
        delete otpStore[email]; // Clear OTP after use
        res.json({ message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
