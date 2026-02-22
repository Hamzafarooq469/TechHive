
// ProductReviewSection.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AddCommentForm from './AddCommentForm';

const starStyle = (filled, size = 16) => ({
  color: filled ? '#ffc107' : '#ccc',
  fontSize: `${size}px`,
  marginRight: '2px'
});

const ProductReviewSection = ({ productId, productName }) => {
  const currentUser = useSelector(state => state.user.currentUser?.user);
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [total, setTotal] = useState(0);
  const [userComments, setUserComments] = useState([]);

  const commentsPerPage = 5;

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/comment/product/${productId}`, {
        params: {
          rating: filter,
          sort,
          page,
          limit: commentsPerPage,
        }
      });
      console.log(res)
      setComments(res.data.comments);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
      setTotal(0);
    }
  };

//   const fetchUserComments = async () => {
//     try {
//       if (currentUser?.uid) {
//         const res = await axios.get(`/comment/user/${currentUser.uid}`);
//         setUserComments(res.data.comments);
//       }
//     } catch (error) {
//       console.error("Error fetching user comments:", error);
//     }
//   };

  useEffect(() => {
    fetchComments();
  }, [filter, sort, page]);

//   useEffect(() => {
//     fetchUserComments();
//   }, [currentUser]);

  const handleDelete = async (id) => {
    await axios.delete(`/comment/delete/${id}`);
    fetchComments();
    // fetchUserComments();
  };

  const handleEdit = async () => {
    await axios.put(`/comment/update/${editId}`, {
      comment: editText,
      rating: editRating,
    });
    setEditId(null);
    setEditText('');
    setEditRating(5);
    fetchComments();
    // fetchUserComments();
  };

  const handleNewComment = () => {
    fetchComments();
    // fetchUserComments();
  };

  const avgRating = total > 0
    ? (comments.reduce((a, b) => a + b.rating, 0) / comments.length).toFixed(1)
    : null;

  const ratingCount = [5, 4, 3, 2, 1].map(star => comments.filter(c => c.rating === star).length);
  const maxCount = Math.max(...ratingCount, 1);

  return (
    <div style={{ marginTop: '30px' }}>
      {/* <h3 style={{ fontSize: '22px', fontWeight: 'bold' }}>Product Reviews</h3> */}

      {avgRating && (
        <div style={{ display: 'flex', gap: '40px', marginTop: '20px', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{avgRating}/5</div>
            <div>{[1, 2, 3, 4, 5].map(i => <span key={i} style={starStyle(i <= Math.round(avgRating), 30)}>★</span>)}</div>
          </div>
          <div style={{ flexGrow: 1 }}>
            {[5, 4, 3, 2, 1].map((star, i) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ width: '40px' }}>{star} ★</span>
                <div style={{ flex: 1, margin: '0 10px', background: '#eee', height: '12px', borderRadius: '5px' }}>
                  <div style={{ width: `${(ratingCount[i] / maxCount) * 100}%`, height: '100%', background: '#ffc107', borderRadius: '5px' }}></div>
                </div>
                <span>{ratingCount[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentUser && (
        <AddCommentForm
          productId={productId}
          currentUser={currentUser}
          onNewComment={handleNewComment}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '25px 0' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Product Reviews</div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            Filter:
            <select onChange={(e) => { setFilter(e.target.value); setPage(1); }} style={{ marginLeft: 8 }}>
              <option value="all">All Stars</option>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            Sort:
            <select onChange={(e) => setSort(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="recent">Most Recent</option>
              <option value="high">High to Low</option>
              <option value="low">Low to High</option>
            </select>
          </label>
        </div>
      </div>

      {comments.map(c => {
        // const isOwner = currentUser?.uid === c.userId;
        const isOwner = currentUser?.uid === c.user;
        const isEditing = editId === c._id;

        return (
          <div key={c._id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '15px', marginBottom: '15px' }}>
            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={starStyle(i <= c.rating, 18)}>★</span>
              ))}
              <span style={{ marginLeft: 6, color: '#555' }}>({c.rating}/5)</span>
            </div>

            {/* Name */}
            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{c.userName}</div>

            {/* Comment */}
            {isEditing ? (
              <>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows="3"
                  style={{ width: '100%', borderRadius: '6px', padding: '10px', border: '1px solid #ccc', marginBottom: '10px' }}
                />
                <div style={{ marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span
                      key={i}
                      onClick={() => setEditRating(i)}
                      style={{ ...starStyle(i <= editRating, 20), cursor: 'pointer' }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={{ marginLeft: 8 }}>({editRating})</span>
                </div>
                <button onClick={handleEdit} style={{ marginRight: 8 }}> Save</button>
                <button onClick={() => setEditId(null)}> Cancel</button>
              </>
            ) : (
              <>
                <p style={{ marginBottom: 10 }}>{c.comment}</p>
                {isOwner && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setEditId(c._id); setEditText(c.comment); setEditRating(c.rating); }}> Edit</button>
                    <button onClick={() => handleDelete(c._id)}> Delete</button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        {Array.from({ length: Math.ceil(total / commentsPerPage) }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => setPage(num)}
            style={{ marginRight: 4, fontWeight: page === num ? 'bold' : 'normal' }}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductReviewSection;
