import { useState } from "react";
import { Folder, createLoveAPI } from "../../api/loveApi";
import { useAuth } from "../../AuthContext";
import { motion } from "framer-motion";

export default function CreateFolderPage() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const { user, token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setMessage("💔 Erro: usuário não autenticado.");
      return;
    }

    try {
      const api = createLoveAPI(token || "");
      // 1️⃣ Criar a pasta
      const response = await api.foldersControllerCreate({
        name,
        created_by: user,
      } as Folder);

      const folderId = response.data.id;

      if (file) {
        await api.foldersControllerUploadCover(folderId.toString(), file);
      }

      setMessage(`💖 Pasta "${response.data.name}" criada com sucesso!`);
      setName("");
      setFile(null);
      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage("💔 Erro ao criar pasta.");
    }
  };

  return (
    <div className="flex flex-col items-center  justify-center bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300 overflow-hidden relative">
      {/* Fundo decorativo animado */}
      <motion.div
        className="absolute top-10 left-10 w-24 h-24 bg-rose-300 rounded-full blur-3xl opacity-40"
        animate={{ y: [0, 20, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-16 right-16 w-32 h-32 bg-pink-400 rounded-full blur-3xl opacity-30"
        animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Card principal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="bg-white/90 backdrop-blur-md  rounded-3xl p-8 w-full max-w-md text-center border border-rose-200 relative z-10"
      >
        <motion.h1
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="!text-2xl !font-bold text-rose-600 mb-6 drop-shadow-sm"
        >
          ✨ Cria uma Nova Pasta 💌
        </motion.h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <motion.input
            whileFocus={{ scale: 1.03, borderColor: "#ec4899" }}
            transition={{ type: "spring", stiffness: 200 }}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da pasta..."
            className="w-full px-4 py-2 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          <motion.label
            whileHover={{ scale: 1.02 }}
            className="block w-full text-sm font-medium text-rose-500 text-left"
          >
            Capa da pasta 💕
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full px-4 py-2 border-dashed rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/50 cursor-pointer"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
            />
          </motion.label>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="!w-full !border-transparent !outline-none !bg-gradient-to-r !from-pink-500 !to-rose-500 hover:!from-rose-500 hover:!to-pink-600 !text-white !py-3 !rounded-lg !shadow-lg !font-semibold !transition-all"
          >
            Criar Pasta 💞
          </motion.button>
        </form>

        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-rose-600 font-medium"
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
