import * as React from "react";
import GlassCard from "@/components/ui/glass-card";
import { Code2, Server, Wrench } from "lucide-react";

export const GlassCardDemo = () => {
  return (
    <div className="flex min-h-[500px] w-full flex-wrap items-center justify-center gap-8 bg-[#f5f5f7] p-10">
      <GlassCard
        title="Frontend"
        eyebrow="Client Side"
        description="Membangun antarmuka modern, interaktif, responsif, dan berkinerja tinggi."
        skills={["HTML5", "CSS3", "JS (ES6+)", "React", "Next.js", "Tailwind"]}
        icon={<Code2 className="h-6 w-6 stroke-[#0066cc]" />}
        statusText="Core Technology"
        showSocials={false}
      />
      <GlassCard
        title="Backend"
        eyebrow="Server & Data"
        description="Pengembangan REST API, database terstruktur, dan arsitektur backend yang andal."
        skills={["Node.js", "Python", "PostgreSQL", "MongoDB", "REST API"]}
        icon={<Server className="h-6 w-6 stroke-[#0066cc]" />}
        statusText="High Performance"
        showSocials={false}
      />
      <GlassCard
        title="Tools"
        eyebrow="Workflow & DevOps"
        description="Alat kolaborasi, version control, CI/CD, prototyping, dan cloud deployment."
        skills={["Git", "Docker", "Vercel", "Figma", "VS Code"]}
        icon={<Wrench className="h-6 w-6 stroke-[#0066cc]" />}
        statusText="Dev Ecosystem"
        showSocials={false}
      />
    </div>
  );
};

export { GlassCardDemo as DemoOne };
export default GlassCardDemo;
