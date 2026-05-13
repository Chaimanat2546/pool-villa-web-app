"use client";

import { useRef, useState } from "react";

type HouseCarouselProps = {
    children: React.ReactNode;
};

export function HouseCarousel({ children }: HouseCarouselProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const isMouseDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const [isDragging, setIsDragging] = useState(false);

    function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
        const element = scrollRef.current;
        if (!element) return;

        isMouseDown.current = true;
        setIsDragging(false);

        startX.current = event.pageX - element.offsetLeft;
        scrollLeft.current = element.scrollLeft;
    }

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const element = scrollRef.current;
        if (!element || !isMouseDown.current) return;

        const x = event.pageX - element.offsetLeft;
        const walk = x - startX.current;

        if (Math.abs(walk) > 5) {
            setIsDragging(true);
        }

        element.scrollLeft = scrollLeft.current - walk;
    }

    function stopDragging() {
        isMouseDown.current = false;

        setTimeout(() => {
            setIsDragging(false);
        }, 0);
    }

    function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
        if (isDragging) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    return (
        <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            onClickCapture={handleClickCapture}
            className="flex cursor-grab select-none gap-4 overflow-x-auto scroll-smooth pb-4 active:cursor-grabbing"
        >
            {children}
        </div>
    );
}
