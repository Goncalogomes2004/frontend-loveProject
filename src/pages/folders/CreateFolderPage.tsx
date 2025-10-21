import { useState } from "react";
import { Folder, getLoveAPI } from "../../api/loveApi";

export default function CreateFolderPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const api = getLoveAPI(); // inicializa o client
      const response = await api.foldersControllerCreate({
        name,
      } as unknown as Folder);

      setMessage(`💖 Pasta "${response.data.name}" criada com sucesso!`);
      setName("");
    } catch (error) {
      console.error(error);
      setMessage("💔 Erro ao criar pasta.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center border-2 border-pink-300">
        <h1 className="text-3xl font-bold text-rose-600 mb-6">
          Criar Nova Pasta 💌
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nome da pasta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-lg transition duration-300"
          >
            Criar Pasta 💞
          </button>
        </form>

        {message && (
          <p className="mt-4 text-pink-700 font-semibold animate-fade-in">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
