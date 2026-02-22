import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import app from '@Services/Firebase'; // adjust to your actual path
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';



const ForgotPassword = () => {
  
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();

    const auth = getAuth(app);
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus(t('forgotPassword.successStatus', { email }));
      toast.success(t('forgotPassword.toastSuccess'));
    } catch (error) {
      console.error(error.message);
      setStatus(t('forgotPassword.errorStatus', { message: error.message }));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{t('forgotPassword.title')}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t('forgotPassword.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', width: '300px' }}
        />
        <br />
        <button type="submit" style={{ marginTop: '10px', padding: '8px 16px' }}>
          {t('forgotPassword.button')}
        </button>
      </form>
      {status && <p style={{ marginTop: '10px', color: 'green' }}>{status}</p>}
    </div>
  );
};

export default ForgotPassword;