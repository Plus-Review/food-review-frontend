import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await apiClient.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.message || 'Login Gagal');
        }
    };

    return (
        <div style={styles.background}>
            <div style={styles.card}>
                <h1 style={styles.title}>LOGIN</h1>
                <form onSubmit={handleLogin} style={styles.form}>
                    <input 
                        type="email" 
                        placeholder="Masukkan alamat email" 
                        style={styles.input} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Masukkan password" 
                        style={styles.input} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" style={styles.button}>LOGIN</button>
                </form>
                <p style={styles.footerText}>
                    Belum punya akun? <Link to="/register" style={styles.link}>Register</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    background: {
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070")', // Gambar kuliner
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '15px',
        width: '380px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        textAlign: 'center'
    },
    title: { fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', letterSpacing: '2px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: {
        padding: '12px 15px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
        outline: 'none'
    },
    button: {
        backgroundColor: 'black',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px'
    },
    footerText: { marginTop: '20px', fontSize: '13px', color: '#666' },
    link: { color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }
};

export default Login;