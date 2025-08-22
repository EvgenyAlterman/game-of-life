/**
 * Conway's Game of Life Pattern Library
 * A comprehensive collection of famous and interesting patterns
 */

export const GameOfLifePatterns = {
    
    // ===== STILL LIFES (Static Patterns) =====
    
    block: {
        name: "Block",
        description: "Simple 2x2 still life - the most basic stable pattern",
        category: "Still Life",
        pattern: [
            [1, 1],
            [1, 1]
        ]
    },
    
    beehive: {
        name: "Beehive", 
        description: "Hexagonal still life - very stable pattern",
        category: "Still Life",
        pattern: [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [0, 1, 1, 0]
        ]
    },
    
    loaf: {
        name: "Loaf",
        description: "Asymmetric still life resembling a loaf of bread",
        category: "Still Life", 
        pattern: [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [0, 1, 0, 1],
            [0, 0, 1, 0]
        ]
    },
    
    boat: {
        name: "Boat",
        description: "Small boat-shaped still life",
        category: "Still Life",
        pattern: [
            [1, 1, 0],
            [1, 0, 1],
            [0, 1, 0]
        ]
    },
    
    tub: {
        name: "Tub",
        description: "Small tub-shaped still life",
        category: "Still Life",
        pattern: [
            [0, 1, 0],
            [1, 0, 1],
            [0, 1, 0]
        ]
    },
    
    // ===== OSCILLATORS (Repeating Patterns) =====
    
    blinker: {
        name: "Blinker",
        description: "Period 2 oscillator - alternates between horizontal and vertical",
        category: "Oscillator",
        period: 2,
        pattern: [
            [1, 1, 1]
        ]
    },
    
    toad: {
        name: "Toad",
        description: "Period 2 oscillator that flips orientation",
        category: "Oscillator", 
        period: 2,
        pattern: [
            [0, 1, 1, 1],
            [1, 1, 1, 0]
        ]
    },
    
    beacon: {
        name: "Beacon",
        description: "Period 2 oscillator - corners blink on and off",
        category: "Oscillator",
        period: 2,
        pattern: [
            [1, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 0, 1, 1],
            [0, 0, 1, 1]
        ]
    },
    
    pulsar: {
        name: "Pulsar",
        description: "Period 3 oscillator - one of the most common naturally occurring",
        category: "Oscillator",
        period: 3,
        pattern: [
            [0,0,1,1,1,0,0,0,1,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [0,0,1,1,1,0,0,0,1,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,1,1,1,0,0],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,1,1,1,0,0]
        ]
    },
    
    pentadecathlon: {
        name: "Pentadecathlon",
        description: "Period 15 oscillator - long-lived complex pattern",
        category: "Oscillator",
        period: 15,
        pattern: [
            [0,0,1,0,0,0,0,1,0,0],
            [1,1,0,1,1,1,1,0,1,1],
            [0,0,1,0,0,0,0,1,0,0]
        ]
    },
    
    // ===== SPACESHIPS (Moving Patterns) =====
    
    glider: {
        name: "Glider",
        description: "Period 4 spaceship - moves diagonally across the grid",
        category: "Spaceship",
        period: 4,
        velocity: "1/4 diagonal",
        pattern: [
            [0, 1, 0],
            [0, 0, 1],
            [1, 1, 1]
        ]
    },
    
    lwss: {
        name: "Lightweight Spaceship (LWSS)",
        description: "Period 4 spaceship that moves horizontally",
        category: "Spaceship",
        period: 4,
        velocity: "1/2 horizontal",
        pattern: [
            [1,0,0,1,0],
            [0,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,1]
        ]
    },
    
    mwss: {
        name: "Middleweight Spaceship (MWSS)",
        description: "Period 4 spaceship - medium sized horizontal traveler",
        category: "Spaceship", 
        period: 4,
        velocity: "1/2 horizontal",
        pattern: [
            [0,0,0,1,0,0],
            [1,0,0,0,0,1],
            [0,0,0,0,0,1],
            [1,0,0,0,1,0],
            [0,1,1,1,1,1]
        ]
    },
    
    hwss: {
        name: "Heavyweight Spaceship (HWSS)",
        description: "Period 4 spaceship - largest of the basic spaceships",
        category: "Spaceship",
        period: 4,
        velocity: "1/2 horizontal", 
        pattern: [
            [0,0,0,1,1,0,0],
            [1,0,0,0,0,0,1],
            [0,0,0,0,0,0,1],
            [1,0,0,0,0,1,0],
            [0,1,1,1,1,1,1]
        ]
    },
    
    // ===== METHUSELAHS (Long-lived patterns that eventually stabilize) =====
    
    rpentomino: {
        name: "R-Pentomino",
        description: "Famous methuselah - stabilizes after 1103 generations into various patterns",
        category: "Methuselah",
        stabilization: 1103,
        pattern: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 1, 0]
        ]
    },
    
    diehard: {
        name: "Die Hard",
        description: "Methuselah that completely disappears after 130 generations",
        category: "Methuselah",
        lifespan: 130,
        pattern: [
            [0,0,0,0,0,0,1,0],
            [1,1,0,0,0,0,0,0],
            [0,1,0,0,0,1,1,1]
        ]
    },
    
    acorn: {
        name: "Acorn",
        description: "Small methuselah that grows into a complex pattern over 5206 generations",
        category: "Methuselah",
        stabilization: 5206,
        pattern: [
            [0,1,0,0,0,0,0],
            [0,0,0,1,0,0,0],
            [1,1,0,0,1,1,1]
        ]
    },
    
    // ===== GUNS (Pattern generators) =====
    
    glidergun: {
        name: "Gosper Glider Gun",
        description: "Period 30 gun - continuously produces gliders",
        category: "Gun",
        period: 30,
        pattern: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    },
    
    // ===== INTERESTING PATTERNS =====
    
    pi: {
        name: "Pi Heptomino",
        description: "Evolves into multiple patterns including blinkers",
        category: "Other",
        pattern: [
            [1,1,1],
            [1,0,1],
            [1,0,1]
        ]
    },
    
    galaxy: {
        name: "Kok's Galaxy",
        description: "Period 8 oscillator with interesting rotational symmetry",
        category: "Oscillator",
        period: 8,
        pattern: [
            [1,1,0,1,1,1,1,1,1],
            [1,1,0,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0],
            [1,1,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,0,1,1],
            [1,1,1,1,1,1,0,1,1]
        ]
    },
    
    copperhead: {
        name: "Copperhead",
        description: "Period 12 spaceship discovered in 2016",
        category: "Spaceship",
        period: 12,
        velocity: "1/12 diagonal",
        pattern: [
            [1,1,0,0,1,1,0,0,1,1],
            [1,0,1,0,0,0,0,1,0,1],
            [0,0,1,0,0,0,0,1,0,0],
            [0,0,0,1,0,0,1,0,0,0],
            [0,0,0,0,1,1,0,0,0,0]
        ]
    },
    
    weekender: {
        name: "Weekender",
        description: "Large period 2 oscillator",
        category: "Oscillator",
        period: 2,
        pattern: [
            [0,0,1,1,0,0,0,0,1,1,0,0],
            [0,1,0,0,1,0,0,1,0,0,1,0],
            [1,0,0,0,0,1,1,0,0,0,0,1],
            [1,0,0,1,1,0,0,1,1,0,0,1],
            [0,1,0,1,0,0,0,0,1,0,1,0],
            [0,0,1,0,0,0,0,0,0,1,0,0],
            [0,0,1,0,0,0,0,0,0,1,0,0],
            [0,1,0,1,0,0,0,0,1,0,1,0],
            [1,0,0,1,1,0,0,1,1,0,0,1],
            [1,0,0,0,0,1,1,0,0,0,0,1],
            [0,1,0,0,1,0,0,1,0,0,1,0],
            [0,0,1,1,0,0,0,0,1,1,0,0]
        ]
    },
    
    // ===== SMALL PATTERNS FOR TESTING =====
    
    traffic_light: {
        name: "Traffic Light",
        description: "Period 2 oscillator that looks like traffic lights",
        category: "Oscillator",
        period: 2,
        pattern: [
            [0,1,1,0],
            [0,1,1,0],
            [0,0,0,0],
            [1,1,0,0],
            [1,1,0,0],
            [0,0,0,0],
            [0,0,1,1],
            [0,0,1,1]
        ]
    },
    
    figure_eight: {
        name: "Figure Eight",
        description: "Period 8 oscillator with interesting evolution",
        category: "Oscillator", 
        period: 8,
        pattern: [
            [1,1,1,0,0,0],
            [1,1,1,0,0,0],
            [0,0,0,1,1,1],
            [0,0,0,1,1,1]
        ]
    }
};

