import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl ? `${backendUrl}/auth/login` : '/auth/login';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        alert('Login successful! Welcome ' + (data.user?.full_name || ''));
        // TODO: store session/token; for now just redirect
        navigate('/');
      } else {
        const txt = await res.text();
        alert('Login failed: ' + txt);
      }
    } catch (err) {
      console.error(err);
      alert('Connection error');
    }
  };

  return (
    <div style={{minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{width:420, padding:30, background:'white', borderRadius:8, boxShadow:'0 10px 30px rgba(0,0,0,0.08)'}}>
        <h2 style={{marginTop:0}}>Student Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" required value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%', padding:12, margin:'10px 0'}} />
          <input type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%', padding:12, margin:'10px 0'}} />
          <button type="submit" style={{width:'100%', padding:12, background:'#0f172a', color:'white', border:'none', borderRadius:4}}>LOGIN</button>
        </form>
      </div>
    </div>
  );
}
