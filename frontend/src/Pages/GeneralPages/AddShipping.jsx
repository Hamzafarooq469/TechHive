
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
// import { addToShipping } from '../../Redux/reducers/guestShippingSlice'
import { addToShipping } from '@Redux/reducers/guestShippingSlice'
import { useTranslation } from 'react-i18next';

const containerStyle = {
  maxWidth: '600px',
  margin: '2rem auto',
  padding: '2rem',
  background: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
}

const titleStyle = {
  textAlign: 'center',
  color: '#2c3e50',
  marginBottom: '2rem',
  fontSize: '1.8rem'
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem'
}

const labelStyle = {
  fontWeight: '500',
  color: '#34495e',
  marginBottom: '-0.8rem'
}

const inputStyle = {
  padding: '0.8rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  transition: 'border 0.3s'
}

const inputFocusStyle = {
  borderColor: '#3498db',
  outline: 'none',
  boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)'
}

const buttonStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  padding: '1rem',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  marginTop: '1rem'
}

const buttonHoverStyle = {
  backgroundColor: '#2980b9'
}

const buttonDisabledStyle = {
  backgroundColor: '#95a5a6',
  cursor: 'not-allowed'
}

const successMessageStyle = {
  color: '#27ae60',
  textAlign: 'center',
  marginTop: '1.5rem',
  padding: '0.8rem',
  backgroundColor: 'rgba(39, 174, 96, 0.1)',
  borderRadius: '4px'
}

const AddShipping = () => {
  const { t } = useTranslation();

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const loggedInUser = useSelector((state) => state.user.currentUser?.user)
  const uid = loggedInUser?.uid

  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)

  useEffect(() => {
    const checkIfShippingInfoPresent = async () => {
      if (!uid) return;
      try {
        const res = await axios.get(`/shipping/getAllShipping/${uid}`);
        if (res.data.shipping) {
          navigate("/order");
        }
      } catch (error) {
        console.log(error.message);
      }
    };

    checkIfShippingInfoPresent();
  }, [uid]);

  useEffect(() => {
    let timeoutId;

    if (successMessage) {
      timeoutId = setTimeout(() => {
        navigate('/order');
      }, 1000);
    }

    return () => clearTimeout(timeoutId);
  }, [successMessage, navigate]);

  const handleAddShipping = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if(loggedInUser) {
          const data = { fullName, address, city, postalCode, country, uid };
          const res = await axios.post('/shipping/addShipping', data);
          

          if (res.status === 200) {
              setSuccessMessage('Shipping saved! Redirecting to order page in 1 second...');
          }
      } else {
        dispatch(addToShipping({
          fullName, address, city, postalCode, country
        }))
        setFullName(''); setAddress(''); setCity(''); setPostalCode(''); setCountry('');

        navigate("/order")
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = () => ({
    ...inputStyle,
    ...(isInputFocused ? inputFocusStyle : {})
  })

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>{t('shipping.title')}</h1>
      <form 
        style={formStyle}
        onSubmit={handleAddShipping}
      >
        <label style={labelStyle}>{t('shipping.fullName')}:</label>
        
        <input 
          type="text" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          placeholder={t('shipping.placeholder.fullName')}
          required 
          style={getInputStyle()}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />

        <label style={labelStyle}>{t('shipping.address')}:</label>
        <input 
          type="text" 
          value={address} 
          onChange={(e) => setAddress(e.target.value)} 
          placeholder={t('shipping.placeholder.address')}
          required 
          style={getInputStyle()}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />

        <label style={labelStyle}>{t('shipping.city')}:</label>
        <input 
          type="text" 
          value={city} 
          onChange={(e) => setCity(e.target.value)} 
          placeholder={t('shipping.placeholder.city')}
          required 
          style={getInputStyle()}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />

        <label style={labelStyle}>{t('shipping.postalCode')}:</label>
        <input 
          type="text" 
          value={postalCode} 
          onChange={(e) => setPostalCode(e.target.value)} 
          placeholder={t('shipping.placeholder.postalCode')}
          required 
          style={getInputStyle()}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />

        <label style={labelStyle}>{t('shipping.country')}:</label>
        <input 
          type="text" 
          value={country} 
          onChange={(e) => setCountry(e.target.value)} 
          placeholder={t('shipping.placeholder.country')}
          required 
          style={getInputStyle()}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />

        <button 
          type='submit' 
          disabled={loading}
          style={{
            ...buttonStyle,
            ...(loading ? buttonDisabledStyle : {}),
            ...(!loading ? { ':hover': buttonHoverStyle } : {})
          }}
        >
          {loading ? t('shipping.saving') : t('shipping.button')}

        </button>
      </form>

      {successMessage && <p style={successMessageStyle}>{t('shipping.successMessage')}</p>}

      
    </div>
  );
};

export default AddShipping;