import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Register } from "./pages/register";
import CreateFolderPage from "./pages/folders/CreateFolderPage";
import FoldersListPage from "./pages/folders/FoldersListPage";
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <nav className="!bg-gradient-to-r !from-pink-400 !via-rose-400 !to-pink-500 !text-white !shadow-md !p-4 !flex !justify-center !gap-6 !fixed !top-0 !left-0 !right-0 !z-50">
        <Link
          to="/"
          className="hover:!text-yellow-100 !transition !duration-300 !font-semibold"
        >
          Home
        </Link>
        <Link
          to="/register"
          className="hover:text-yellow-100 transition duration-300 font-semibold"
        >
          Registar
        </Link>
        <Link
          to="/folders"
          className="hover:text-yellow-100 transition duration-300 font-semibold"
        >
          Pastas
        </Link>
        <Link
          to="/createFolders"
          className="hover:!text-yellow-100 !transition !duration-300 !font-semibold"
        >
          Criar Pastas
        </Link>
      </nav>

      <main className="pt-20">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/folders" element={<FoldersListPage />} />
          <Route path="/createFolders" element={<CreateFolderPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
