import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createLoveAPI, Photo } from "../../api/loveApi";
import { useAuth } from "../../AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

export default function PhotoViewerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const api = createLoveAPI(token || "");

  const { ids = [], currentId } = (location.state as {
    ids: string[];
    currentId: string;
  }) || { ids: [], currentId: "" };

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(
    ids.findIndex((id) => id === currentId)
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res: Photo[] = [];
        for (const id of ids) {
          const { data } = await api.photosControllerFindOne(id);
          res.push(data);
        }
        setPhotos(res);
      } catch (err) {
        console.error("Erro ao buscar fotos:", err);
      }
    };
    if (token && ids.length) fetchPhotos();
  }, [ids, token]);

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Swipe handlers para mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (diff > 50) prevImage();
      if (diff < -50) nextImage();
      touchStartX.current = null;
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [photos]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") navigate(-1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photos]);

  if (!photos.length)
    return <div className="text-center mt-20 text-white">Carregando...</div>;

  const currentPhoto = photos[currentIndex];
  const imageUrl = api.getPhotoURL(currentPhoto.code);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    >
      {/* Botão de fechar */}
      <button
        onClick={() => navigate(-1)}
        className="absolute !top-5 !right-5 !text-white !p-2 !rounded-full hover:!bg-white/20 !border-transparent !outline-none"
      >
        <X size={24} />
      </button>

      {/* Botões de navegação apenas para desktop */}
      <div className="hidden md:flex">
        <button
          onClick={prevImage}
          className="!absolute !left-5 !text-white !p-2 !rounded-full hover:!bg-white/20 !border-transparent !outline-none"
        >
          <ArrowLeft size={24} />
        </button>

        <button
          onClick={nextImage}
          className="!absolute !right-5 !text-white !p-2 !rounded-full hover:!bg-white/20 !border-transparent !outline-none"
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Imagem */}
      <div className="max-w-[90%] sm:max-w-[90%] md:max-w-[40%] max-h-[90%] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentPhoto.id}
            src={imageUrl}
            alt={currentPhoto.original_name}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="object-contain max-w-full max-h-full rounded-lg shadow-lg"
          />
        </AnimatePresence>
      </div>
    </div>
  );
}
