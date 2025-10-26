import './index.css';
import './App.css';
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Register } from "./pages/register";
import CreateFolderPage from "./pages/folders/CreateFolderPage";
import FolderDetailPage from "./pages/photos/FolderDetailPage";
import PhotosNoFolderPage from "./pages/photos/PhotosWithNoFolder";
import ImageDetailPage from "./pages/photos/PhotoDetailsPage";
import FoldersListPage from "./pages/folders/FoldersListPage";
import { Login } from './pages/login/login';
import { AuthProvider, useAuth } from './AuthContext';

import { useState } from 'react';
import LogoDropdown from "@/components/ui/logoDropdown";





function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { token, logout } = useAuth();
  const [rotated, setRotated] = useState(false);
 const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    // Alterna o estado
    alert(clicked)
    setClicked(!clicked);
  };

  if (!token) return <Login />;

return (
  <>
    {/* 🌈 Navbar com gradiente animado */}
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white shadow-lg p-4 flex justify-center items-center gap-8 backdrop-blur-sm animate-gradient-x">
<div className='w-full flex justify-center sm:justify-center md:justify-end'>
      
      <Link
        to="/folders"
        className="relative flex justify-end !text-white font-semibold transition-all duration-300 hover:text-yellow-100 after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-yellow-100 after:left-1/2 after:-bottom-1 after:transition-all after:duration-300 hover:after:w-full hover:after:left-0"
      >
        📁<br></br> Pastas
      </Link>
</div>

  <div className="flex items-center justify-center relative group">
      <LogoDropdown/>
        </div>


<div className='w-full flex justify-center sm:justify-center md:justify-start'>
      <Link
        to="/photosNoFolder"
        className="!text-white  relative   font-semibold transition-all duration-300 hover:text-yellow-100 after:content-[''] after:absolute after:w-0 after:h-[2px] after:!bg-yellow-100 after:left-1/2 after:-bottom-1 after:transition-all after:duration-300 hover:after:w-full hover:after:left-0"
      >
        🖼️ <br></br>Sem Pasta
      </Link>
</div>
     
     
    </nav>

    {/* ✨ Área principal com transição de entrada */}
    <main className="main-content mt-10 animate-fadeInUp min-h-screen">
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route
          path="/folders"
          element={
            <ProtectedRoute>
              <FoldersListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/createFolders"
          element={
            <ProtectedRoute>
              <CreateFolderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/folders/:id"
          element={
            <ProtectedRoute>
              <FolderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/photo/:id"
          element={
            <ProtectedRoute>
              <ImageDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/photosNoFolder"
          element={
            <ProtectedRoute>
              <PhotosNoFolderPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </main>

    {/* 🌸 Pequenas animações globais */}
    <style>
      {`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 6s ease infinite;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
      `}
    </style>
  </>
);

}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
