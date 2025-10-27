import './index.css';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Register } from "./pages/register";
import CreateFolderPage from "./pages/folders/CreateFolderPage";
import FolderDetailPage from "./pages/photos/FolderDetailPage";
import PhotosNoFolderPage from "./pages/photos/PhotosWithNoFolder";
import PhotoViewerPage from "./pages/photos/PhotoViewerPage";
import ImageDetailPage from "./pages/photos/PhotoDetailsPage";
import FoldersListPage from "./pages/folders/FoldersListPage";
import { Login } from './pages/login/login';
import { AuthProvider, useAuth } from './AuthContext';
import LogoDropdown from "@/components/ui/logoDropdown";
import { Fish, Turtle } from 'lucide-react';
import { useState } from 'react';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}
function AppRoutes() {
  const { token } = useAuth();
  const location = useLocation();
  const [clicked, setClicked] = useState(false);

  const handleClick = () => setClicked(!clicked);
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && (
        <nav className="fixed top-0 left-0 right-0 z-50 !h-18 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white shadow-lg flex items-center justify-between px-6 backdrop-blur-sm animate-gradient-x">
          <div className="flex items-center justify-end !h-full relative w-full mr-10">
            <Link
              to="/folders"
              className={`link-fish flex flex-col items-center justify-center gap-2 !h-full px-4 font-semibold relative transition-all duration-300
                ${location.pathname.startsWith("/folders")
                  ? "!active !text-yellow-100"
                  : "!text-white hover:!text-yellow-100"}`}
            >
              <p>📁</p>
              <p className="-mt-3 w-full">Pastas</p>
              <Fish className="icon-left ml-4 fill-cyan-400 text-cyan-300 drop-shadow-lg" />
            </Link>
          </div>

          <div className="flex items-center justify-center">
            <LogoDropdown />
          </div>

          <div className="flex items-center justify-start !h-full relative w-full ml-10">
            <Link
              to="/photosNoFolder"
              className={`link-turtle flex flex-col items-center justify-center gap-2 !h-full font-semibold relative transition-all duration-300
                ${location.pathname.startsWith("/photosNoFolder")
                  ? "!active !text-yellow-100"
                  : "!text-white hover:!text-yellow-100"}`}
            >
              <p>🖼️</p>
              <p className="-mt-3 w-full">Sem Pasta</p>
              <Turtle className="icon-right mr-4 fill-lime-400 text-lime-300 drop-shadow-lg" />
            </Link>
          </div>
        </nav>
      )}

      <main className={`main-content !p-0 animate-fadeInUp min-h-screen ${hideNavbar ? '' : 'mt-18 '}`}>
        <Routes>
          {/* Login e Registo */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Pastas */}
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
            path="/photo-viewer"
            element={
              <ProtectedRoute>
                <PhotoViewerPage />
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

          {/* Fotos sem pasta */}
          <Route
            path="/photosNoFolder"
            element={
              <ProtectedRoute>
                <PhotosNoFolderPage />
              </ProtectedRoute>
            }
          />

          {/* Foto detalhe */}
          <Route
            path="/photo/:id"
            element={
              <ProtectedRoute>
                <ImageDetailPage />
              </ProtectedRoute>
            }
          />

          {/* 🔥 Catch-all route */}
          <Route
            path="*"
            element={<Navigate to={token ? "/folders" : "/login"} replace />}
          />
        </Routes>
      </main>

      <style>
        {`
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 6s ease infinite;
          }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
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
