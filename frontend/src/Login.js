import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Divider, message } from 'antd';
import {
  GoogleOutlined,
  FacebookFilled,
  AppleFilled,
  LoginOutlined,
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import './Auth.css';

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: values.username, password: values.password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        message.success('Login successful!');
        navigate('/login-success');
      } else {
        message.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Moving Clouds Background Layers */}
      <div className="clouds"></div>
      <div className="clouds clouds-second"></div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <LoginOutlined />
          </div>
          <h2 className="auth-title">Sign in to your account</h2>
          <p className="auth-subtitle">
            Welcome back! Please enter your details to continue.
          </p>
        </div>

        <Form
          name="login_form"
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username!' }]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" style={{ color: '#bfbfbf' }} />}
              placeholder="Username"
              className="custom-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" style={{ color: '#bfbfbf' }} />}
              placeholder="Password"
              className="custom-input"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link to="/forgot-password" style={{ color: '#666', fontSize: '13px' }}>Forgot password?</Link>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" block className="auth-button" loading={loading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ color: '#999', fontSize: '12px' }}>Or sign in with</Divider>

        <div className="social-login-container">
          <div className="social-btn"><GoogleOutlined className="social-icon" style={{ color: '#DB4437' }} /></div>
          <div className="social-btn"><FacebookFilled className="social-icon" style={{ color: '#4267B2' }} /></div>
          <div className="social-btn"><AppleFilled className="social-icon" style={{ color: '#000' }} /></div>
        </div>

        <div style={{ marginTop: '25px', color: '#666', fontSize: '14px' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: '600', color: '#1a1a1a' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
