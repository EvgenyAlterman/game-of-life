// Global type declarations
declare global {
  interface Window {
    lucide: {
      createIcons(): void;
    };
    game: any; // GameOfLifeStudio instance will be attached here
  }
  
  var lucide: {
    createIcons(): void;
  };
  
  var game: any;
}

// Extend Element interface for dataset support
declare global {
  interface Element {
    dataset: DOMStringMap;
  }
  
  interface EventTarget {
    value?: string;
    checked?: boolean;
    dataset?: DOMStringMap;
    closest?: (selector: string) => Element | null;
  }
}

export {};
