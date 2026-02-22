
import { getAuth } from 'firebase/auth';

// Function to get a fresh token from Firebase
export const AdminFreshToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    // Force token refresh by passing 'true'
    const token = await user.getIdToken(true);
    return token;
  } else {
    throw new Error("User is not authenticated.");
  }
};
