import { useEffect, useRef, useState } from "react";
import { createLoveAPI, Photo } from "../../api/loveApi";
import { useAuth } from "../../AuthContext";
import { io } from "socket.io-client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FoldersListSelect from "../folders/FoldersListSelect";
import {
  Download,
  FolderInput,
  Info,
  Trash,
  Trash2,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, number } from "framer-motion";
function usePhotoHeight(nOfColums: number) {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  if (nOfColums <= 1) {
    if (isMobile) return "!h-[420px]";
    if (isTablet) return "!h-[300px]";
    if (isDesktop) return "!h-[600px]";
    return "!h-[500px]";
  }
  if (nOfColums === 2) {
    if (isMobile) return "!h-[250px]";
    if (isTablet) return "!h-[260px]";
    if (isDesktop) return "!h-[400px]";
    return "!h-[320px]";
  }
  if (nOfColums === 4) {
    if (isMobile) return "!h-[120px]";
    if (isTablet) return "!h-[200px]";
    if (isDesktop) return "!h-[300px]";
    return "!h-[240px]";
  }
  if (isMobile) return "!h-[70px]";
  if (isTablet) return "!h-[160px]";
  if (isDesktop) return "!h-[180px]";
  return "!h-[180px]";
}
export default function PhotosNoFolderPage() {
  const { user, token } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPhotoId, setOpenPhotoId] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [nOfColums, setNOfColums] = useState(window.innerWidth < 640 ? 2 : 4);
  const api = createLoveAPI(token || "");
  const photoHeightClass = usePhotoHeight(nOfColums);

  // Buscar fotos
  const fetchPhotos = async () => {
    try {
      const response = await api.photosControllerFindNoFolder("");
      setPhotos(response.data);
    } catch (err) {
      console.error("Erro ao buscar fotos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Upload
  const handleUpload = async () => {
    if (!selectedFiles.length || !token) return;
    setUploading(true);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("uploaded_by", user?.id?.toString() || "");
        formData.append("original_name", file.name);
        await api.photosControllerUpload(formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setSelectedFiles([]);
      fetchPhotos();
    } catch (err) {
      console.error("Erro ao enviar fotos:", err);
    } finally {
      setUploading(false);
    }
  };

  // Socket
  const socketRef = useRef<any>(null);
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
      socketRef.current.on("noFolderUpdate", () => fetchPhotos());
      socketRef.current.on("imageAdded", () => {
        fetchPhotos();
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (token) fetchPhotos();
  }, [token]);

  // ⎋ ESC → cancelar seleção
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedPhotos.length > 0) {
        setSelectedPhotos([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotos]);

  // Remover
  const handleRemovePhoto = async (photoIds: string[] | string) => {
    const ids = Array.isArray(photoIds) ? photoIds : [photoIds];
    if (!confirm(`Apagar ${ids.length} foto(s)?`)) return;

    try {
      for (const id of ids) await api.photosControllerRemove(id);
      setPhotos((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelectedPhotos([]);
    } catch (err) {
      console.error("Erro ao remover fotos:", err);
    }
  };

  // Seleção
  const togglePhotoSelection = (id: number) => {
    setSelectedPhotos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handlePhotoClick = (e: React.MouseEvent, id: number) => {
    if (e.metaKey || e.ctrlKey) {
      togglePhotoSelection(id);
    } else if (selectedPhotos.length > 0) {
      togglePhotoSelection(id);
    }
  };

  return (
    <div className="!min-h-screen !bg-gradient-to-br !from-pink-100 !via-rose-100 !to-pink-200 !flex !flex-col !items-center !py-8 !px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="!text-4xl !font-bold !text-rose-600 !mb-8 !text-center drop-shadow-sm"
      >
        📸 Fotos sem Pasta
      </motion.h1>
      {photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="!w-full sm:!w-96 !mb-6 flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              navigate(`/photo-viewer`, {
                state: {
                  ids: photos.map((p) => p.id),
                  currentId: photos[0].id,
                },
              })
            }
            className="!px-4 !py-2 !rounded-lg !bg-rose-500 !text-white !text-xs !shadow-md !border-transparent !outline-none"
          >
            Visualizar Todas
          </motion.button>
        </motion.div>
      )}
      <div className="flex items-center justify-center gap-3 mb-6">
        {(window.innerWidth > 640
          ? [2, 4, 6, 8] // Desktop
          : [1, 2, 4, 6]
        ) // Mobile
          .map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNOfColums(num)}
              className={`!px-5 !py-2 !rounded-full !font-semibold !transition-all !duration-300 !ease-in-out !shadow-md !backdrop-blur-md !border !outline-none
        ${
          nOfColums === num
            ? "!bg-gradient-to-r !from-rose-500 !to-pink-500 !text-white !border-pink-400 !shadow-lg"
            : "!bg-gradient-to-r !from-white !to-pink-50 !text-rose-500 !border-pink-200 hover:!from-pink-100 hover:!to-white"
        }`}
            >
              {num}️
            </motion.button>
          ))}
      </div>

      {loading ? (
        <p className="!text-rose-500 !text-lg animate-pulse">
          A carregar fotos com amor... 💖
        </p>
      ) : photos.length === 0 ? (
        <p className="!text-rose-500 !text-lg italic animate-fadeIn">
          Nenhuma foto encontrada sem pasta. 🌸
        </p>
      ) : (
        <>
          {/* Ações em massa */}
          {selectedPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="!fixed !bottom-6 !bg-white/90 !shadow-xl !rounded-2xl !px-6 !py-3 !flex !items-center !gap-4 !backdrop-blur-md !border !border-rose-200 !z-50"
            >
              <span className="!text-rose-600 !font-semibold">
                {selectedPhotos.length} selecionada(s)
              </span>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRemovePhoto(selectedPhotos.map(String))}
                className="!bg-rose-500 hover:!bg-rose-600 !text-white !rounded-full !px-5 !py-2 !shadow-md"
              >
                🗑️ Apagar
              </motion.button>
            </motion.div>
          )}

          {/* Grade de Fotos */}
          <motion.div
            style={{
              gridTemplateColumns: `repeat(${nOfColums}, minmax(0, 1fr))`,
            }}
            className="grid gap-1 sm:gap-1 md:gap-6 w-[98%] sm:w-[98%] md:w-[70%] "
          >
            {photos.map((photo, i) => {
              const isSelected = selectedPhotos.includes(+photo.id);
              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.04 }}
                  className={`relative ${
                    window.innerWidth < 640 && nOfColums > 2
                      ? "rounded-sm"
                      : "rounded-3xl"
                  } overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer
    ${isSelected ? "border-4 border-pink-400" : "border border-transparent"}`}
                  onClick={(e) => handlePhotoClick(e, +photo.id)}
                >
                  <img
                    onClick={() => {
                      if (
                        (window.innerWidth < 640 && nOfColums > 2) ||
                        (window.innerWidth > 640 && nOfColums > 6)
                      ) {
                        navigate(`/photo/${photo.id}`);
                      } else {
                        window.open(api.getPhotoURL(photo.code), "_blank");
                      }
                    }}
                    src={api.getPhotoURL(photo.code)}
                    alt={photo.original_name}
                    className={`object-cover w-full cursor-pointer hover:brightness-105 transition-all ${photoHeightClass}`}
                  />

                  {/* Botões de ação */}
                  {((nOfColums <= 2 && window.innerWidth < 640) ||
                    (window.innerWidth > 640 && nOfColums <= 6)) && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const imageUrl = api.getPhotoURL(photo.code);
                          try {
                            await api.photoDownloadsControllerRecord(
                              photo.id.toString(),
                              user?.id?.toString() || ""
                            );
                            const res = await fetch(imageUrl);
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = photo.original_name || "foto.jpg";
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error("Erro ao transferir:", err);
                            alert("Erro ao transferir ou registar o download.");
                          }
                        }}
                        className="!absolute !outline-none !top-3 !left-3 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent"
                      >
                        <Download size={18} />
                      </motion.button>
                      <Dialog
                        open={openPhotoId === +photo.id}
                        onOpenChange={(isOpen) =>
                          setOpenPhotoId(isOpen ? +photo.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <motion.button
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            className="!absolute !outline-none !bottom-3 !left-3 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent"
                          >
                            <FolderInput size={18} />
                          </motion.button>
                        </DialogTrigger>

                        <DialogContent className="!w-[90%] !h-[90%] p-0 max-h-full max-w-full !rounded-2xl">
                          <FoldersListSelect
                            imageId={+photo.id}
                            onSuccess={() => {
                              setOpenPhotoId(null);
                              fetchPhotos();
                            }}
                          />
                        </DialogContent>
                      </Dialog>

                      <motion.button
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(photo.id);
                        }}
                        className="!absolute !top-3 !outline-none !right-3 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent"
                      >
                        <Trash2 size={18} />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        onClick={() => navigate(`/photo/${photo.id}`)}
                        className="!absolute !bottom-3 !outline-none !right-3 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent"
                      >
                        <Info size={18} />
                      </motion.button>
                    </>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      {/* Área de Upload */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="!mt-12 !flex !flex-col !items-center !gap-4"
      >
        {selectedFiles.length > 0 && (
          <div className="!flex !gap-4 !flex-wrap !justify-center !mb-2">
            {selectedFiles.map((file, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="!relative !w-44 !h-44 !rounded-2xl !overflow-hidden !shadow-lg !flex !items-center !justify-center !bg-white/70 !backdrop-blur-md"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview da foto"
                  className="!object-cover !w-full !h-full"
                />
                <button
                  onClick={() =>
                    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="!absolute !top-2 !right-2 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !text-sm"
                >
                  ✖
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <label className="!w-full sm:!w-96 !px-6 !py-4 !border-2 !border-dashed !border-rose-300 !rounded-2xl !cursor-pointer hover:!border-pink-400 hover:!bg-pink-50 !transition-all !duration-300 !text-center !text-rose-500">
          <Upload className="!inline-block !mr-2" size={18} />
          Escolher Fotos 💞
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (!e.target.files) return;
              setSelectedFiles(Array.from(e.target.files));
            }}
            className="!hidden"
          />
        </label>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleUpload}
          disabled={!selectedFiles.length || uploading}
          className="!bg-rose-500 hover:!bg-rose-600 !text-white !px-8 !py-3 !rounded-full !shadow-lg !transition-all disabled:!opacity-50"
        >
          {uploading ? "💫 A enviar..." : "💖 Adicionar Fotos"}
        </motion.button>
      </motion.div>
    </div>
  );
}
