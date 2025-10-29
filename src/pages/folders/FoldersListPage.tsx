import { useEffect, useRef, useState } from "react";
import { Folder, createLoveAPI } from "../../api/loveApi";
import { useAuth } from "../../AuthContext";
import { io } from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "../../components/ui/dialog";
import CreateFolderPage from "./CreateFolderPage";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function FoldersListPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const [wasMe, setWasMe] = useState(false);
  const navigate = useNavigate();
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [coverPreviews, setCoverPreviews] = useState<Record<string, string>>(
    {}
  );
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [editingFiles, setEditingFiles] = useState<Record<string, File | null>>(
    {}
  );
  const [showHidden, setShowHidden] = useState(false);
  const [savingFolders, setSavingFolders] = useState<Record<string, boolean>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");

  const socketRef = useRef<any>(null);

  const fetchFolders = async () => {
    try {
      const api = createLoveAPI(token || "");
      const response = await api.foldersControllerFindAll();
      setFolders(response.data);

      const urls: Record<string, string> = {};
      await Promise.all(
        response.data.map(async (folder) => {
          if (folder.cover_photo_code) {
            try {
              const coverResp = await api.foldersControllerGetCover(
                folder.cover_photo_code,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  responseType: "blob",
                }
              );
              urls[folder.cover_photo_code] = URL.createObjectURL(
                coverResp.data
              );
            } catch (err) {
              console.error("Erro ao buscar capa:", err);
            }
          }
        })
      );
      setCoverUrls(urls);
    } catch (err) {
      console.error("Erro ao buscar pastas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socketRef.current) {
      let baseURL = "https://framelove-api.goncalocgomes.pt/";
      if (typeof window !== "undefined") {
        const url = window.location.host;
        if (url.includes(":5173")) {
          baseURL = `http://${window.location.hostname}:3000`;
        }
      }

      socketRef.current = io(baseURL);

      socketRef.current.on("folderImageEdited", () => fetchFolders());
      socketRef.current.on("folderEdited", () => {
        fetchFolders();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [wasMe]);

  useEffect(() => {
    if (!token) return;
    fetchFolders();
  }, [token]);

  const handleEditChange = (folderId: string, value: string) => {
    setEditing({ ...editing, [folderId]: value });
  };

  const handleCoverUpload = (folderId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setCoverPreviews((prev) => ({ ...prev, [folderId]: previewUrl }));
    setEditingFiles((prev) => ({ ...prev, [folderId]: file }));
  };

  const handleSave = async (folderId: string) => {
    if (!token) return;
    const newName = editing[folderId];
    const newFile = editingFiles[folderId];
    if (!newName && !newFile) return;

    try {
      // marcar como salvando
      setSavingFolders((prev) => ({ ...prev, [folderId]: true }));

      const api = createLoveAPI(token);
      setWasMe(true);

      if (newName) {
        await api.foldersControllerUpdate(folderId, { name: newName });
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
        );
      }

      if (newFile) {
        await api.foldersControllerUploadCover(folderId, newFile);

        const folderResp = await api.foldersControllerFindOne(folderId);
        const newCode = folderResp.data.cover_photo_code;

        if (newCode) {
          const coverResp = await api.foldersControllerGetCover(newCode, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob",
          });
          setCoverUrls((prev) => ({
            ...prev,
            [newCode]: URL.createObjectURL(coverResp.data),
          }));
        }
      }

      // limpar estados de edição
      const newEditing = { ...editing };
      delete newEditing[folderId];
      setEditing(newEditing);

      setCoverPreviews((prev) => {
        const copy = { ...prev };
        delete copy[folderId];
        return copy;
      });
      setEditingFiles((prev) => {
        const copy = { ...prev };
        delete copy[folderId];
        return copy;
      });
    } catch (err) {
      console.error("Erro ao atualizar pasta:", err);
    } finally {
      // remover flag de salvando
      setSavingFolders((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  const toggleVisibility = async (folderId: string, visible: boolean) => {
    if (!token) return;
    try {
      const api = createLoveAPI(token);
      await api.foldersControllerUpdate(folderId, { visible });
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, visible } : f))
      );
    } catch (err) {
      console.error("Erro ao atualizar visibilidade:", err);
    }
  };

  const displayedFolders = folders.filter((f) => showHidden || f.visible);
  const filteredFolders = displayedFolders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex flex-col items-center py-8 px-6 relative overflow-hidden">
      {/* 🌸 Bolhas animadas de fundo */}
      <motion.div
        className="absolute top-10 left-10 w-24 h-24 bg-rose-300 rounded-full blur-3xl opacity-40"
        animate={{ y: [0, 25, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-16 w-32 h-32 bg-pink-400 rounded-full blur-3xl opacity-30"
        animate={{ y: [0, -25, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 💕 Título principal */}
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="!text-4xl font-bold text-rose-600 mb-10 text-center drop-shadow-sm"
      >
        💕 Pastas
      </motion.h1>

      {loading ? (
        <p className="text-rose-500 text-lg animate-pulse">
          Carregando com amor... 💖
        </p>
      ) : displayedFolders.length === 0 ? (
        <p className="text-rose-400 text-lg italic animate-fadeIn">
          Nenhuma pasta encontrada. 💌
        </p>
      ) : (
        <>
          <div className="w-full max-w-2xl mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Procurar pastas..."
              className="w-full px-4 py-2 rounded-lg !border !border-rose-300 focus:outline-none focus:ring-2 focus:!ring-pink-400 text-rose-600 placeholder-rose-300"
            />
          </div>

          {/* 💫 Grid de pastas */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.1 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl animate-fadeInUp"
          >
            {filteredFolders.map((folder, index) => {
              const folderId = folder.id;
              const folderIdStr = folder.id.toString();
              const coverUrl =
                coverPreviews[folderIdStr] ||
                (folder.cover_photo_code
                  ? coverUrls[folder.cover_photo_code]
                  : undefined);

              return (
                <motion.div
                  key={folderId}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 120 }}
                  className={`!group !bg-white/90 !backdrop-blur-md !border !border-pink-200 !rounded-3xl !shadow-md !px-6 !py-3 !flex !flex-col !items-center !text-center hover:!shadow-rose-200 hover:!scale-[1.03] hover:!shadow-2xl !transition-all !duration-500 !ease-out ${
                    !folder.visible ? "!opacity-50" : "!opacity-100"
                  }`}
                  onClick={() => {
                    if (editing[folderIdStr] === undefined) {
                      localStorage.setItem("selectedFolderName", folder.name);
                      navigate(`/folders/${folder.id}`);
                    }
                  }}
                >
                  {/* 👁️ Botão de visibilidade */}
                  {editing[folderIdStr] === undefined ? (
                    <div className="flex w-full justify-end mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(folderIdStr, !folder.visible);
                        }}
                        className="!text-xs !text-gray-500 !underline !outline-none !bg-transparent hover:!text-rose-400 !transition-colors !border-transparent"
                      >
                        {folder.visible ? "👁️ Ocultar" : "🙈 Mostrar"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-8" />
                  )}

                  {/* 📸 Capa */}
                  {editing[folderIdStr] !== undefined ? (
                    <label className="relative w-full h-40 rounded-2xl mb-3 border-2 border-dashed border-rose-300 cursor-pointer overflow-hidden flex items-center justify-center">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={`Capa da pasta ${folder.name}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-5xl animate-pulse">💖</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xl font-medium">Editar</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (!e.target.files?.[0]) return;
                          handleCoverUpload(folderIdStr, e.target.files[0]);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                  ) : coverUrl ? (
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      src={coverUrl}
                      alt={`Capa da pasta ${folder.name}`}
                      className="w-full h-40 object-cover rounded-2xl mb-3 shadow-sm group-hover:shadow-md transition-shadow duration-300"
                    />
                  ) : (
                    <div className="text-5xl mb-3 animate-bounce-slow">💖</div>
                  )}

                  {/* ✏️ Nome e edição */}
                  {editing[folderIdStr] !== undefined ? (
                    <input
                      type="text"
                      value={editing[folderIdStr]}
                      onChange={(e) =>
                        handleEditChange(folderIdStr, e.target.value)
                      }
                      className="w-full px-3 py-1 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-400 mb-2 text-center"
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-rose-600 mb-1">
                      {folder.name}
                    </h2>
                  )}

                  <p className="text-sm text-rose-400">
                    Criado por{" "}
                    <span className="font-medium text-rose-500">
                      {folder.created_by?.username ?? "Desconhecido"}
                    </span>
                  </p>
                  <p className="text-xs text-rose-300 mt-2">
                    {folder.created_at
                      ? new Date(folder.created_at).toLocaleDateString()
                      : "—"}
                  </p>

                  {/* 💾 Botões */}
                  {editing[folderIdStr] !== undefined ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSave(folderIdStr)}
                      disabled={!!savingFolders[folderIdStr]}
                      className={`!mt-4 !bg-rose-500 hover:!bg-rose-600 !text-white !py-1 !px-4 !rounded-lg !shadow-md hover:!shadow-lg !transition-all !duration-300 !outline-none !border-transparent ${
                        savingFolders[folderIdStr]
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {savingFolders[folderIdStr]
                        ? "💾 A Salvar..."
                        : "💾 Salvar"}
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing({
                          ...editing,
                          [folderIdStr]: folder.name,
                        });
                      }}
                      className="!mt-3 !text-sm !text-pink-500 !underline hover:!text-rose-400 !transition-all !duration-200 !bg-transparent !border-transparent !outline-none"
                    >
                      ✏️ Editar
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* 🌸 Mostrar pastas ocultas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-6 flex items-center gap-3 mt-10 animate-fadeIn text-sm text-rose-500 font-medium cursor-pointer"
          >
            <input
              type="checkbox"
              checked={showHidden}
              onChange={() => setShowHidden(!showHidden)}
              className="accent-rose-400 w-4 h-4"
            />
            Mostrar pastas ocultas
          </motion.div>
        </>
      )}

      {/* 💫 Botão flutuante */}
      <Dialog>
        <DialogTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.15, rotate: 8 }}
            whileTap={{ scale: 0.9 }}
            className="!fixed !bottom-8 !right-8 !bg-gradient-to-br !from-rose-500 !to-pink-500 !text-white !rounded-full !w-16 !h-16 !flex !items-center justify-center !shadow-lg hover:!shadow-2xl !transition-all !duration-300 !animate-pulse-slow"
          >
            <Plus size={24} />
          </motion.button>
        </DialogTrigger>
        <DialogContent className="max-w-[90%] sm:max-w-[90%] md:max-w-[35%] px-4 py-8 bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300 rounded-2xl shadow-xl border border-pink-200">
          <CreateFolderPage />
        </DialogContent>
      </Dialog>
    </div>
  );
}
