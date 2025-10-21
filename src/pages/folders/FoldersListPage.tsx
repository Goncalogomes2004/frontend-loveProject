import { useEffect, useState } from "react";
import { Folder, getLoveAPI } from "../../api/loveApi";

export default function FoldersListPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const api = getLoveAPI();
        const response = await api.foldersControllerFindAll();
        setFolders(response.data);
      } catch (err) {
        console.error("Erro ao buscar pastas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200 p-8">
      <h1 className="text-4xl font-bold text-center text-rose-600 mb-8">
        💕 Minhas Pastas
      </h1>

      {loading ? (
        <p className="text-center text-pink-700">Carregando com amor... 💖</p>
      ) : folders.length === 0 ? (
        <p className="text-center text-pink-500 font-medium">
          Nenhuma pasta criada ainda. 💌
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white border border-pink-200 shadow-lg rounded-2xl p-6 flex flex-col items-center hover:shadow-rose-200 transition duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-rose-300 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md mb-4">
                💖
              </div>
              <h2 className="text-lg font-semibold text-rose-700 mb-1">
                {folder.name}
              </h2>
              <p className="text-sm text-pink-600">
                Criado por: {folder.created_by?.username ?? "Desconhecido"}
              </p>
              <p className="text-xs text-pink-500 mt-2">
                {folder.created_at
                  ? new Date(folder.created_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
