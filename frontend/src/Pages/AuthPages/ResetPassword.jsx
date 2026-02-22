
// import React, { useState } from 'react';
// import { getAuth, confirmPasswordReset } from 'firebase/auth';
// import { useSearchParams } from 'react-router-dom';
// import app from '../../firebase';

// const ResetPassword = () => {
//   const [searchParams] = useSearchParams();
//   const [newPassword, setNewPassword] = useState('');
//   const [status, setStatus] = useState('');
//   const oobCode = searchParams.get('oobCode');

//   const handleReset = async (e) => {
//     e.preventDefault();
//     const auth = getAuth(app);

//     try {
//       await confirmPasswordReset(auth, oobCode, newPassword);
//       setStatus('✅ Password reset successful! You can now log in.');
//     } catch (err) {
//       console.error(err.message);
//       setStatus('❌ Error resetting password: ' + err.message);
//     }
//   };

//   return (
//     <div style={{ padding: '30px', maxWidth: '400px', margin: '0 auto' }}>
//       <h2>Reset Your Password</h2>
//       <form onSubmit={handleReset}>
//         <input
//           type="password"
//           placeholder="Enter new password"
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//           required
//           style={{ padding: '10px', width: '100%' }}
//         />
//         <br />
//         <button type="submit" style={{ marginTop: '15px', padding: '10px 20px' }}>
//           Reset Password
//         </button>
//       </form>
//       {status && <p style={{ marginTop: '20px' }}>{status}</p>}
//     </div>
//   );
// };

// export default ResetPassword;
