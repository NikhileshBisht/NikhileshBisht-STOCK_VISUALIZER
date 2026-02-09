import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    LockOutlined,
    SafetyOutlined, // For OTP
    CheckCircleTwoTone,
    EyeInvisibleOutlined,
    EyeTwoTone
} from '@ant-design/icons';
import './Auth.css';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [loadingVerify, setLoadingVerify] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false);

    const navigate = useNavigate();
    const [form] = Form.useForm();

    const handleSendOtp = async () => {
        if (!email) {
            message.warning('Please enter an email first');
            return;
        }
        setLoadingOtp(true);
        try {
            const response = await fetch('http://localhost:5000/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                message.success(data.message);
                setIsOtpSent(true);
            } else {
                message.error(data.message);
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            message.error('Failed to send OTP');
        } finally {
            setLoadingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            message.warning('Please enter the OTP');
            return;
        }
        setLoadingVerify(true);
        try {
            const response = await fetch('http://localhost:5000/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await response.json();
            if (response.ok) {
                message.success(data.message);
                setIsVerified(true);
            } else {
                message.error(data.message);
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            message.error('Failed to verify OTP');
        } finally {
            setLoadingVerify(false);
        }
    };

    const handleRegister = async () => {
        setLoadingRegister(true);
        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                message.success('Registration successful! Please login.');
                navigate('/login');
            } else {
                message.error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
            message.error('An error occurred during registration');
        } finally {
            setLoadingRegister(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Moving Clouds Background */}
            <div className="clouds"></div>
            <div className="clouds clouds-second"></div>

            <div className="auth-card" style={{ maxWidth: 450 }}>
                <div className="auth-header">
                    <div className="auth-icon">
                        <UserOutlined />
                    </div>
                    <h2 className="auth-title">Create an account</h2>
                    <p className="auth-subtitle">
                        Join us today! Enter your details below.
                    </p>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleRegister}
                    requiredMark={false}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please choose a username!' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="site-form-item-icon" style={{ color: '#bfbfbf' }} />}
                            placeholder="Username"
                            className="custom-input"
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Email Address"
                        required
                        style={{ marginBottom: 12 }}
                    >
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Input
                                prefix={<MailOutlined className="site-form-item-icon" style={{ color: '#bfbfbf' }} />}
                                placeholder="name@example.com"
                                className="custom-input"
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isVerified} // Lock email after verification
                                value={email}
                            />
                            {!isVerified && (
                                <Button
                                    onClick={handleSendOtp}
                                    loading={loadingOtp}
                                    type="default"
                                    style={{ borderRadius: '8px' }}
                                >
                                    {isOtpSent ? 'Resend' : 'Verify'}
                                </Button>
                            )}
                            {isVerified && <Button type="text" icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} />}
                        </div>
                    </Form.Item>

                    {isOtpSent && !isVerified && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                            <Input
                                prefix={<SafetyOutlined className="site-form-item-icon" style={{ color: '#bfbfbf' }} />}
                                placeholder="Enter OTP"
                                className="custom-input"
                                onChange={(e) => setOtp(e.target.value)}
                                value={otp}
                            />
                            <Button
                                onClick={handleVerifyOtp}
                                loading={loadingVerify}
                                type="primary"
                                style={{ borderRadius: '8px' }}
                            >
                                Check
                            </Button>
                        </div>
                    )}

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please choose a password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon" style={{ color: '#bfbfbf' }} />}
                            placeholder="Password"
                            className="custom-input"
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            className="auth-button"
                            disabled={!isVerified}
                            loading={loadingRegister}
                        >
                            Create Account
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
                    Already have an account? <Link to="/login" style={{ fontWeight: '600', color: '#1a1a1a' }}>Log in</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
