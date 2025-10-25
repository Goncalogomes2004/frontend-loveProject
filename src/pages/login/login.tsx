import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [numHearts, setNumHearts] = useState(60);
  const [hearts, setHearts] = useState<
    { x: number; rotate: number; delay: number; emoji: string }[]
  >([]);
  const heartVariants = ["💖", "💗", "💘", "💝", "💞"];

  useEffect(() => {
    const updateNumHearts = () => {
      let numHearts: number;
      if (window.innerWidth < 640) {
        numHearts = 30;
      } else if (window.innerWidth < 1024) {
        numHearts = 30;
      } else {
        numHearts = 60;
      }

      const heartEmojis = Array.from({ length: numHearts }).map(() => ({
        x: Math.random() * 100,
        rotate: Math.random() * 360,
        delay: Math.random() * 5,
        emoji: heartVariants[Math.floor(Math.random() * heartVariants.length)],
      }));
      const sealEmojis = Array.from({ length: Math.floor(numHearts / 4) }).map(
        () => ({
          x: Math.random() * 100,
          rotate: Math.random() * 360,
          delay: Math.random() * 5,
          emoji: "🦭",
        })
      );

      const brainEmojis = Array.from({ length: Math.floor(numHearts / 4) }).map(
        () => ({
          x: Math.random() * 100,
          rotate: Math.random() * 360,
          delay: Math.random() * 5,
          emoji: "🧠",
        })
      );

      setHearts([...heartEmojis, ...sealEmojis, ...brainEmojis]);
    };

    updateNumHearts();
    window.addEventListener("resize", updateNumHearts);
    return () => window.removeEventListener("resize", updateNumHearts);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/folders");
    } catch (err: any) {
      setError("💔 Credenciais inválidas. Tenta novamente.");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex items-center justify-center overflow-hidden p-3">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {hearts.map((heart, i) => (
          <motion.div
            key={i}
            initial={{ y: -30, opacity: 70 }}
            animate={{
              y: "110vh",
              opacity: [0, 1, 1, 0],
              x: [0, (heart.x - 50) * 2],
              rotate: [0, heart.rotate],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: heart.delay,
              ease: "easeInOut",
            }}
            className="absolute text-2xl select-none"
            style={{
              left: `${heart.x}%`,
              color:
                heart.emoji === "💖"
                  ? "#f472b6"
                  : heart.emoji === "🦭"
                  ? "#60a5fa"
                  : "#a78bfa",
            }}
          >
            {heart.emoji}
          </motion.div>
        ))}
      </div>

      {/* Restante do cartão de login */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/90 backdrop-blur-md shadow-xl rounded-3xl p-10 w-full max-w-md border border-pink-200 relative z-10"
      >
        <motion.h2
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="!text-3xl !font-bold text-center text-rose-600 mb-6"
        >
          🔐 Entrar
        </motion.h2>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-center mb-4 font-semibold"
          >
            {error}
          </motion.p>
        )}

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-5"
        >
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80"
            required
          />
          <input
            type="password"
            placeholder="Palavra-passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-pink-300 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80"
            required
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-transform duration-300"
          >
            Entrar 💖
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
