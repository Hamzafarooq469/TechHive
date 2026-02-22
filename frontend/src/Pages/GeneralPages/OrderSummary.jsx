import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const OrderSummary = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const id = useSelector((state) => state.orderId?.orderId);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getOrderSummary = async () => {
      try {
        const res = await axios.get(`/order/orderSummary/${id}`);
        setOrder(res.data.order);
      } catch (error) {
        console.log(error.message);
        setError(t('orderSummary.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getOrderSummary();
    } else {
      setLoading(false);
    }
  }, [id, t]);

  const handleCopyTrackingNumber = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      toast.success(t('orderSummary.trackingCopied'));
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '20px auto',
      padding: '0 20px',
      fontFamily: '"Amazon Ember", Arial, sans-serif'
    }}>
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          fontSize: '18px',
          color: '#565959'
        }}>
          {t('orderSummary.loading')}
        </div>
      )}

      {!loading && !order && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#B12704',
          fontSize: '18px'
        }}>
          {error || t('orderSummary.noOrder')}
        </div>
      )}

      {order && (
        <div>
          <div style={{
            backgroundColor: '#f3f3f3',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '400',
              color: '#0F1111',
              marginBottom: '10px'
            }}>{t('orderSummary.thankYou')}</h1>
            <p style={{ fontSize: '16px', color: '#565959' }}>
              {t('orderSummary.confirmationSent')}
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{
              flex: '1',
              minWidth: '300px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #ddd'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0F1111',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '1px solid #ddd'
              }}>{t('orderSummary.orderSummary')}</h2>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0F1111',
                  marginBottom: '10px'
                }}>{t('orderSummary.orderDetails')}</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: '10px',
                  fontSize: '14px',
                  marginBottom: '15px'
                }}>
                  <div style={{ color: '#565959' }}>{t('orderSummary.status')}:</div>
                  <div><strong style={{ color: '#067D62' }}>{order.status}</strong></div>

                  <div style={{ color: '#565959' }}>{t('orderSummary.orderNumber')}:</div>
                  <div><strong>{order.orderNumber}</strong></div>

                  <div style={{ color: '#565959' }}>{t('orderSummary.trackingNumber')}:</div>
                  <div>
                    <strong>{order.trackingNumber}</strong>{' '}
                    <button
                      onClick={handleCopyTrackingNumber}
                      style={{
                        background: '#f0f2f2',
                        border: '1px solid #d5d9d9',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: '8px'
                      }}
                    >
                      {t('orderSummary.copy')}
                    </button>
                  </div>

                  <div style={{ color: '#565959' }}>{t('orderSummary.estDelivery')}:</div>
                  <div>{t('orderSummary.deliveryTime')}</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0F1111',
                  marginBottom: '10px'
                }}>{t('orderSummary.paymentSummary')}</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: '10px',
                  fontSize: '14px'
                }}>
                  <div style={{ color: '#565959' }}>{t('orderSummary.totalAmount')}:</div>
                  <div><strong style={{ fontSize: '18px' }}>${order.totalAmount?.toFixed(2)}</strong></div>
                </div>
              </div>
            </div>

            <div style={{
              flex: '1',
              minWidth: '300px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #ddd'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0F1111',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '1px solid #ddd'
              }}>{t('orderSummary.orderItems')}</h2>

              {order.orderItems?.map((item) => (
                <div key={item.productId} style={{
                  display: 'flex',
                  gap: '15px',
                  padding: '15px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    padding: '5px',
                    border: '1px solid #ddd'
                  }}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: '1' }}>
                    <div style={{
                      fontSize: '16px',
                      color: '#0066c0',
                      marginBottom: '5px'
                    }}>{item.name}</div>
                    <div style={{ fontSize: '14px', color: '#565959' }}>
                      {t('orderSummary.quantity')}: {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '30px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: '#FFD814',
                border: '1px solid #FCD200',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '200px',
                fontWeight: '500'
              }}
            >
              {t('orderSummary.continueShopping')}
            </button>
            <button
              onClick={() => navigate('/trackOrder')}
              style={{
                background: '#FFA41C',
                border: '1px solid #FF8F00',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '200px',
                fontWeight: '500'
              }}
            >
              {t('orderSummary.trackOrder')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
