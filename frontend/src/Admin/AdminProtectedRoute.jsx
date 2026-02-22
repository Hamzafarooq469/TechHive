
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';  // or your auth logic
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedAdminRoute = () => {
  const user = useSelector((state) => state.user.currentUser?.user); // example, adapt to your state shape

  if (!user || user.role !== 'admin') {
    // You can also show an unauthorized page instead
    toast.error("You are not authorized to access this.")
    return <Navigate to="/signIn" />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
