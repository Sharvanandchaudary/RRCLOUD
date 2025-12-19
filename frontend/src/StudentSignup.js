import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', aboutMe: '' });
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("aboutMe", formData.aboutMe);
    if (file) data.append("resume", file);

    try {
      // FIX: Use relative path so Cloud Shell Proxy handles the connection
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        alert("✅ Application Submitted Successfully!");
        navigate('/');
      } else {
        const errorText = await response.text();
        alert("Server Error: " + errorText);
      }
    } catch (error) {
      console.error(error);
      alert("Connection Failed: Ensure Backend is running.");
    }
  };

  const formStyle = { maxWidth: '600px', margin: '50px auto', padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };
  const inputStyle = { width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing:'border-box' };

  return (
    <div style={formStyle}>
      <h2 style={{textAlign:'center', color:'#0f172a'}}>Career Application</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full Name" required style={inputStyle} onChange={e => setFormData({...formData, fullName: e.target.value})} />
        <input placeholder="Email" type="email" required style={inputStyle} onChange={e => setFormData({...formData, email: e.target.value})} />
        <input placeholder="Phone" required style={inputStyle} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <textarea placeholder="About Me" rows="4" style={inputStyle} onChange={e => setFormData({...formData, aboutMe: e.target.value})} />
        <label>Upload Resume:</label>
        <input type="file" onChange={e => setFile(e.target.files[0])} style={inputStyle} />
        <button type="submit" style={{ width: '100%', padding: '15px', background: '#dc2626', color: 'white', border: 'none', borderRadius:'4px', marginTop: '20px', fontWeight: 'bold', cursor: 'pointer' }}>SUBMIT APPLICATION</button>
      </form>
    </div>
  );
}