// Export pattern categories for UI organization
GameOfLifePatterns.categories = {
    "Still Life": "Static patterns that never change",
    "Oscillator": "Patterns that repeat in cycles", 
    "Spaceship": "Patterns that move across the grid",
    "Methuselah": "Long-lived patterns that eventually stabilize",
    "Gun": "Patterns that continuously generate other patterns",
    "Other": "Interesting patterns that don't fit other categories"
};

// Helper functions
GameOfLifePatterns.getByCategory = function(category) {
    const patterns = {};
    for (const [key, pattern] of Object.entries(this)) {
        if (typeof pattern === 'object' && pattern.category === category) {
            patterns[key] = pattern;
        }
    }
    return patterns;
};

GameOfLifePatterns.getPatternNames = function() {
    return Object.keys(this).filter(key => 
        typeof this[key] === 'object' && 
        this[key].pattern && 
        key !== 'categories'
    );
};

GameOfLifePatterns.getPattern = function(name) {
    return this[name]?.pattern || null;
};

GameOfLifePatterns.getPatternInfo = function(name) {
    const pattern = this[name];
    if (!pattern || !pattern.pattern) return null;
    
    return {
        name: pattern.name,
        description: pattern.description,
        category: pattern.category,
        period: pattern.period,
        velocity: pattern.velocity,
        stabilization: pattern.stabilization,
        lifespan: pattern.lifespan,
        pattern: pattern.pattern
    };
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.GameOfLifePatterns = GameOfLifePatterns;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameOfLifePatterns;
}
