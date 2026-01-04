import { useEffect, useState } from 'react';

const Snowfall = () => {
    const [snowflakes, setSnowflakes] = useState([]);

    useEffect(() => {
        // Generate static snowflakes to avoid re-rendering issues
        const flakes = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100, // Random horizontal position
            animationDuration: Math.random() * 3 + 2, // Random fall speed between 2s and 5s
            animationDelay: Math.random() * 5, // Random start delay
            opacity: Math.random() * 0.5 + 0.3, // Random opacity
            size: Math.random() * 5 + 3 // Random size for visibility
        }));
        setSnowflakes(flakes);
    }, []);

    return (
        <div className="snowfall-container">
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="snowflake"
                    style={{
                        left: `${flake.left}%`,
                        animationDuration: `${flake.animationDuration}s`,
                        animationDelay: `${flake.animationDelay}s`,
                        opacity: flake.opacity,
                        width: `${flake.size}px`,
                        height: `${flake.size}px`
                    }}
                />
            ))}
        </div>
    );
};

export default Snowfall;
