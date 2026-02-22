
import React from "react";
import { getAuth, signOut } from "firebase/auth";
import { useDispatch } from "react-redux";
import { clearUser } from "@Redux/reducers/userSlice"; 
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { clearCart as clearGuestCart } from '@Redux/reducers/guestCartSlice'
import { clearShipping as clearGuestShipping } from '@Redux/reducers/guestShippingSlice'
import { clearOrderId } from "@Redux/reducers/orderIdSlice";
import { clearOrder as clearGuestOrder } from '@Redux/reducers/guestOrderSlice'
import { useTranslation } from 'react-i18next';




const SignOut = () => {

  const { t } = useTranslation();
  

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = getAuth();

  const clearAll = () => {
    dispatch(clearUser());
    dispatch(clearGuestCart());
    dispatch(clearGuestShipping());
    dispatch(clearGuestOrder())
    dispatch(clearOrderId());
};

  const handleSignOut = async () => {
    try {
      await signOut(auth);               
      clearAll();
      toast.success(t('signOut.success'));       
      navigate("/signIn", { replace: true });
      window.location.reload();              
    } catch (error) {
      console.error(t('signOut.error'), error.message);
      toast.error(error.message);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-red-500 text-white px-4 py-2 rounded"
    >
      {t('auth.logout')}
    </button>
  );
};

export default SignOut;
