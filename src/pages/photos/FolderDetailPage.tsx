import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createLoveAPI, Folder, Photo } from "../../api/loveApi";
import { useAuth } from "../../AuthContext";
import { io } from "socket.io-client";
import { Download, FolderInput, Info, Trash2, Upload } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FoldersListSelect from "../folders/FoldersListSelect";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FoldersChange from "../folders/FolderMove";
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
export default function FolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [nOfColums, setNOfColums] = useState(window.innerWidth < 640 ? 2 : 4);
  const photoHeightClass = usePhotoHeight(nOfColums);
  const folderName = localStorage.getItem("selectedFolderName");
  const api = createLoveAPI(token || "");
  const [openMoveId, setOpenMoveId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingPage, setIsDraggingPage] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [openDuplicateId, setOpenDuplicateId] = useState<number | null>(null);

  const fetchFolder = async () => {
    try {
      const response = await api.foldersControllerFindOne(id!);
      setSelectedFolder(response.data);
    } catch (err) {
      console.error("Erro ao buscar fotos:", err);
    } finally {
      setLoading(false);
    }
  };
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
      socketRef.current.on("folderEdited", () => {
        fetchFolder();
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
    if (token && id) {
      fetchFolder();
      fetchPhotos();
    }
  }, [id, token]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingPage(true);
      }}
      onDragLeave={() => setIsDraggingPage(false)}
      className="!min-h-screen !bg-gradient-to-br !from-pink-100 !via-rose-100 !to-pink-200 !flex !flex-col !items-center !py-8 !px-6"
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="!text-3xl !font-bold !text-rose-600 !mb-8 !text-center drop-shadow-sm"
      >
        📸 Fotos da Pasta
        <p className="text-[18px] text-rose-400 font-light italic mt-1 tracking-wide">
          {selectedFolder?.name}
        </p>
        <button
          onClick={() =>
            navigate(`/photo-viewer`, {
              state: { ids: photos.map((p) => p.id), currentId: photos[0].id },
            })
          }
          className="!px-4 !py-2 !rounded-lg !bg-rose-500 !text-white !text-xs !border-transparent !outline-none"
        >
          Visualizar Todas
        </button>
      </motion.h1>

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
      ) : (
        <>
          {/* Grade de Fotos */}
          <motion.div
            style={{
              gridTemplateColumns: `repeat(${nOfColums}, minmax(0, 1fr))`,
            }}
            className="grid gap-1 sm:gap-1 md:gap-6 w-[98%] sm:w-[98%] md:w-[70%] "
          >
            {photos.map((photo, i) => {
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
                  } overflow-hidden shadow-md hover:shadow-2xl cursor-pointer`}
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
                  {((nOfColums <= 2 && window.innerWidth < 640) ||
                    (window.innerWidth > 640 && nOfColums <= 6)) && (
                    <>
                      <Popover>
                        <PopoverTrigger className="!absolute !outline-none !bottom-3 !left-3 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent">
                          <FolderInput size={18} />
                        </PopoverTrigger>

                        {/* Framer Motion adiciona a animação */}
                        <AnimatePresence>
                          <PopoverContent
                            asChild
                            className="flex flex-col p-0 bg-transparent w-25 gap-1 !shadow-none !border-transparent !m-0"
                          >
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                              <Dialog
                                open={openMoveId === +photo.id}
                                onOpenChange={(isOpen) =>
                                  setOpenMoveId(isOpen ? +photo.id : null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="!w-full !px-4 !py-2 !rounded-full !font-semibold !text-rose-600  
             !bg-gradient-to-r !from-white !to-rose-100 
             hover:!from-rose-500 hover:!to-pink-500 hover:!text-white
             !transition-all !duration-300 !shadow-md !outline-none !border !border-pink-200"
                                  >
                                    Mover
                                  </motion.button>
                                </DialogTrigger>

                                <DialogContent className="!w-[90%] !h-[90%] p-0 max-h-full max-w-full !rounded-2xl">
                                  <FoldersChange
                                    imageId={+photo.id}
                                    currentFolderId={id ? id : ""}
                                    onSuccess={() => {
                                      setOpenMoveId(null);
                                      fetchPhotos();
                                    }}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Dialog
                                open={openDuplicateId === +photo.id}
                                onOpenChange={(isOpen) =>
                                  setOpenDuplicateId(isOpen ? +photo.id : null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="!w-full !px-4 !py-2 !rounded-full !font-semibold !text-rose-600 
             !bg-gradient-to-r !from-white !to-rose-100 
             hover:!from-rose-500 hover:!to-pink-500 hover:!text-white
             !transition-all !duration-300 !shadow-md !outline-none !border !border-pink-200"
                                  >
                                    Duplicar
                                  </motion.button>
                                </DialogTrigger>

                                <DialogContent className="!w-[90%] !h-[90%] p-0 max-h-full max-w-full !rounded-2xl">
                                  <FoldersListSelect
                                    imageId={+photo.id}
                                    onSuccess={() => {
                                      setOpenDuplicateId(null);
                                      fetchPhotos();
                                    }}
                                  />
                                </DialogContent>
                              </Dialog>
                            </motion.div>
                          </PopoverContent>
                        </AnimatePresence>
                      </Popover>

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
                    </>
                  )}
                  {/* Botão de Info */}
                </motion.div>
              );
            })}
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
                      className="!absolute !top-2 !right-2 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !px-2 !py-1 !border-transparent  !text-sm !outline-none "
                    >
                      ✖
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            <label
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  setSelectedFiles((prev) => [
                    ...prev,
                    ...Array.from(e.dataTransfer.files),
                  ]);
                }
                setIsDragging(false);
                setIsDraggingPage(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => {
                setIsDragging(false);
              }}
              className={`!w-full sm:!w-96 !px-6 !py-4 !border-2 !border-dashed !rounded-2xl !cursor-pointer !text-center !transition-all duration-300
      ${
        isDragging
          ? "!border-pink-400 !bg-pink-50 h-40"
          : isDraggingPage
          ? "border-rose-300 bg-white/0 h-40"
          : "!border-rose-300 !bg-white/0 h-20"
      } !text-rose-500 flex justify-center items-center gap-2`}
            >
              <Upload className="!inline-block !mr-2" size={18} />
              Arraste ou clique para escolher fotos 💞
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
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
