/**
 * Color Utilities
 * Helper functions for color manipulation and gradients
 */

export class ColorUtils {
    
    static hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16)
        };
    }
    
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    static hexToRgba(hex, alpha = 1) {
        const rgb = this.hexToRgb(hex);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
    
    static interpolateColor(startColor, endColor, factor) {
        // Ensure factor is between 0 and 1
        factor = Math.max(0, Math.min(1, factor));
        
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * factor);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * factor);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    static getColorName(hexColor) {
        // Convert hex to a readable color name
        const colorNames = {
            '#000000': 'Black',
            '#ffffff': 'White',
            '#ff0000': 'Red',
            '#00ff00': 'Green',
            '#0000ff': 'Blue',
            '#ffff00': 'Yellow',
            '#ff00ff': 'Magenta',
            '#00ffff': 'Cyan',
            '#800080': 'Purple',
            '#ffa500': 'Orange',
            '#a52a2a': 'Brown',
            '#808080': 'Gray',
            '#4c1d95': 'Deep Violet',
            '#7c3aed': 'Violet',
            '#8b5cf6': 'Light Violet',
            '#c084fc': 'Pale Violet'
        };
        
        return colorNames[hexColor.toLowerCase()] || 'Custom Color';
    }
    
    static generateGradient(startColor, endColor, steps) {
        const gradient = [];
        const start = this.hexToRgb(startColor);
        const end = this.hexToRgb(endColor);
        
        for (let i = 0; i < steps; i++) {
            const factor = i / (steps - 1);
            const color = this.interpolateColor(start, end, factor);
            gradient.push(color);
        }
        
        return gradient;
    }
    
    static darken(color, amount = 0.1) {
        const rgb = typeof color === 'string' ? this.hexToRgb(color) : color;
        
        return {
            r: Math.max(0, Math.round(rgb.r * (1 - amount))),
            g: Math.max(0, Math.round(rgb.g * (1 - amount))),
            b: Math.max(0, Math.round(rgb.b * (1 - amount)))
        };
    }
    
    static lighten(color, amount = 0.1) {
        const rgb = typeof color === 'string' ? this.hexToRgb(color) : color;
        
        return {
            r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount)),
            g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount)),
            b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount))
        };
    }
}
