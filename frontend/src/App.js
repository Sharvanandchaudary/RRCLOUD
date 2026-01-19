import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import StudentSignup from './StudentSignup';
import StudentLogin from './StudentLogin';
import StudentDashboard from './StudentDashboard';
import AdminStudentManagement from './AdminStudentManagement';
import AccountSetup from './AccountSetup';

// --- ASSETS ---
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop"
};

// --- DATA ---
const SERVICES = [
    { title: "Data Solutions", desc: "Enterprise warehousing and real-time analytics pipelines.", color: "linear-gradient(135deg, #0061ff 0%, #60efff 100%)" },
    { title: "ML Solutions", desc: "Predictive modeling and automated decision engines.", color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { title: "AI Solutions", desc: "Generative AI integration and large language model tuning.", color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { title: "Transformation", desc: "Legacy modernization and cloud-native migration strategies.", color: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)" },
    { title: "Learning", desc: "Corporate training and student placement programs.", color: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" }
];

// --- STYLES ---
const styles = {
  container: { fontFamily: "'Outfit', sans-serif", backgroundColor: '#ffffff', color: '#1a202c', overflowX: 'hidden' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #e2e8f0' },
  navBrand: { display: 'flex', alignItems:'center', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#0f172a', textDecoration: 'none' },
  navLinks: { display: 'flex', gap: '20px', alignItems: 'center' },
  navLink: { color: '#475569', textDecoration: 'none', fontWeight: '600', fontSize: '15px', transition: '0.3s' },
  navBtnLogin: { background: '#0f172a', color: 'white', padding: '10px 25px', borderRadius: '50px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' },
  navBtnApply: { background: '#dc2626', color: 'white', padding: '10px 25px', borderRadius: '50px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }, 
  hero: { background: `linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.7)), url(${IMAGES.hero})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'white', padding: '140px 40px', minHeight: '60vh', display: 'flex', alignItems: 'center' },
  heroContent: { maxWidth: '700px' },
  heroTitle: { fontSize: '64px', fontWeight: '800', lineHeight: '1.1', marginBottom: '25px', letterSpacing: '-2px' },
  heroSub: { fontSize: '20px', color: '#cbd5e1', marginBottom: '40px', lineHeight: '1.6', fontWeight: '300' },
  btnHero: { padding: '18px 45px', fontSize: '18px', background: 'white', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', textDecoration: 'none', display: 'inline-block', marginRight: '20px' },
  btnOutline: { padding: '18px 45px', fontSize: '18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', textDecoration: 'none', display: 'inline-block' },
  section: { padding: '100px 40px', maxWidth: '1300px', margin: 'auto' },
  sectionTitle: { fontSize: '42px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', letterSpacing: '-1px' },
  sectionSub: { fontSize: '18px', color: '#64748b', marginBottom: '60px', maxWidth: '600px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
  card: { background: 'white', padding: '40px', borderRadius: '0px', border: '1px solid #e2e8f0', transition: '0.3s', position: 'relative', overflow: 'hidden' },
  authBox: { maxWidth: '450px', margin: '100px auto', padding: '60px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderTop: '4px solid #0f172a' },
  input: { width: '100%', padding: '16px', margin: '10px 0', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '16px', borderRadius: '4px', boxSizing:'border-box' },
  footer: { background: '#0f172a', color: 'white', padding: '80px 40px' }
};

// --- COMPONENTS ---
const RRIcon = ({ dark }) => (
  <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '12px'}}>
    <path d="M32.5 16C32.5 11.5817 28.9183 8 24.5 8C20.0817 8 16.5 11.5817 16.5 16" stroke={dark ? "#3b82f6" : "white"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 16C7.5 11.5817 11.0817 8 15.5 8" stroke={dark ? "#3b82f6" : "white"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32.5 16C32.5 20.4183 28.9183 24 24.5 24C20.0817 24 16.5 20.4183 16.5 16" stroke={dark ? "#0f172a" : "#94a3b8"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 16C7.5 20.4183 11.0817 24 15.5 24" stroke={dark ? "#0f172a" : "#94a3b8"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="16" r="3" fill={dark ? "#3b82f6" : "white"}/>
    <circle cx="24" cy="16" r="3" fill={dark ? "#0f172a" : "#94a3b8"}/>
  </svg>
);

const FontLoader = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        body { margin: 0; font-family: 'Outfit', sans-serif; }
        .service-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-color: transparent; }
    `}</style>
);

const Navbar = () => (
  <nav style={styles.navbar}>
    <Link to="/" style={styles.navBrand}><RRIcon dark={true} /> ZgenAi</Link>
    <div style={styles.navLinks}>
        <Link to="/" style={styles.navLink}>Home</Link>
        <Link to="/services" style={styles.navLink}>Expertise</Link>
        <Link to="/apply" style={styles.navBtnApply}>🚀 Apply Now</Link>
        <Link to="/login" style={styles.navBtnLogin}>Client Login</Link>
    </div>
  </nav>
);

const Home = () => (
  <div>
    <FontLoader />
    <Navbar /> 
    <div style={styles.hero}>
      <div style={styles.heroContent}>
        <h1 style={styles.heroTitle}>Future Ready.<br/>Data Driven.</h1>
        <p style={styles.heroSub}>We architect intelligent systems for the world's most ambitious companies. From AI integration to enterprise transformation.</p>
        <div>
            <Link to="/services" style={styles.btnHero}>View Solutions</Link>
            <Link to="/apply" style={styles.btnOutline}>Student Application →</Link>
        </div>
      </div>
    </div>
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>Our Capabilities</h2>
      <p style={styles.sectionSub}>Comprehensive technology services designed for scale and impact.</p>
      <div style={styles.grid}>
        {SERVICES.map((s, index) => (
            <div key={index} style={styles.card} className="service-card">
                <div style={{height:'6px', width:'60px', background: s.color, marginBottom:'25px'}}></div>
                <h3 style={{fontSize:'24px', fontWeight:'700', marginBottom:'15px', color:'#1e293b'}}>{s.title}</h3>
                <p style={{color:'#64748b', lineHeight:'1.7'}}>{s.desc}</p>
            </div>
        ))}
      </div>
    </div>
    <footer style={styles.footer}>
        <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', maxWidth:'1300px', margin:'auto'}}>
            <div>
                <div style={{display:'flex', alignItems:'center', marginBottom:'20px'}}>
                    <RRIcon dark={false} />
                    <h2 style={{color:'white', margin:0}}>ZgenAi</h2>
                </div>
                <p style={{color:'#94a3b8', maxWidth:'300px', lineHeight:'1.6'}}>Architecting intelligent systems for the world's most ambitious companies.</p>
            </div>
            <div style={{display:'flex', gap:'60px', marginTop:'20px', flexWrap:'wrap'}}>
                <div>
                    <h4 style={{color:'white', marginBottom:'20px'}}>Company</h4>
                    <Link to="/apply" style={{color:'#dc2626', textDecoration:'none', display:'block', marginBottom:'10px', fontWeight:'bold'}}>🚀 Careers (Apply)</Link>
                    <Link to="/services" style={{color:'#94a3b8', textDecoration:'none', display:'block', marginBottom:'10px'}}>Solutions</Link>
                </div>
                <div>
                    <h4 style={{color:'white', marginBottom:'20px'}}>Contact Us</h4>
                    <p style={{color:'#94a3b8', margin:'0 0 10px 0'}}>📧 contact@zgenai.com</p>
                    <p style={{color:'#94a3b8', margin:'0 0 10px 0'}}>📞 +1 (555) 123-4567</p>
                    <p style={{color:'#94a3b8', margin:'0 0 10px 0'}}>📍 123 Tech Street, Silicon Valley, CA</p>
                </div>
                <div>
                    <h4 style={{color:'white', marginBottom:'20px'}}>Follow Us</h4>
                    <a href="https://linkedin.com" style={{color:'#94a3b8', textDecoration:'none', display:'block', marginBottom:'10px'}}>LinkedIn</a>
                    <a href="https://twitter.com" style={{color:'#94a3b8', textDecoration:'none', display:'block', marginBottom:'10px'}}>Twitter</a>
                    <a href="https://github.com" style={{color:'#94a3b8', textDecoration:'none', display:'block', marginBottom:'10px'}}>GitHub</a>
                </div>
            </div>
        </div>
        <div style={{borderTop:'1px solid #334155', marginTop:'60px', paddingTop:'30px', textAlign:'center', maxWidth:'1300px', margin:'60px auto 0'}}>
            <p style={{color:'#64748b', fontSize:'14px'}}>© 2024 ZgenAi. All rights reserved. Built with precision and passion.</p>
        </div>
    </footer>
  </div>
);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPass] = useState('');
    const navigate = useNavigate();
    const handleLogin = async () => {
        if(email === 'admin@zgenai.com' && password === 'admin123') navigate('/admin');
        else alert('Invalid Credentials for Demo');
    };
    return (
        <div style={{minHeight:'100vh', background:'#f1f5f9', display:'flex', flexDirection:'column'}}>
            <FontLoader /><Navbar />
            <div style={styles.authBox}>
                <h2 style={{fontSize:'28px', fontWeight:'800', color:'#0f172a', margin:0, marginBottom:'20px'}}>Portal Access</h2>
                <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={styles.input} />
                <input type="password" placeholder="Password" value={password} onChange={e=>setPass(e.target.value)} style={styles.input} />
                <button onClick={handleLogin} style={{width:'100%', padding:'18px', background:'#0f172a', color:'white', border:'none', marginTop:'30px', fontWeight:'700', cursor:'pointer'}}>AUTHENTICATE →</button>
            </div>
        </div>
    );
};

// --- ADMIN DASHBOARD (Corrected Relative Path) ---
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('students');

    const dashboardStyle = { padding: '0', fontFamily: "'Outfit', sans-serif", backgroundColor: '#f4f6f8', minHeight: '100vh' };
    const tabsStyle = { 
        display: 'flex', 
        gap: '0', 
        background: 'white', 
        borderBottom: '2px solid #e2e8f0',
        padding: '0 40px',
        maxWidth: '1200px',
        margin: '0 auto'
    };
    const tabStyle = {
        padding: '15px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        color: '#64748b',
        borderBottom: activeTab === 'students' ? '3px solid #3b82f6' : 'none',
        transition: '0.3s'
    };

    return (
        <div style={dashboardStyle}>
            <FontLoader /><Navbar />
            <div style={{maxWidth:'1200px', margin:'auto', padding:'0 40px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'20px', margin:'20px 0'}}>
                    <h1 style={{margin:0}}>👨‍💼 Admin Control Panel</h1>
                </div>

                <div style={tabsStyle}>
                    <div 
                        style={{...tabStyle, color: activeTab === 'students' ? '#3b82f6' : '#64748b'}}
                        onClick={() => setActiveTab('students')}
                    >
                        📚 Student Management
                    </div>
                </div>

                {activeTab === 'students' && <AdminStudentManagement />}
            </div>
        </div>
    );
};

// --- WRAPPER FOR APPLY PAGE ---
const ApplyPage = () => (
    <div style={{background:'#f8fafc', minHeight:'100vh'}}>
        <FontLoader /><Navbar /><StudentSignup />
    </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/account-setup" element={<AccountSetup />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/services" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
