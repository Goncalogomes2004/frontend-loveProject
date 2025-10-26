import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createLoveAPI, Photo } from "../../api/loveApi";
import { useAuth } from "../../AuthContext";
import { io } from "socket.io-client";
import { Download, Info, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function FolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const api = createLoveAPI(token || "");

  const fetchPhotos = async () => {
    try {
      const response = await api.folderPhotosControllerFindByFolder(id!);
      setPhotos(response.data);
    } catch (err) {
      console.error("Erro ao buscar fotos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Socket para atualizações em tempo real
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

      socketRef.current.on("imageEdited", (folderId: string) => {
        if (folderId === id) fetchPhotos();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id]);

  const handleUpload = async () => {
    if (!selectedFiles.length || !token) return;
    setUploading(true);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("uploaded_by", user?.id?.toString() || "");
        formData.append("original_name", file.name);

        const { data: uploadedPhoto } = await api.photosControllerUpload(
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        await api.folderPhotosControllerAddPhoto(id!, {
          id: uploadedPhoto.id,
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

  const handleDelete = async (photoId: number) => {
    if (!confirm("Remover esta foto da pasta?")) return;
    try {
      await api.folderPhotosControllerRemovePhoto(id!, photoId.toString());
      setPhotos((prev) => prev.filter((p) => +p.id !== photoId));
    } catch (err) {
      console.error("Erro ao remover foto:", err);
    }
  };

  useEffect(() => {
    if (token && id) fetchPhotos();
  }, [id, token]);

  return (
    <div className="!min-h-screen !bg-gradient-to-br !from-pink-100 !via-rose-100 !to-pink-200 !flex !flex-col !items-center !py-12 !px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="!text-3xl !font-bold !text-rose-600 !mb-8 !text-center drop-shadow-sm"
      >
        📸 Fotos Da Pasta
      </motion.h1>

      {loading ? (
        <p className="!text-rose-500 !text-lg animate-pulse">
          A carregar fotos com amor... 💖
        </p>
      ) : (
        <>
          {/* Grade de Fotos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="!grid !grid-cols-2 sm:!grid-cols-3 md:!grid-cols-4 !gap-4 sm:!gap-6 !w-full !max-w-5xl"
          >
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.04 }}
                className="!relative !rounded-3xl !overflow-hidden !shadow-md hover:!shadow-2xl !transition-all !duration-300"
              >
                <img
                  onClick={() =>
                    window.open(api.getPhotoURL(photo.code), "_blank")
                  }
                  src={api.getPhotoURL(photo.code)}
                  alt={photo.original_name}
                  className="!object-cover !w-full !h-52 !cursor-pointer hover:!brightness-105 !transition-all"
                />

                {/* Botão de Info */}
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  onClick={() => navigate(`/photo/${photo.id}`)}
                  className="!absolute !bottom-3 !right-3 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent !outline-none"
                >
                  <Info size={18} />
                </motion.button>

                {/* Botão de Remover */}
                <motion.button
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  onClick={() => handleDelete(+photo.id)}
                  className="!absolute !top-3 !right-3 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent !outline-none"
                >
                  <Trash2 size={18} />
                </motion.button>

                {/* Botão de Download */}
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
                  className="!absolute !top-3 !left-3 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent !outline-none"
                >
                  <Download size={18} />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

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
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
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
        </>
      )}
    </div>
  );
}
