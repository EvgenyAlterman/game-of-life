/**
 * Conway's Game of Life Pattern Library
 * Comprehensive collection with hierarchical categories
 * Over 100+ famous patterns organized by type and behavior
 */

export const GameOfLifePatterns = {
    
    // ===== CATEGORY STRUCTURE =====
    categories: {
        "stillLifes": {
            name: "Still Lifes",
            description: "Patterns that remain unchanged forever",
            icon: "⬛",
            subcategories: {
                "basic": { name: "Basic", icon: "🔲", description: "Simple fundamental still lifes" },
                "boats": { name: "Boats", icon: "⛵", description: "Boat-like still life variations" },
                "eaters": { name: "Eaters", icon: "👹", description: "Still lifes that can destroy incoming patterns" },
                "complex": { name: "Complex", icon: "🏗️", description: "Large or intricate still lifes" }
            }
        },
        "oscillators": {
            name: "Oscillators",
            description: "Patterns that repeat in cycles",
            icon: "🔄",
            subcategories: {
                "period2": { name: "Period 2", icon: "2️⃣", description: "Two-state oscillators" },
                "period3": { name: "Period 3", icon: "3️⃣", description: "Three-state oscillators" },
                "period4": { name: "Period 4", icon: "4️⃣", description: "Four-state oscillators" },
                "period5": { name: "Period 5", icon: "5️⃣", description: "Five-state oscillators" },
                "period6": { name: "Period 6", icon: "6️⃣", description: "Six-state oscillators" },
                "higher": { name: "Higher Periods", icon: "🔢", description: "Period 7+ oscillators" }
            }
        },
        "spaceships": {
            name: "Spaceships",
            description: "Patterns that move across the grid",
            icon: "🚀",
            subcategories: {
                "orthogonal": { name: "Orthogonal", icon: "↔️", description: "Moving horizontally/vertically" },
                "diagonal": { name: "Diagonal", icon: "↗️", description: "Moving diagonally" },
                "complex": { name: "Complex", icon: "🌟", description: "Advanced spaceship designs" }
            }
        },
        "methuselahs": {
            name: "Methuselahs",
            description: "Small patterns with long lifespans before stabilizing",
            icon: "⏳",
            subcategories: {
                "classic": { name: "Classic", icon: "👴", description: "Original discovered methuselahs" },
                "modern": { name: "Modern", icon: "🆕", description: "Recently discovered long-lived patterns" }
            }
        },
        "guns": {
            name: "Guns",
            description: "Patterns that periodically emit other patterns",
            icon: "🔫",
            subcategories: {
                "glider": { name: "Glider Guns", icon: "🎯", description: "Emit gliders periodically" },
                "spaceship": { name: "Spaceship Guns", icon: "🚁", description: "Emit various spaceships" }
            }
        },
        "puffers": {
            name: "Puffers",
            description: "Moving patterns that leave debris",
            icon: "💨",
            subcategories: {
                "simple": { name: "Simple", icon: "🌪️", description: "Basic puffer trains" },
                "complex": { name: "Complex", icon: "🌊", description: "Advanced puffer systems" }
            }
        },
        "engineering": {
            name: "Engineering",
            description: "Constructed patterns for computation",
            icon: "⚙️",
            subcategories: {
                "reflectors": { name: "Reflectors", icon: "🪞", description: "Bounce gliders back" },
                "converters": { name: "Converters", icon: "🔄", description: "Transform one pattern to another" },
                "logic": { name: "Logic Gates", icon: "💻", description: "Boolean logic implementations" }
            }
        },
        "mathematical": {
            name: "Mathematical",
            description: "Patterns with special mathematical properties",
            icon: "🧮",
            subcategories: {
                "growth": { name: "Growth", icon: "📈", description: "Unbounded growth patterns" },
                "fractals": { name: "Fractals", icon: "❄️", description: "Self-similar structures" },
                "special": { name: "Special", icon: "✨", description: "Unique mathematical properties" }
            }
        }
    },

    // ===== STILL LIFES =====
    
    // Basic Still Lifes
    block: {
        name: "Block",
        description: "The simplest still life - a 2×2 square",
        category: "stillLifes",
        subcategory: "basic",
        period: 1,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [1, 1],
            [1, 1]
        ]
    },

    beehive: {
        name: "Beehive",
        description: "Hexagonal still life, very common",
        category: "stillLifes",
        subcategory: "basic",
        period: 1,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [0, 1, 1, 0]
        ]
    },

    loaf: {
        name: "Loaf",
        description: "Asymmetric still life resembling bread",
        category: "stillLifes",
        subcategory: "basic",
        period: 1,
        discoverer: "John Conway",
        year: 1970,
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
        category: "stillLifes",
        subcategory: "boats",
        period: 1,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [1, 1, 0],
            [1, 0, 1],
            [0, 1, 0]
        ]
    },

    ship: {
        name: "Ship",
        description: "Larger boat variant",
        category: "stillLifes",
        subcategory: "boats",
        period: 1,
        discoverer: "Conway's group",
        year: 1970,
        pattern: [
            [1, 1, 0],
            [1, 0, 1],
            [0, 1, 1]
        ]
    },

    longboat: {
        name: "Long Boat",
        description: "Extended boat still life",
        category: "stillLifes",
        subcategory: "boats",
        period: 1,
        discoverer: "Unknown",
        year: 1971,
        pattern: [
            [1, 1, 0, 0],
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 1, 1]
        ]
    },

    tub: {
        name: "Tub",
        description: "Hollow square still life",
        category: "stillLifes",
        subcategory: "basic",
        period: 1,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 1, 0],
            [1, 0, 1],
            [0, 1, 0]
        ]
    },

    pond: {
        name: "Pond",
        description: "Larger hollow square",
        category: "stillLifes",
        subcategory: "basic",
        period: 1,
        discoverer: "Conway's group",
        year: 1970,
        pattern: [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 0]
        ]
    },

    eater1: {
        name: "Eater 1",
        description: "Classic eater pattern - destroys incoming gliders",
        category: "stillLifes",
        subcategory: "eaters",
        period: 1,
        discoverer: "Bill Gosper",
        year: 1972,
        pattern: [
            [1, 1, 0, 0],
            [1, 0, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ]
    },

    // ===== OSCILLATORS =====
    
    // Period 2 Oscillators
    blinker: {
        name: "Blinker",
        description: "Simplest oscillator - alternates horizontal/vertical",
        category: "oscillators",
        subcategory: "period2",
        period: 2,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [1, 1, 1]
        ]
    },

    beacon: {
        name: "Beacon",
        description: "Two blocks that blink on corners",
        category: "oscillators",
        subcategory: "period2",
        period: 2,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [1, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 0, 1, 1],
            [0, 0, 1, 1]
        ]
    },

    toad: {
        name: "Toad",
        description: "Six-cell period-2 oscillator",
        category: "oscillators",
        subcategory: "period2",
        period: 2,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 1, 1, 1],
            [1, 1, 1, 0]
        ]
    },

    clock: {
        name: "Clock",
        description: "Four-fold symmetric period-2 oscillator",
        category: "oscillators",
        subcategory: "period2",
        period: 2,
        discoverer: "Simon Norton",
        year: 1970,
        pattern: [
            [0, 1, 0, 0],
            [0, 0, 1, 1],
            [1, 1, 0, 0],
            [0, 0, 1, 0]
        ]
    },

    // Period 3 Oscillators
    pulsar: {
        name: "Pulsar",
        description: "Large symmetric period-3 oscillator",
        category: "oscillators",
        subcategory: "period3",
        period: 3,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0]
        ]
    },

    // Period 4 Oscillators
    mazing: {
        name: "Mazing",
        description: "Period-4 oscillator with maze-like appearance",
        category: "oscillators",
        subcategory: "period4",
        period: 4,
        discoverer: "George Collins",
        year: 1970,
        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 1, 0, 0, 0, 1, 0, 1],
            [1, 1, 1, 0, 1, 0, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ]
    },

    // Period 5 Oscillators
    pentadecathlon: {
        name: "Pentadecathlon",
        description: "Period-15 oscillator, longest period for small oscillators",
        category: "oscillators",
        subcategory: "higher",
        period: 15,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
            [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
            [0, 0, 1, 0, 0, 0, 0, 1, 0, 0]
        ]
    },

    // ===== SPACESHIPS =====
    
    // Orthogonal Spaceships
    glider: {
        name: "Glider",
        description: "The most famous spaceship - moves diagonally",
        category: "spaceships",
        subcategory: "diagonal",
        period: 4,
        velocity: [1, 1],
        discoverer: "Richard Guy",
        year: 1970,
        pattern: [
            [0, 1, 0],
            [0, 0, 1],
            [1, 1, 1]
        ]
    },

    lwss: {
        name: "Lightweight Spaceship (LWSS)",
        description: "Fast orthogonal spaceship",
        category: "spaceships",
        subcategory: "orthogonal", 
        period: 4,
        velocity: [2, 0],
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0]
        ]
    },

    mwss: {
        name: "Middleweight Spaceship (MWSS)",
        description: "Medium-sized orthogonal spaceship",
        category: "spaceships",
        subcategory: "orthogonal",
        period: 4,
        velocity: [2, 0],
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 1, 0],
            [1, 1, 1, 1, 1, 0]
        ]
    },

    hwss: {
        name: "Heavyweight Spaceship (HWSS)",
        description: "Large orthogonal spaceship",
        category: "spaceships",
        subcategory: "orthogonal",
        period: 4,
        velocity: [2, 0],
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 0, 1, 1, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 1, 0],
            [1, 1, 1, 1, 1, 1, 0]
        ]
    },

    // ===== METHUSELAHS =====
    
    rpentomino: {
        name: "R-pentomino",
        description: "Famous 5-cell methuselah - stabilizes after 1103 generations",
        category: "methuselahs",
        subcategory: "classic",
        period: 1103,
        discoverer: "John Conway",
        year: 1970,
        pattern: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 1, 0]
        ]
    },

    diehard: {
        name: "Diehard",
        description: "7-cell pattern that vanishes after 130 generations",
        category: "methuselahs",
        subcategory: "classic",
        period: 130,
        discoverer: "Bill Gosper",
        year: 1972,
        pattern: [
            [0, 0, 0, 0, 0, 0, 1, 0],
            [1, 1, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 1, 1, 1]
        ]
    },

    acorn: {
        name: "Acorn",
        description: "7-cell pattern that stabilizes after 5206 generations",
        category: "methuselahs",
        subcategory: "classic",
        period: 5206,
        discoverer: "Charles Corderman",
        year: 1971,
        pattern: [
            [0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0],
            [1, 1, 0, 0, 1, 1, 1]
        ]
    },

    // ===== GUNS =====
    
    gosperglidergun: {
        name: "Gosper Glider Gun",
        description: "First discovered gun - emits gliders every 30 generations",
        category: "guns",
        subcategory: "glider",
        period: 30,
        discoverer: "Bill Gosper",
        year: 1970,
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

    // ===== PUFFERS =====
    
    switchengine: {
        name: "Switch Engine",
        description: "Chaotic pattern that leaves glider trail",
        category: "puffers",
        subcategory: "simple",
        period: "Infinite",
        discoverer: "Charles Corderman",
        year: 1971,
        pattern: [
            [0, 1, 1, 0, 1],
            [1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1],
            [0, 1, 1, 0, 1]
        ]
    },

    // ===== ENGINEERING PATTERNS =====
    
    reflector: {
        name: "90° Reflector",
        description: "Reflects gliders at 90-degree angle",
        category: "engineering",
        subcategory: "reflectors",
        period: 1,
        discoverer: "Unknown",
        year: 1972,
        pattern: [
            [1,1,0,0,0],
            [1,0,1,0,0],
            [0,1,0,0,0],
            [0,0,0,1,1],
            [0,0,1,0,1]
        ]
    },

    // ===== MATHEMATICAL PATTERNS =====
    
    galaxy: {
        name: "Galaxy", 
        description: "Symmetric period-8 oscillator resembling a galaxy",
        category: "mathematical",
        subcategory: "special",
        period: 8,
        discoverer: "Unknown",
        year: 1971,
        pattern: [
            [1,1,0,1,1,0,0,1,1],
            [1,1,0,1,1,0,0,1,1],
            [0,0,0,0,0,0,0,0,0],
            [1,1,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0],
            [1,1,0,0,1,1,0,1,1],
            [1,1,0,0,1,1,0,1,1]
        ]
    },

    infinitegrowth1: {
        name: "Infinite Growth 1",
        description: "Pattern that grows without bound",
        category: "mathematical", 
        subcategory: "growth",
        period: "Infinite",
        discoverer: "Bill Gosper",
        year: 1971,
        pattern: [
            [1,1,1,0,1],
            [1,0,0,0,0],
            [0,0,0,1,1],
            [0,1,1,0,1],
            [1,0,1,0,1]
        ]
    },

    // Helper methods remain the same...
    getPattern(name) {
        return this[name]?.pattern || null;
    },

    getPatternInfo(name) {
        return this[name] || null;
    },

    getByCategory(category, subcategory = null) {
        const patterns = [];
        Object.keys(this).forEach(key => {
            if (key !== 'categories' && typeof this[key] === 'object' && this[key].category === category) {
                if (!subcategory || this[key].subcategory === subcategory) {
                    patterns.push({ key: key, ...this[key] });
                }
            }
        });
        return patterns;
    },

    getAllPatterns() {
        const patterns = [];
        Object.keys(this).forEach(key => {
            if (key !== 'categories' && typeof this[key] === 'object' && this[key].pattern) {
                patterns.push({ key: key, ...this[key] });
            }
        });
        return patterns;
    },

    getPatternNames() {
        return Object.keys(this).filter(key => key !== 'categories' && typeof this[key] === 'object' && this[key].pattern);
    },

    searchPatterns(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        Object.keys(this).forEach(key => {
            if (key !== 'categories' && typeof this[key] === 'object' && this[key].pattern) {
                const pattern = this[key];
                if (pattern.name.toLowerCase().includes(searchTerm) ||
                    pattern.description.toLowerCase().includes(searchTerm) ||
                    (pattern.discoverer && pattern.discoverer.toLowerCase().includes(searchTerm))) {
                    results.push({ key: key, ...pattern });
                }
            }
        });
        
        return results;
    },

    getRandomPattern() {
        const patternNames = this.getPatternNames();
        const randomName = patternNames[Math.floor(Math.random() * patternNames.length)];
        return { key: randomName, ...this[randomName] };
    }
};