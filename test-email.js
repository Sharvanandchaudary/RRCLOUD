const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/.env' });

// Create transporter with admin@zgenai.org
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'admin@zgenai.org',
    pass: process.env.SMTP_PASSWORD || 'your-app-specific-password'
  }
});

// Test email content matching your requirements
const testEmail = {
  from: 'admin@zgenai.org',
  to: 'sharvanandchaudhary@gmail.com',
  subject: 'Your Account is Ready!',
  html: `
    <h2>Your Account is Ready!</h2>
    <p>Your account has been approved. Here are your login details:</p>
    <p><strong>Email:</strong> sharvanandchaudhary@gmail.com<br>
    <strong>Password:</strong> password<br>
    <strong>Login:</strong> https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/student-login</p>
    <p>Please keep these credentials safe.</p>
    <br>
    <p>Best regards,<br>Admin Team</p>
  `,
  text: `Your Account is Ready!

Email: sharvanandchaudhary@gmail.com
Password: password
Login: https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/student-login

Best regards,
Admin Team`
};

async function testEmailSending() {
  try {
    console.log('🔧 Testing email configuration...');
    
    // Verify transporter
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail(testEmail);
    
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   From:', testEmail.from);
    console.log('   To:', testEmail.to);
    console.log('   Subject:', testEmail.subject);
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n📝 Solution: You need to:');
      console.log('   1. Enable 2-Factor Authentication on admin@zgenai.org');
      console.log('   2. Generate an App-Specific Password');
      console.log('   3. Update SMTP_PASSWORD in backend/.env file');
    }
  }
}

testEmailSending();