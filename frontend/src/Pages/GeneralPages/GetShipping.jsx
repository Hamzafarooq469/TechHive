import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { useTranslation } from 'react-i18next';


const GetShipping = ({ onSelectShipping }) => {

  const { t } = useTranslation();

  const [shippingData, setShippingData] = useState([])
  const [selectedShippingId, setSelectedShippingId] = useState(null)

  const loggedInUser = useSelector((state) => state.user.currentUser?.user)
  const uid = loggedInUser?.uid

  const guestShipping = useSelector((state) => state.guestShipping?.shipping)

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        if (loggedInUser) {
          const res = await axios.get(`/shipping/getAllShipping/${uid}`)
          setShippingData(res.data.shipping)
        } else {
          if (guestShipping && Object.keys(guestShipping).length > 0) {
            setShippingData([
              {
                _id: 'guest-shipping',
                ...guestShipping
              }
            ])
          } else {
            setShippingData([])
          }
        }
      } catch (error) {
        console.log(error.message)
      }
    }

    fetchShipping()
  }, [uid, guestShipping, loggedInUser])

  const handleSelectShipping = (id) => {
    setSelectedShippingId(id)
    if (onSelectShipping) {
      onSelectShipping(id)
    }
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '20px auto',
      padding: '0 20px',
      fontFamily: '"Amazon Ember", Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingBottom: '10px',
        borderBottom: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '400',
          color: '#0F1111'
        }}>{t('shipping.selectShippingAddress')}</h1>
      </div>

      {shippingData.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 0'
        }}>
          <p style={{ 
            fontSize: '18px',
            color: '#565959'
          }}>No shipping information found.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {shippingData.map((shipping) => (
            <div
              key={shipping._id}
              style={{
                border: selectedShippingId === shipping._id 
                  ? '2px solid #e77600' 
                  : '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: selectedShippingId === shipping._id 
                  ? '0 0 0 3px #fef6e7' 
                  : 'none',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleSelectShipping(shipping._id)}
            >
              {selectedShippingId === shipping._id && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '10px',
                  backgroundColor: '#e77600',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>{t('shipping.selectedAddress')}</div>
              )}
              
              <div style={{ 
                marginBottom: '12px',
                fontSize: '18px',
                fontWeight: '700',
                color: '#0F1111'
              }}>
                {shipping.fullName}
              </div>
              
              <div style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#0F1111'
              }}>
                <p>{shipping.address}</p>
                <p>{shipping.city}, {shipping.postalCode}</p>
                <p>{shipping.country}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedShippingId && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f3f3f3',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0F1111',
              marginBottom: '8px'
            }}>{t('shipping.selectedShippingAddress')}:</h3>
            {shippingData.find(s => s._id === selectedShippingId) && (
              <div style={{ fontSize: '14px', color: '#565959' }}>
                <p>{shippingData.find(s => s._id === selectedShippingId).fullName}</p>
                <p>{shippingData.find(s => s._id === selectedShippingId).address}</p>
                <p>{shippingData.find(s => s._id === selectedShippingId).city}, {shippingData.find(s => s._id === selectedShippingId).postalCode}</p>
                <p>{shippingData.find(s => s._id === selectedShippingId).country}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GetShipping