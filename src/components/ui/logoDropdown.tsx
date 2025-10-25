import { useAuth } from "@/AuthContext";
import { KeyRound, LogOut } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import { motion } from "framer-motion";
import { createLoveAPI } from "@/api/loveApi";

function LogoDropdown() {
  const [open, setOpen] = useState(false);
  const [clicked, setClicked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout, token, user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("💔 As passwords não coincidem.");
      return;
    }
    const api = createLoveAPI(token || "");
    if (!user?.id) return;
    await api.updateUserPassword(user?.id, {
      currentPassword: currentPassword,
      newPassword: newPassword,
    });
    setMessage("💖 Password alterada com sucesso!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOpenDialog(false);
  };

  const handleClick = () => {
    setClicked(!clicked);
    setOpen(!open);
  };

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !openDialog && // só fecha se o modal não estiver aberto
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setClicked(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDialog]); // <- ADICIONADO openDialog aqui

  return (
    <div className="relative flex flex-col items-center" ref={dropdownRef}>
      <img
        src="/logoIcon.png"
        alt="Logo"
        onClick={handleClick}
        className={`transition-transform w-25 duration-500 cursor-pointer hover:rotate-12 hover:scale-105 ${
          clicked ? "rotate-12 scale-110" : ""
        }`}
      />

      {open && (
        <div className="absolute top-full left-1/2 mt-2 w-56 bg-pink-50 backdrop-blur-md flex flex-col items-center rounded-2xl shadow-2xl border border-pink-200 z-50 transform -translate-x-1/2">
          <div className="p-2 text-rose-600 font-semibold border-b border-pink-200 w-full text-center">
            Gestão de Conta
          </div>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <div className="p-2 hover:bg-pink-200 cursor-pointer w-full text-center flex justify-center items-center gap-2 text-rose-700  transition-colors duration-200">
                <KeyRound size={18} />
                Alterar Password
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-[90%] sm:max-w-[90%] md:max-w-[35%] px-6 py-8 bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300 rounded-2xl shadow-2xl border border-pink-200">
              <motion.h2
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-bold text-rose-600 mb-6 text-center"
              >
                Alterar Password
              </motion.h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <motion.input
                  whileFocus={{ scale: 1.02, borderColor: "#ec4899" }}
                  transition={{ type: "spring", stiffness: 200 }}
                  type="password"
                  placeholder="Password Atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/50"
                />
                <motion.input
                  whileFocus={{ scale: 1.02, borderColor: "#ec4899" }}
                  transition={{ type: "spring", stiffness: 200 }}
                  type="password"
                  placeholder="Nova Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/50"
                />
                <motion.input
                  whileFocus={{ scale: 1.02, borderColor: "#ec4899" }}
                  transition={{ type: "spring", stiffness: 200 }}
                  type="password"
                  placeholder="Confirmar Nova Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/50"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-600 text-white py-3 rounded-lg shadow-lg font-semibold transition-all"
                >
                  Alterar Password 💞
                </motion.button>

                {message && (
                  <p className="mt-2 text-center text-sm text-rose-600 italic">
                    {message}
                  </p>
                )}
              </form>
            </DialogContent>
          </Dialog>

          {/* Botão de logout */}
          <div
            onClick={logout}
            className="p-2 hover:bg-pink-200 cursor-pointer w-full text-center flex justify-center items-center gap-2 text-rose-700 rounded-b-lg transition-colors duration-200"
          >
            <LogOut size={18} /> Sair
          </div>
        </div>
      )}
    </div>
  );
}

export default LogoDropdown;
