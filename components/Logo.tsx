import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`font-['Space_Grotesk'] text-2xl font-bold tracking-[2px] uppercase text-white ${className}`}>
            Midas<span className="text-[#FFD700]">.</span>
        </div>
    );
};
