import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createLoveAPI, Photo } from "../../api/loveApi";
import { useAuth } from "../../AuthContext";
import { Clock, Download, FolderInput, Info, Trash2 } from "lucide-react";
import { io } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FoldersListSelect from "../folders/FoldersListSelect";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FoldersChange from "../folders/FolderMove";

interface UserSummary {
  id: number;
  name: string;
}

interface DownloadInfo {
  user: UserSummary;
  numberOfTimes: number;
  lastDownloadedAt: string;
}

interface FolderInfo {
  id: number;
  name: string;
}

interface PhotoDetails {
  id: number;
  code: string;
  filename: string;
  original_name: string;
  created_at: string;
  uploaded_by: UserSummary | null;
  transferred_by: UserSummary | null;
  folders: FolderInfo[];
  downloads: DownloadInfo[];
}
export default function ImageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [photo, setPhoto] = useState<PhotoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [openPhotoId, setOpenPhotoId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [openMoveId, setOpenMoveId] = useState<number | null>(null);
  const [openDuplicateId, setOpenDuplicateId] = useState<number | null>(null);
  const api = createLoveAPI(token || "");

  const fetchPhotoDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.photosControllerGetDetails(id, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPhoto(data);
    } catch (err) {
      console.error("Erro ao buscar detalhes da foto:", err);
    } finally {
      setLoading(false);
    }
  };
  //Apaga a foto permanentemente
  const handleRemovePhoto = async (photoIds: string[] | string) => {
    const ids = Array.isArray(photoIds) ? photoIds : [photoIds];
    if (
      !confirm(
        `Estas foto serão apagadas porque não têm pasta, queres apagar ${ids.length} foto(s)?`
      )
    )
      return;

    try {
      for (const id of ids) await api.photosControllerRemove(id);
      setPhotos((prev) => prev.filter((p) => !ids.includes(p.id)));
      alert("Imagem apagada com sucesso!");

      navigate("/photosNoFolder");
    } catch (err) {
      console.error("Erro ao remover fotos:", err);
    }
  };
  const handleDelete = async (folderId: number) => {
    if (!confirm("Remover esta foto da pasta?")) return;
    try {
      await api.folderPhotosControllerRemovePhoto(folderId.toString(), id!);
      if (!id) return;
      setPhotos((prev) => prev.filter((p) => +p.id !== +id));
      if (photo?.folders.length && photo.folders.length > 0) {
        fetchPhotoDetails();
      } else {
        navigate(`/folders/${folderId}`);
      }
    } catch (err) {
      console.error("Erro ao remover foto:", err);
    }
  };

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
      socketRef.current.on("downloaded", (photoId: string) => {
        if (photoId === id) {
          fetchPhotoDetails();
        }
      });
      socketRef.current.on("imageChanged", (photoId: string) => {
        if (photoId === id) {
          fetchPhotoDetails();
        }
      });
      socketRef.current.on("imageDeleted", (photoId: string) => {
        if (photoId === id) {
          navigate("/photosNoFolder");
        }
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (token) fetchPhotoDetails();
  }, [id, token]);

  if (loading)
    return (
      <p className="text-rose-500 text-lg animate-pulse">
        Carregando detalhes da foto... 💖
      </p>
    );
  if (!photo)
    return <p className="text-red-500 text-lg">Foto não encontrada</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex flex-col items-center py-8 px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="!text-3xl !font-bold text-rose-600 mb-8 text-center drop-shadow-sm"
      >
        📸 Detalhes da Foto
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden shadow-xl w-full max-w-md mb-6"
      >
        <img
          onClick={() => window.open(api.getPhotoURL(photo.code), "_blank")}
          src={api.getPhotoURL(photo.code)}
          alt={photo.original_name}
          className="object-cover w-full h-80 rounded-lg cursor-pointer hover:brightness-105 transition-all"
        />
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
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
          className="!absolute !top-2 !left-2 !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent !outline-none !shadow-md"
        >
          <Download size={18} />
        </motion.button>
        {!photo.folders[0]?.name ? (
          <Dialog
            open={openPhotoId === +photo.id}
            onOpenChange={(isOpen) => setOpenPhotoId(isOpen ? +photo.id : null)}
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
                  fetchPhotoDetails();
                }}
              />
            </DialogContent>
          </Dialog>
        ) : (
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
                          fetchPhotoDetails();
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </motion.div>
              </PopoverContent>
            </AnimatePresence>
          </Popover>
        )}
        <Popover>
          <PopoverTrigger className="!absolute !top-3 !right-3 !outline-none !bg-black/40 hover:!bg-black/70 !text-white !rounded-full !p-2 !border-transparent">
            <Trash2 size={18} />
          </PopoverTrigger>

          <AnimatePresence>
            <PopoverContent
              asChild
              className="flex flex-col p-0 bg-transparent w-36 gap-1 !shadow-none !border-transparent !m-0"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {photo.folders.length === 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(id ? id : "");
                    }}
                    className="!w-full !px-4 !py-2 !rounded-full !font-semibold !text-red-600 
              !bg-gradient-to-r !from-white !to-rose-100 
              hover:!from-red-500 hover:!to-pink-500 hover:!text-white
              !transition-all !duration-300 !shadow-md !outline-none !border !border-pink-200"
                  >
                    Apagar imagem
                  </motion.button>
                ) : (
                  photo.folders.map((folder) => (
                    <motion.button
                      key={folder.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(folder.id);
                      }}
                      className="!w-full  !py-2 !rounded-full !font-semibold !text-red-600 
                !bg-gradient-to-r !from-white !to-rose-100 
                hover:!from-red-500 hover:!to-pink-500 hover:!text-white
                !transition-all !duration-300 !shadow-md !outline-none !border !border-pink-200"
                    >
                      {folder.name}
                    </motion.button>
                  ))
                )}
              </motion.div>
            </PopoverContent>
          </AnimatePresence>
        </Popover>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl mb-6 p-4 bg-white/80 rounded-lg shadow-md"
      >
        <p>
          <strong>Criada em:</strong>{" "}
          {new Date(photo.created_at).toLocaleString()}
        </p>
        <p>
          <strong>Adicionada por:</strong>{" "}
          {photo.uploaded_by?.name || "Desconhecido"}
        </p>
        <p>
          <p>
            <strong>Pastas:</strong>{" "}
            {photo.folders.length > 0
              ? photo.folders.map((f) => f.name).join(", ")
              : "Sem pasta"}
          </p>{" "}
        </p>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-semibold mb-4 text-rose-600"
      >
        Downloads por Utilizador
      </motion.h2>

      {photo.downloads.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-500 italic"
        >
          Nenhum download registrado
        </motion.p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          {photo.downloads.map((d, i) => (
            <motion.div
              key={d.user.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ scale: 1.05 }}
              className="flex-1 bg-white/90 rounded-lg shadow-md p-4 flex flex-col items-center justify-center border border-rose-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-rose-600 font-bold text-lg">
                  {d.user.name}
                </span>
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-sm">
                  {d.numberOfTimes}{" "}
                  {d.numberOfTimes === 1 ? "download" : "downloads"}
                </span>
              </div>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-rose-400" />
                Último download:{" "}
                <span className="font-medium text-gray-800 ml-1">
                  {new Date(d.lastDownloadedAt).toLocaleString()}
                </span>
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
