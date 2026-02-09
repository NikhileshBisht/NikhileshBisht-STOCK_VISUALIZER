import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Drawer, Form, Input, Button, Avatar, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import StockChart from './components/StockChart';

const { Header, Content } = Layout;

const LoginSuccess = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Space size="middle">
                    <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
                        Logout
                    </Button>
                    <UserOutlined style={{ fontSize: '20px', cursor: 'pointer' }} onClick={showDrawer} />
                </Space>
            </Header>
            <Content style={{ padding: '20px', overflow: 'auto' }}>
                <StockChart />
            </Content>
            <Drawer
                title="User Profile"
                placement="right"
                width="50%"
                onClose={onClose}
                open={open}
            >
                <Form layout="vertical" hideRequiredMark>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <Avatar size={100} icon={<UserOutlined />} />
                    </div>
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter user name' }]}
                    >
                        <Input placeholder="Please enter user name" />
                    </Form.Item>
                    <Form.Item
                        name="userid"
                        label="User ID"
                        rules={[{ required: true, message: 'Please enter user id' }]}
                    >
                        <Input placeholder="Please enter user id" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, message: 'Please enter email' }]}
                    >
                        <Input placeholder="Please enter email" />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Phone"
                        rules={[{ required: true, message: 'Please enter phone' }]}
                    >
                        <Input placeholder="Please enter phone" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="link" style={{ paddingLeft: 0 }}>Reset Password</Button>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" onClick={onClose}>
                                Save
                            </Button>
                            <Button onClick={onClose}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Drawer>
        </Layout>
    );
};

export default LoginSuccess;
