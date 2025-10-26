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
interface FoldersListSelectProps {
  imageId: number;
  onSuccess?: () => void;
}
export default function FoldersListSelect({
  imageId,
  onSuccess,
}: FoldersListSelectProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const [wasMe, setWasMe] = useState(false);
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [coverPreviews, setCoverPreviews] = useState<Record<string, string>>(
    {}
  );
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [editingFiles, setEditingFiles] = useState<Record<string, File | null>>(
    {}
  );
  const [showHidden, setShowHidden] = useState(false);

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
    }
  };

  const displayedFolders = folders.filter((f) => showHidden || f.visible);
  const api = createLoveAPI(token || "");

  return (
    <div className="bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex flex-col items-center py-8 px-6 relative !rounded-lg  overflow-y-auto">
      <h1 className="text-4xl font-bold text-rose-600 mb-6 text-center drop-shadow-sm">
        💕 Pastas
      </h1>

      {/* Toggle de pastas ocultas */}

      {loading ? (
        <p className="text-rose-500 text-lg animate-pulse">
          Carregando com amor... 💖
        </p>
      ) : displayedFolders.length === 0 ? (
        <p className="text-rose-400 text-lg italic">
          Nenhuma pasta encontrada. 💌
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
            {displayedFolders.map((folder) => {
              const folderId = folder.id;
              const folderIdStr = folder.id.toString();
              const coverUrl =
                coverPreviews[folderIdStr] ||
                (folder.cover_photo_code
                  ? coverUrls[folder.cover_photo_code]
                  : undefined);

              return (
                <div
                  key={folderId}
                  className={`bg-white/90 backdrop-blur-md border border-pink-200 rounded-3xl shadow-lg px-6 py-1 flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${
                    !folder.visible ? "opacity-50" : ""
                  }`}
                  onClick={async () => {
                    try {
                      await api.folderPhotosControllerAddPhoto(folderId!, {
                        id: imageId.toString(),
                      });
                      onSuccess?.(); // ✅ fecha o dialog
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <div className="mt-6"></div>
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={`Capa da pasta ${folder.name}`}
                      className="w-full h-40 object-cover rounded-2xl mb-3"
                    />
                  ) : (
                    <div className="text-5xl mb-3">💖</div>
                  )}

                  {/* Edição do nome */}
                  {editing[folderIdStr] !== undefined ? (
                    <div className="flex flex-col w-full items-center">
                      <input
                        type="text"
                        value={editing[folderIdStr]}
                        onChange={(e) =>
                          handleEditChange(folderIdStr, e.target.value)
                        }
                        className="w-full px-3 py-1 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-400 mb-2"
                      />
                    </div>
                  ) : (
                    <h2 className="text-xl font-semibold text-rose-600 mb-1">
                      {folder.name}
                    </h2>
                  )}

                  <div className="mb-2"></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
