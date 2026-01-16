declare module 'curtainsjs' {
  export class Curtains {
    constructor(options: {
      container: string;
      watchScroll?: boolean;
      pixelRatio?: number;
      premultipliedAlpha?: boolean;
      alpha?: boolean;
      transparent?: boolean;
    });

    gl: WebGLRenderingContext;

    onError(callback: () => void): this;
    onContextLost(callback: () => void): this;
    disableDrawing(): void;
    enableDrawing(): void;
    restoreContext(): void;
    dispose(): void;
  }

  export class Plane {
    constructor(curtains: Curtains, element: Element, params: {
      vertexShader: string;
      fragmentShader: string;
      uniforms: Record<string, any>;
      widthSegments?: number;
      heightSegments?: number;
    });

    textures: any[];
    images: any[];
    uniforms: Record<string, { value: any }>;

    onLoading(callback: (texture: any) => void): this;
    onReady(callback: () => void): this;
    onRender(callback: () => void): this;

    createTexture(options: {
      sampler: string;
      fromTexture: any;
    }): any;
  }
}
