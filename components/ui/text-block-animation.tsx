"use client"

import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useRef } from "react"
import { cn } from "@/lib/utils";

// Ensure plugins are registered
gsap.registerPlugin(SplitText, ScrollTrigger);

export default function TextBlockAnimation({
    children,
    animateOnScroll = true,
    delay = 0,
    blockColor = "#000",
    stagger = 0.1, // Reduced for smoother flow
    duration = 0.6 // Slightly faster for snappiness
}) {
    const containerRef = useRef(null);

    useGSAP(() => {
        if (!containerRef.current) return;

        // 1. Setup SplitText
        const split = new SplitText(containerRef.current, {
            type: "lines",
            linesClass: "block-line-parent", // Generic class for styling if needed
        });

        // 2. Wrap lines and inject the block revealer manually
        // We do this to avoid layout thrashing by doing it in one pass
        const lines = split.lines;
        const blocks = [];

        lines.forEach((line) => {
            // Create the wrapper (clip-path logic often works better, but we stick to your block logic)
            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.display = "block";
            wrapper.style.overflow = "hidden"; // Ensures text doesn't show outside
            
            // Create the Revealer Block
            const block = document.createElement("div");
            block.style.position = "absolute";
            block.style.top = "0";
            block.style.left = "0";
            block.style.width = "100%";
            block.style.height = "100%";
            block.style.backgroundColor = blockColor;
            block.style.zIndex = "2";
            block.style.transform = "scaleX(0)";
            block.style.transformOrigin = "left center";
            
            // Insert wrapper and move line inside
            line.parentNode.insertBefore(wrapper, line);
            wrapper.appendChild(line);
            wrapper.appendChild(block);
            
            // Set initial state of line to invisible
            gsap.set(line, { opacity: 0 });
            
            blocks.push(block);
        });

        // 3. Create the Master Timeline
        const tl = gsap.timeline({
            defaults: { ease: "power4.inOut" },
            scrollTrigger: animateOnScroll ? {
                trigger: containerRef.current,
                start: "top 80%",
                toggleActions: "play none none none",
            } : null,
            delay: delay
        });

        // Step A: Animate Blocks in (cover text)
        tl.to(blocks, {
            scaleX: 1,
            duration: duration,
            stagger: stagger,
            transformOrigin: "left center",
        })
        // Step B: Show all lines instantly under the blocks
        .set(lines, {
            opacity: 1,
        }, `-=${duration / 2}`) // Reveal text half-way through the block expansion
        // Step C: Animate Blocks out (reveal text)
        .to(blocks, {
            scaleX: 0,
            duration: duration,
            stagger: stagger,
            transformOrigin: "right center",
        }, `-=${duration / 2}`); // Start exiting as they finish entering

    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="relative inline-block overflow-hidden">
            {children}
        </div>
    );
}
