import React, { useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiLock, FiMail, FiShield, FiUser } from 'react-icons/fi';

const initialRegisterState = {
  contact: '',
  username: '',
  password: '',
  confirmPassword: '',
  code: '',
};

export default function AuthPage({ authMode, onToggleMode, onLogin, onRegister, message, onSendCode }) {
  const [loginForm, setLoginForm] = useState({ username: 'demo', password: 'demo123' });
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [registerStep, setRegisterStep] = useState('contact');
  const [verificationCode, setVerificationCode] = useState('');

  const handleSendCode = async () => {
    const generatedCode = await onSendCode(registerForm.contact);
    if (generatedCode) {
      setVerificationCode(generatedCode);
      setRegisterStep('verify');
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (registerStep === 'contact') {
      handleSendCode();
      return;
    }

    if (registerStep === 'verify') {
      if (String(registerForm.code).trim() !== verificationCode) {
        return;
      }
      setRegisterStep('credentials');
      return;
    }

    onRegister({
      contact: registerForm.contact,
      username: registerForm.username,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      code: registerForm.code,
    });
  };

  const updateLogin = (field, value) => setLoginForm((prev) => ({ ...prev, [field]: value }));
  const updateRegister = (field, value) => setRegisterForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="auth-shell">
      <div className="auth-illustration">
        <div className="auth-badge">FinTech suite</div>
        <h1>Smart banking for modern businesses and people.</h1>
        <p>
          Manage wallets, cards, transfers, transactions, and secure identity verification in one streamlined platform.
        </p>

        <div className="highlight-grid">
          <div className="highlight-card">
            <FiShield size={18} />
            <span>Secure access</span>
          </div>
          <div className="highlight-card">
            <FiLock size={18} />
            <span>2-step identity</span>
          </div>
          <div className="highlight-card">
            <FiMail size={18} />
            <span>Instant code</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-topbar">
          <div className="brand-mark">V</div>
          <div>
            <strong>VelyBank</strong>
            <small>Digital finance</small>
          </div>
        </div>

        <div className="mode-switcher">
          <button
            type="button"
            className={authMode === 'login' ? 'active' : ''}
            onClick={() => onToggleMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={authMode === 'register' ? 'active' : ''}
            onClick={() => onToggleMode('register')}
          >
            Register
          </button>
        </div>

        {authMode === 'login' ? (
          <form className="auth-form" onSubmit={(event) => onLogin(event, loginForm)}>
            <h2>Welcome back</h2>
            <label>
              <span>Username</span>
              <div className="input-wrap">
                <FiUser />
                <input value={loginForm.username} onChange={(e) => updateLogin('username', e.target.value)} />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="input-wrap">
                <FiLock />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => updateLogin('password', e.target.value)}
                />
              </div>
            </label>

            <button type="submit" className="primary-btn">
              Sign in <FiArrowRight />
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <h2>Create account</h2>

            {registerStep === 'contact' && (
              <>
                <label>
                  <span>Email or phone</span>
                  <div className="input-wrap">
                    <FiMail />
                    <input
                      value={registerForm.contact}
                      onChange={(e) => updateRegister('contact', e.target.value)}
                      placeholder="example@mail.com / +9989..."
                    />
                  </div>
                </label>
                <button type="submit" className="primary-btn">
                  Send verification code <FiArrowRight />
                </button>
              </>
            )}

            {registerStep === 'verify' && (
              <>
                <label>
                  <span>6-digit code</span>
                  <div className="input-wrap">
                    <FiCheckCircle />
                    <input
                      value={registerForm.code}
                      maxLength={6}
                      onChange={(e) => updateRegister('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                </label>
                <button type="submit" className="primary-btn">
                  Verify code <FiArrowRight />
                </button>
              </>
            )}

            {registerStep === 'credentials' && (
              <>
                <label>
                  <span>Username</span>
                  <div className="input-wrap">
                    <FiUser />
                    <input
                      value={registerForm.username}
                      onChange={(e) => updateRegister('username', e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  <span>Password</span>
                  <div className="input-wrap">
                    <FiLock />
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => updateRegister('password', e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  <span>Repeat password</span>
                  <div className="input-wrap">
                    <FiLock />
                    <input
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => updateRegister('confirmPassword', e.target.value)}
                    />
                  </div>
                </label>

                <button type="submit" className="primary-btn">
                  Create account <FiArrowRight />
                </button>
              </>
            )}
          </form>
        )}

        {message && <div className="system-message">{message}</div>}
      </div>
    </div>
  );
}
