
// import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from 'axios';

import SignUp from "./Pages/AuthPages/SignUp"
import SignIn from "./Pages/AuthPages/SignIn";
import ForgotPassword from "./Pages/AuthPages/ForgotPassword";
// import ResetPassword from "./Pages/AuthPages/ResetPassword";

import AdminPanel from "./Admin/AdminPanel";

import GetAllProductsForAdmin from "./Admin/ManageProducts/GetAllProductsForAdmin";
import CreateProduct from "./Admin/ManageProducts/createProduct"
import UpdateProduct from "./Admin/ManageProducts/UpdateProduct";
import GetProductDetailsForAdmin from "./Admin/ManageProducts/GetProductDetailsForAdmin";

import GetAllUsersForAdmin from "./Admin/MangerUsers/GetAllUsersForAdmin"
import GetAllOrdersForAdmin from "./Admin/ManageOrders/GetAllOrdersForAdmin";

import ProductAnalytics from "./Admin/ManageProducts/ProductAnalytics";
import UserAnalytics from "./Admin/MangerUsers/UserAnalytics";

import ChurnModel from "./Admin/MachineLearning/Churn/ChurnModel";
import SentimentManualText from "./Admin/MachineLearning/SentimentAnalysis/SentimentManualText";
import SentimentProductComments from "./Admin/MachineLearning/SentimentAnalysis/SentimentProductComments";

import ProtectedAdminRoute from "./Admin/AdminProtectedRoute";

import SendingMails from "./Admin/ManageMailer/SendingMails";
import Template from "./Admin/ManageMailer/EmailTemplates";

import Nav from "./Pages/NavigationPages/Nav"
// import Nav1 from "./Pages/NavigationPages/Nav1";
import Footer from "./Pages/NavigationPages/Footer"

// Src - Pages - General Pages
import GetAllProducts from "./Pages/GeneralPages/GetAllProducts";
import GetProductDetails from "./Pages/GeneralPages/ProductDetails/GetProductDetails";
import Cart from "./Pages/GeneralPages/Cart";
import AddShipping from "./Pages/GeneralPages/AddShipping";
import GetShipping from "./Pages/GeneralPages/GetShipping";
import Order from "./Pages/GeneralPages/Order";
import OrderSummary from "./Pages/GeneralPages/OrderSummary";
import TrackOrder from "./Pages/GeneralPages/trackOrder";
import OrderAnalytics from "./Admin/ManageOrders/OrderAnalytics";
import Message from "./Pages/GeneralPages/Message";
import ChatPage from "./Pages/GeneralPages/ChatPage";
import AboutUs from "./Pages/NavigationPages/About";
import ReturnsPolicy from "./Pages/NavigationPages/ReturnsPolicy";
import ContactUs from "./Pages/NavigationPages/ContactUs";
import HelpCenter from "./Pages/NavigationPages/HelpCenter";
import FAQ from "./Pages/NavigationPages/FAQ";

import PrivacyPolicy from "./Pages/NavigationPages/PrivacyPolicy";
import TermsOfService from "./Pages/NavigationPages/TermsOfService";

import Survey from "./Pages/NavigationPages/Survey";

import Complain from "./Pages/NavigationPages/Complain"

import CouponManager from "./Admin/CouponManager"

import AiChat from "./Pages/GeneralPages/AiChat";
import FloatingChatbot from "./Pages/GeneralPages/FloatingChatbot";

axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;

function App() {

  return (
    <>
      <Router>
        <Nav/>
        <Routes>
          {/* Pages  - Auth Pages */}
          <Route path='/signUp' element={<SignUp/>} />
          <Route path='/signIn' element={<SignIn/>} />
          <Route path='/forgotPassword' element={<ForgotPassword/>} />
          {/* <Route path='/resetPassword' element={<ResetPassword/>} /> */}

          {/* Pages - General Pages */}

          <Route path="/" element={<GetAllProducts/>} />
          <Route path="/getProductDetails/:id" element={<GetProductDetails/>}/>
          <Route path="/product/:id" element={<GetProductDetails/>}/>
          

          <Route path="/cart" element={<Cart/>} />
          <Route path="/addShipping" element={<AddShipping/>} />
          <Route path="/getAllShipping" element={<GetShipping/>} />
          <Route path="/order" element={<Order/>}/>
          <Route path="/orderSummary" element={<OrderSummary/>} />
          <Route path="/trackOrder" element={<TrackOrder/>} />
          {/* <Route path="/message" element={<Message/>} /> */}
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/returns" element={<ReturnsPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          <Route path="/survey" element={<Survey />} />

          <Route path="/complain" element={<Complain/>} />  

          <Route path="/couponManager" element={<CouponManager/>} />

          <Route path="/aiChat" element={<AiChat/>} />



         <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminPanel />}>
          {/* Products */}
            <Route path="products" element={<GetAllProductsForAdmin />} />
            <Route path="createProduct" element={<CreateProduct />} />
            <Route path="updateProduct/:id" element={<UpdateProduct />} />
            <Route path="getProductDetailsForAdmin/:id" element={<GetProductDetailsForAdmin />} />

            {/* Users */}

            <Route path="getAllUsersForAdmin" element={<GetAllUsersForAdmin/>}/>

            <Route path="getAllOrdersForAdmin" element={<GetAllOrdersForAdmin/>} />

            <Route path="productAnalytics" element={<ProductAnalytics/>} />
            <Route path="userAnalytics" element={<UserAnalytics/>} />
            <Route path="orderAnalytics" element={<OrderAnalytics/>} />

            <Route path="sendingMail" element={<SendingMails />} />

            <Route path="template" element={<Template />} />

            <Route path="churnModel" element={<ChurnModel />} />
            <Route path="sentimentModel" element={<SentimentManualText />} />
            <Route path="sentimentProductComments" element={<SentimentProductComments />} />




          </Route>  
        </Route>

        </Routes>
        <FloatingChatbot />
        <Footer/>
      </Router>
    </>
  )
}

export default App
