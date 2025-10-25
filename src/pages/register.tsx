import React, { useState } from "react";
import { createLoveAPI } from "../api/loveApi";
import { useAuth } from "../AuthContext";

export const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const api = createLoveAPI(token || "");
      await api.usersControllerCreate({
        username,
        email,
        password_hash: password,
      });
      alert("💖 Registo concluído com sucesso!");
    } catch (err) {
      console.error(err);
      alert("💔 Erro ao registar.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-3xl p-10 w-full max-w-md border border-pink-200">
        <h2 className="!text-3xl font-bold text-center text-rose-600 mb-6">
          💕 Criar Conta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Nome de utilizador"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-400 outline-none"
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-400 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Palavra-passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-400 outline-none"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-300"
          >
            Registar 💞
          </button>
        </form>
      </div>
    </div>
  );
};
