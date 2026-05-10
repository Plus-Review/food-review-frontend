import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/auth/register', formData);
            alert('Registrasi Sukses!');
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || 'Registrasi Gagal');
        }
    };

    return (
        <div style={styles.background}>
            <div style={styles.card}>
                <h1 style={styles.title}>REGISTER</h1>
                <form onSubmit={handleRegister} style={styles.form}>
                    <input 
                        type="text" 
                        placeholder="Masukkan username" 
                        style={styles.input} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        required 
                    />
                    <input 
                        type="email" 
                        placeholder="Masukkan alamat email" 
                        style={styles.input} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Masukkan password" 
                        style={styles.input} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        required 
                    />
                    <button type="submit" style={styles.button}>REGISTRASI</button>
                </form>
                <p style={styles.footerText}>
                    Sudah punya akun? <Link to="/login" style={styles.link}>Login</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    background: {
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1476224489411-bd831bb7a66d?q=80&w=2070")',
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
    input: { padding: '12px 15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', outline: 'none' },
    button: { backgroundColor: 'black', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    footerText: { marginTop: '20px', fontSize: '13px', color: '#666' },
    link: { color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }
};

export default Register;