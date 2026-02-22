import React, { useState } from 'react';
import axios from 'axios';

const AddCommentForm = ({ productId, currentUser, onNewComment }) => {
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if ((!newComment.trim() || newComment.trim() === '') && (!newRating || newRating < 1)) {
      setError('Please provide a comment or a rating.');
      return;
    }

    const payload = {
      productId,
      // userId: currentUser.uid,
      user: currentUser.uid,
      userName: currentUser.name,
      comment: newComment.trim(),
    };

    if (newRating >= 1) {
      payload.rating = newRating;
    }

    try {
      const res = await axios.post(`/comment/add`, payload);
      onNewComment(res.data);
      setNewComment('');
      setNewRating(0);
      setHoverRating(0);
      setError('');
    } catch (err) {
      console.error("Failed to submit comment:", err);
      setError('Failed to submit comment.');
    }
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
      <h4 style={{ marginBottom: '10px' }}>Leave a Comment or Rating</h4>

      <div style={{ marginBottom: '10px' }}>
        <span>Rating: </span>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setNewRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              cursor: 'pointer',
              fontSize: '22px',
              color: star <= (hoverRating || newRating) ? '#ffc107' : '#ccc',
              transition: 'color 0.2s ease'
            }}
          >
            ★
          </span>
        ))}
      </div>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        rows="3"
        placeholder="Write your comment (optional)"
        style={{
          width: '100%',
          borderRadius: '6px',
          border: '1px solid #ccc',
          padding: '10px',
          marginBottom: '10px'
        }}
      />

      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <button
          onClick={handleSubmit}
          style={{
            // backgroundColor: '#007bff',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default AddCommentForm;
