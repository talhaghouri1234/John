import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import Loader from '../components/Loader.jsx';

const Home = lazy(() => import('../pages/public/Home.jsx'));
const Login = lazy(() => import('../pages/public/Login.jsx'));
const Register = lazy(() => import('../pages/public/Register.jsx'));
const NotFound = lazy(() => import('../pages/public/NotFound.jsx'));
const Unauthorized = lazy(() => import('../pages/public/Unauthorized.jsx'));
const SessionHome = lazy(() => import('../pages/SessionHome.jsx'));

export default function AppRoutes() {
  return <Suspense fallback={<Loader />}><Routes><Route element={<PublicLayout />}><Route index element={<Home />} /><Route path="login" element={<Login />} /><Route path="register" element={<Register />} /><Route path="unauthorized" element={<Unauthorized />} /><Route element={<ProtectedRoute />}><Route element={<RoleRoute role="admin" />}><Route path="admin/dashboard" element={<SessionHome />} /></Route><Route element={<RoleRoute role="user" />}><Route path="user/dashboard" element={<SessionHome />} /></Route></Route><Route path="*" element={<NotFound />} /></Route></Routes></Suspense>;
}
