"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

export interface GalleryPhoto {
  id: string | number;
  image: string;
  title?: string;
  pdf?: string;
  issuer?: string;
  year?: number | string;
}

const defaultPhotos: GalleryPhoto[] = [
  { id: 1, image: "https://cdn.21st.dev/assets/mirror/6c/6cb3aeada3fd347bf4641131fdb05a482044f0233b1b6da0ffb5e83593001e3f.jpg", title: "Certificate 1" },
  { id: 2, image: "https://cdn.21st.dev/assets/mirror/e7/e7138a367854517395ba458c0c7c6481cf28afdc227b7d0045973e03e5b1d1c0.jpg", title: "Certificate 2" },
  { id: 3, image: "https://cdn.21st.dev/assets/mirror/96/9626c87f656eaa15e08486db4e7ecc217c0243440a21d301a3af6c8092b22a9b.jpg", title: "Certificate 3" },
  { id: 4, image: "https://cdn.21st.dev/assets/mirror/da/dacbcb481226af6c6e6bf6426da535ce260db87270fb641953617ffe4a1145bf.jpg", title: "Certificate 4" },
  { id: 5, image: "https://cdn.21st.dev/assets/mirror/6e/6e5ed03abf45ab11ad4c94b60bb3cb60326807a1777b2a6e8888d3179f237cd9.jpg", title: "Certificate 5" },
];

export interface InteractiveFolderGalleryProps {
  photos?: GalleryPhoto[];
  folderName?: string;
  dragHintText?: string;
  className?: string;
  onSelectCertificate?: (photo: GalleryPhoto) => void;
}

export function InteractiveFolderGallery({
  photos = defaultPhotos,
  folderName = "Certificates.gallery",
  dragHintText = "Drag any certificate down to close",
  className,
  onSelectCertificate
}: InteractiveFolderGalleryProps) {
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [hoverFolder, setHoverFolder] = useState(false);

  const total = photos.length;
  const mid = (total - 1) / 2;

  return (
    <div className={`w-full py-20 relative select-none ${className || ""}`}>
      <div className="relative w-full min-h-[520px] flex flex-col items-center justify-center">

        <div className="relative w-[500px] h-[580px] flex justify-center pointer-events-none z-0">

          {/* Folder Back / Interior */}
          <motion.div 
            className="absolute bottom-8 w-[410px] h-[275px] drop-shadow-2xl"
            animate={{ opacity: isFolderOpen ? 0 : 1, scale: isFolderOpen ? 0.9 : 1 }}
          >
            <div className="absolute top-0 left-0 w-36 h-10 bg-gradient-to-t from-[#1e1e1e] to-[#2a2a2a] rounded-t-xl border-t border-l border-r border-white/10" />
            <div className="absolute top-8 left-0 right-0 bottom-0 bg-gradient-to-b from-[#1e1e1e] to-[#0a0a0a] rounded-b-xl rounded-tr-xl border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" />
            <div className="absolute top-10 left-2 right-2 bottom-2 bg-black rounded-lg shadow-inner pointer-events-none" />
          </motion.div>

          {/* Cards Stack */}
          <div className="absolute bottom-12 z-10 flex justify-center">
            {photos.map((photo, i) => {
              const offset = total > 1 ? i - mid : 0;

              const stackY = hoverFolder ? offset * -12 - 46 : offset * -6;
              const stackX = hoverFolder ? offset * 32 : offset * 5;
              const stackRotate = hoverFolder ? offset * 6 : offset * 2.5;
              const stackScale = 1 - Math.abs(offset) * 0.025;

              const openSpacing = total > 4 ? Math.min(160, 800 / total) : 175;
              const openY = -170 + Math.abs(offset) * 12;
              const openX = offset * openSpacing;
              const openRotate = offset * 3.5;
              const openScale = 1.05;

              return (
                <motion.div
                  key={photo.id}
                  drag={isFolderOpen ? true : false}
                  dragSnapToOrigin={true}
                  onDragEnd={(e, info) => {
                    if (info.offset.y > 90 && isFolderOpen) {
                      setIsFolderOpen(false);
                      setHoverFolder(false);
                    }
                  }}
                  onClick={() => {
                    if (isFolderOpen && onSelectCertificate) {
                      onSelectCertificate(photo);
                    }
                  }}
                  className={`absolute bottom-0 w-[290px] h-[215px] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 origin-bottom bg-[#18181b] ${
                    isFolderOpen 
                      ? "cursor-pointer active:cursor-grabbing pointer-events-auto transition-shadow hover:shadow-[0_24px_50px_rgba(0,102,204,0.4)]" 
                      : "pointer-events-none"
                  }`}
                  animate={!isFolderOpen ? {
                    y: stackY,
                    x: stackX,
                    rotate: stackRotate,
                    scale: stackScale,
                    zIndex: i + 10
                  } : {
                    y: openY,
                    x: openX,
                    rotate: openRotate,
                    scale: openScale,
                    zIndex: 50 + i
                  }}
                  whileHover={isFolderOpen ? { scale: openScale + 0.08, zIndex: 120, y: openY - 15 } : {}}
                  whileDrag={isFolderOpen ? { scale: openScale + 0.1, rotate: 5, zIndex: 150 } : {}}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  <img 
                    src={photo.image} 
                    alt={photo.title || "Certificate"} 
                    className="w-full h-full object-cover pointer-events-none" 
                  />
                  {photo.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-6 text-white text-xs font-semibold truncate pointer-events-none">
                      {photo.title}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Folder Front Cover / Flap */}
          <motion.div 
            className="absolute bottom-2 w-[430px] h-[215px] drop-shadow-[0_-20px_40px_rgba(0,0,0,0.8)] cursor-pointer z-20 pointer-events-auto"
            style={{ transformOrigin: "bottom" }}
            animate={{ 
              opacity: isFolderOpen ? 0 : 1, 
              rotateX: hoverFolder ? -25 : 0, 
              y: hoverFolder ? 10 : 0,
              pointerEvents: isFolderOpen ? "none" : "auto" 
            }}
            onMouseEnter={() => setHoverFolder(true)}
            onMouseLeave={() => setHoverFolder(false)}
            onClick={() => setIsFolderOpen(true)}
          >
            <div className="w-full h-full bg-gradient-to-b from-[#2a2a2a] to-[#111] rounded-2xl border border-white/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] relative overflow-hidden flex items-end justify-center pb-8">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="px-5 py-2.5 bg-black/90 rounded-lg border border-black/80 shadow-inner flex items-center justify-center backdrop-blur-md gap-2">
                <span className="text-white/90 text-sm font-medium tracking-wide">
                  {folderName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {total}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Drag Hint / Close Button */}
        <motion.div 
          animate={{ opacity: isFolderOpen ? 1 : 0, y: isFolderOpen ? 0 : 40 }}
          className="absolute bottom-8 px-6 py-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md text-black/60 dark:text-white/60 text-xs font-medium tracking-wide flex items-center gap-3"
        >
          <span>{dragHintText}</span>
          <button 
            type="button" 
            onClick={() => { setIsFolderOpen(false); setHoverFolder(false); }}
            className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
          >
            Tutup Dompet
          </button>
        </motion.div>

      </div>
    </div>
  );
}

export { InteractiveFolderGallery as Component };
