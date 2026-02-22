import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPackage, FiTruck, FiCalendar, FiSearch, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const TrackOrder = () => {

  const { t } = useTranslation();

  const [trackingNumber, setTrackingNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrackOrder = async () => {
    if (!trackingNumber) {
      toast.error(t('trackOrder.errors.noTracking'));
      return;
    }

    try {
      setLoading(true);
      setOrder(null);
      const res = await axios.get(`/order/trackOrder/${trackingNumber}`);
      setOrder(res.data.order);
      toast.success(t('trackOrder.success'));
    } catch (error) {
      console.error(error.message);
      toast.error(t('trackOrder.errors.notFound'));
    } finally {
      setLoading(false);
    }
  };

const getProgressSteps = (status) => {
  const steps = [
    { id: 1, label: t('trackOrder.steps.placed'), status: 'completed' },
    { id: 2, label: t('trackOrder.steps.confirmed'), status: status === 'Processing' ? 'pending' : 'completed' },
    { id: 3, label: t('trackOrder.steps.shipped'), status: ['Processing', 'Confirmed'].includes(status) ? 'pending' : 
                        ['Shipped', 'Delivered', 'Delayed'].includes(status) ? 'completed' : 'cancelled' },
    { id: 4, label: t('trackOrder.steps.delivered'), status: status === 'Delivered' ? 'completed' : 
                        ['Cancel', 'Delayed'].includes(status) ? 'cancelled' : 'pending' }
  ];

  if (status === 'Cancel') {
    steps.forEach(step => {
      if (step.id > 1) step.status = 'cancelled';
    });
  }

  return steps;
};

  return (
    <div className="track-order-container">
      <div className="track-order-header">
        <h1><FiPackage className="header-icon" /> {t('trackOrder.title')} </h1>
        <p className="subtitle"> {t('trackOrder.subtitle')}  </p>
      </div>

      <div className="track-input-container">
        <div className="input-group">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('trackOrder.placeholder')} 
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="track-input"
          />
          <button 
            onClick={handleTrackOrder} 
            className="track-button"
            disabled={loading}
          >
            {loading ? t('trackOrder.tracking') : t('trackOrder.button')}
          </button>
        </div>
      </div>

      {order && (
        <div className="order-details-container">
          <div className="order-status-header">
            <h2> {t('trackOrder.order')}  #{order.orderNumber}</h2>
            <div className={`status-badge ${order.status.toLowerCase()}`}>
              {order.status}
              {order.status === 'Delayed' && (
                <FiAlertCircle style={{ marginLeft: '5px' }} />
              )}
              {order.status === 'Cancel' && (
                <FiXCircle style={{ marginLeft: '5px' }} />
              )}
            </div>
          </div>

          {/* Warning banner for delayed/cancelled orders */}
          {['Delayed', 'Cancel'].includes(order.status) && (
            <div className={`status-warning ${order.status.toLowerCase()}`}>
              {order.status === 'Delayed' ? (
                <>
                  <FiAlertCircle className="warning-icon" />
                  <p> {t('trackOrder.delayedMessage')} </p>
                </>
              ) : (
                <>
                  <FiXCircle className="warning-icon" />
                  <p> {t('trackOrder.cancelledMessage')} </p>
                </>
              )}
            </div>
          )}

          <div className="progress-tracker">
            {getProgressSteps(order.status).map((step) => (
              <div key={step.id} className={`progress-step ${step.status}`}>
                <div className="step-icon">
                  {step.status === 'cancelled' ? <FiXCircle /> : step.id}
                </div>
                <div className="step-label">{step.label}</div>
                {step.id < 4 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>

<div className="order-info-grid">
  <div className="info-card">
    <FiTruck className="info-icon" />
    <div>
      <h4>{t('trackOrder.trackingNumber')}</h4>
      <p>{order.trackingNumber}</p>
    </div>
  </div>

  <div className="info-card">
    <FiCalendar className="info-icon" />
    <div>
      <h4>
        {order.status === 'Delivered'
          ? t('trackOrder.deliveredOn')
          : order.status === 'Cancel'
          ? t('trackOrder.cancelledOn')
          : order.status === 'Delayed'
          ? t('trackOrder.estimatedDelivery')
          : t('trackOrder.expectedDelivery')}
      </h4>

      <p>
        {order.status === 'Delayed'
          ? t('trackOrder.delayedDateNote')
          : order.estimatedDelivery || t('trackOrder.defaultDelivery')}
      </p>

      {order.status === 'Delayed' && (
        <p className="delayed-note">
          <FiAlertCircle style={{ marginRight: '5px' }} />
          {t('trackOrder.delayedApology')}
        </p>
      )}

      {order.status === 'Cancel' && (
        <p className="cancelled-note">
          <FiXCircle style={{ marginRight: '5px' }} />
          {t('trackOrder.cancelledNote')}
        </p>
      )}
    </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .track-order-container {
          max-width: 800px;
          margin: 30px auto;
          padding: 20px;
          font-family: 'Amazon Ember', Arial, sans-serif;
        }
        
        .track-order-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .track-order-header h1 {
          color: #131921;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .header-icon {
          font-size: 28px;
        }
        
        .subtitle {
          color: #565959;
          font-size: 16px;
          margin-top: 8px;
        }
        
        .track-input-container {
          background: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .input-group {
          display: flex;
          align-items: center;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .search-icon {
          padding: 0 15px;
          color: #767676;
          font-size: 18px;
        }
        
        .track-input {
          flex: 1;
          padding: 12px;
          border: none;
          outline: none;
          font-size: 16px;
        }
        
        .track-button {
          background: #FFA41C;
          color: #111;
          border: none;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .track-button:hover {
          background: #FA8900;
        }
        
        .track-button:disabled {
          background: #DDD;
          cursor: not-allowed;
        }
        
        .order-details-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 25px;
        }
        
        .order-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .order-status-header h2 {
          color: #131921;
          font-size: 20px;
          font-weight: 500;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
        }
        
        .status-badge.processing {
          background: #F7CA00;
          color: #111;
        }
        
        .status-badge.confirmed {
          background: #007185;
          color: white;
        }
        
        .status-badge.shipped {
          background: #146EB4;
          color: white;
        }
        
        .status-badge.delivered {
          background: #067D62;
          color: white;
        }
        
        .status-badge.delayed {
          background: #F7CA00;
          color: #111;
        }
        
        .status-badge.cancel {
          background: #D93915;
          color: white;
        }

        .status-warning {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 500;
        }

        .status-warning.delayed {
          background-color: #FFF4E5;
          color: #E67A00;
          border-left: 4px solid #E67A00;
        }

        .status-warning.cancel {
          background-color: #FFEBEE;
          color: #D93915;
          border-left: 4px solid #D93915;
        }

        .warning-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .progress-tracker {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
          position: relative;
        }
        
        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
          position: relative;
          flex: 1;
        }
        
        .step-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ddd;
          color: #767676;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .progress-step.completed .step-icon {
          background: #067D62;
          color: white;
        }
        
        .progress-step.pending .step-icon {
          background: #ddd;
          color: #767676;
        }
        
        .progress-step.cancelled .step-icon {
          background: #D93915;
          color: white;
        }
        
        .step-label {
          font-size: 14px;
          color: #767676;
          text-align: center;
        }
        
        .progress-step.completed .step-label,
        .progress-step.active .step-label {
          color: #111;
          font-weight: 500;
        }
        
        .progress-step.cancelled .step-label {
          color: #D93915;
        }
        
        .step-connector {
          position: absolute;
          top: 15px;
          left: calc(50% + 16px);
          right: calc(-50% + 16px);
          height: 2px;
          background: #ddd;
          z-index: -1;
        }
        
        .progress-step.completed + .progress-step .step-connector,
        .progress-step.completed .step-connector {
          background: #067D62;
        }
        
        .progress-step.cancelled + .progress-step .step-connector,
        .progress-step.cancelled .step-connector {
          background: #D93915;
        }
        
        .order-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 25px;
        }
        
        .info-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        
        .info-icon {
          font-size: 24px;
          color: #007185;
        }
        
        .info-card h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
          color: #565959;
        }
        
        .info-card p {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #131921;
        }
        
        .delayed-note, .cancelled-note {
          font-size: 14px;
          color: #D93915;
          margin-top: 5px !important;
          display: flex;
          align-items: center;
        }
        
        @media (max-width: 600px) {
          .track-order-container {
            padding: 15px;
          }
          
          .input-group {
            flex-direction: column;
            border: none;
          }
          
          .track-input {
            width: 100%;
            border: 1px solid #ddd;
            margin-bottom: 10px;
            border-radius: 4px;
          }
          
          .track-button {
            width: 100%;
          }
          
          .progress-tracker {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
          
          .progress-step {
            flex-direction: row;
            gap: 15px;
            width: 100%;
            align-items: center;
          }
          
          .step-connector {
            display: none;
          }
          
          .step-icon {
            margin-bottom: 0;
          }

          .status-warning {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default TrackOrder;