"use client";

import * as React from "react";
import { Instagram, Twitter, Github, ChevronDown } from "lucide-react";

export const ULogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 29.667 31.69"
    {...props}
  >
    <path d="M12.827,1.628A1.561,1.561,0,0,1,14.31,0h2.964a1.561,1.561,0,0,1,1.483,1.628v11.9a9.252,9.252,0,0,1-2.432,6.852q-2.432,2.409-6.963,2.409T2.4,20.452Q0,18.094,0,13.669V1.628A1.561,1.561,0,0,1,1.483,0h2.98A1.561,1.561,0,0,1,5.947,1.628V13.191a5.635,5.635,0,0,0,.85,3.451,3.153,3.153,0,0,0,2.632,1.094,3.032,3.032,0,0,0,2.582-1.076,5.836,5.836,0,0,0,.816-3.486Z" />
    <path d="M75.207,20.857a1.561,1.561,0,0,1-1.483,1.628h-2.98a1.561,1.561,0,0,1-1.483-1.628V1.628A1.561,1.561,0,0,1,70.743,0h2.98a1.561,1.561,0,0,1,1.483,1.628Z" transform="translate(-45.91 0)" />
    <path d="M0,80.018A1.561,1.561,0,0,1,1.483,78.39h26.7a1.561,1.561,0,0,1,1.483,1.628v2.006a1.561,1.561,0,0,1-1.483,1.628H1.483A1.561,1.561,0,0,1,0,82.025Z" transform="translate(0 -51.963)" />
  </svg>
);

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  eyebrow?: string;
  description?: string;
  skills?: string[];
  icon?: React.ReactNode;
  statusText?: string;
  actionText?: string;
  onActionClick?: () => void;
  showSocials?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className = "",
      title = "Frontend",
      eyebrow = "Client Side",
      description = "Membangun antarmuka modern, interaktif, responsif, dan berkinerja tinggi.",
      skills = ["HTML5", "CSS3", "JS (ES6+)", "React", "Next.js"],
      icon,
      statusText = "Core Technology",
      actionText,
      onActionClick,
      showSocials = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`group relative h-[410px] w-full max-w-[340px] select-none [perspective:1000px] ${className}`}
        {...props}
      >
        {/* Extended invisible hover buffer to prevent fast-cursor edge loss */}
        <div className="pointer-events-auto absolute -inset-3.5 z-0" />

        <div className="relative h-full rounded-[38px] bg-gradient-to-br from-white/95 via-white/85 to-[#f6f8fc]/80 border border-white/95 shadow-[0_16px_36px_-12px_rgba(0,50,120,0.08),0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all duration-500 ease-out [transform-style:preserve-3d] group-hover:[transform:rotate3d(1,1,0,30deg)] group-hover:shadow-[32px_52px_35px_-28px_rgba(0,70,180,0.3),0_20px_30px_rgba(0,0,0,0.06)]">
          {/* Frosted Glass Inset */}
          <div className="pointer-events-none absolute inset-2 rounded-[30px] border-b-[1.5px] border-l-[1.5px] border-white/95 border-t border-r border-blue-500/10 bg-gradient-to-b from-white/50 to-blue-50/15 backdrop-blur-md [transform-style:preserve-3d] [transform:translate3d(0,0,25px)]" />

          {/* 3D Animated Text & Skills Layer */}
          <div className="absolute inset-0 flex flex-col justify-between p-7 [transform-style:preserve-3d] [transform:translate3d(0,0,26px)] transition-transform duration-500 group-hover:[transform:translate3d(0,0,42px)]">
            <div className="pt-2 [transform-style:preserve-3d]">
              {eyebrow && (
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#0066cc] transition-transform duration-500 group-hover:[transform:translate3d(0,0,30px)]">
                  {eyebrow}
                </span>
              )}
              <span className="block text-2xl font-black tracking-tight text-[#1d1d1f] transition-transform duration-500 group-hover:[transform:translate3d(0,0,48px)]">
                {title}
              </span>
              <span className="mt-2 block text-[13px] leading-relaxed text-[#515154] transition-transform duration-500 group-hover:[transform:translate3d(0,0,36px)]">
                {description}
              </span>

              {/* 3D Popping Skill Tags */}
              {skills && skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 [transform-style:preserve-3d]">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full border border-black/[0.08] bg-white/85 px-3 py-1 text-xs font-semibold text-[#1d1d1f] shadow-sm backdrop-blur-md transition-all duration-400 ease-out [transform-style:preserve-3d] [transform:translate3d(0,0,22px)] group-hover:border-[#0071e3]/30 group-hover:bg-white group-hover:text-[#004499] group-hover:[box-shadow:0_14px_28px_-4px_rgba(0,80,200,0.22)] group-hover:[transform:translate3d(0,0,68px)] hover:!border-[#0071e3] hover:!bg-[#0071e3] hover:!text-white hover:![transform:translate3d(0,0,105px)_scale(1.12)]"
                      style={{
                        transitionDelay: `${40 + index * 40}ms`,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Status */}
            <div className="flex items-center justify-between border-t border-black/[0.06] pt-3 [transform-style:preserve-3d] [transform:translate3d(0,0,22px)] group-hover:[transform:translate3d(0,0,36px)] transition-transform duration-500">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#66666e]">
                <span className="h-2 w-2 rounded-full bg-[#34c759] shadow-[0_0_8px_rgba(52,199,89,0.7)]" />
                <span>{statusText}</span>
              </div>

              {actionText && (
                <div
                  onClick={onActionClick}
                  className="flex cursor-pointer items-center justify-end gap-1 text-xs font-bold text-[#0066cc] transition-all duration-200 hover:text-[#004499]"
                >
                  <span>{actionText}</span>
                  <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>

          {/* Floating Concentric 3D Rings & Top-Right Badge */}
          <div className="pointer-events-none absolute top-0 right-0 [transform-style:preserve-3d]">
            {[
              { size: "170px", pos: "8px", zRest: "20px", zHover: "32px", delay: "0s" },
              { size: "140px", pos: "10px", zRest: "40px", zHover: "64px", delay: "0.1s" },
              { size: "110px", pos: "17px", zRest: "60px", zHover: "96px", delay: "0.2s" },
              { size: "80px", pos: "23px", zRest: "80px", zHover: "128px", delay: "0.3s" },
            ].map((circle, index) => (
              <div
                key={index}
                className="absolute aspect-square rounded-full border border-blue-500/[0.09] bg-blue-500/[0.04] shadow-[-10px_10px_20px_rgba(0,80,180,0.1)] transition-all duration-500 ease-out group-hover:bg-blue-500/[0.08] group-hover:border-blue-500/[0.22] group-hover:shadow-[-14px_14px_26px_rgba(0,80,180,0.18)]"
                style={{
                  width: circle.size,
                  top: circle.pos,
                  right: circle.pos,
                  transform: `translate3d(0, 0, ${circle.zRest})`,
                  transitionDelay: circle.delay,
                }}
              />
            ))}
            <div
              className="absolute grid aspect-square w-[52px] place-content-center rounded-full bg-white border border-[#0066cc]/[0.16] shadow-[-8px_12px_24px_rgba(0,102,204,0.16)] transition-all duration-500 ease-out [transform:translate3d(0,0,100px)] group-hover:[transform:translate3d(0,0,160px)_scale(1.1)] group-hover:shadow-[-14px_22px_36px_rgba(0,113,227,0.32)]"
              style={{ top: "26px", right: "26px", transitionDelay: "0.4s" }}
            >
              {icon || <ULogo className="w-5 fill-[#0066cc]" />}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
