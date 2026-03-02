declare module 'roughjs/bundled/rough.esm.js' {
  interface Options {
    roughness?: number;
    bowing?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillStyle?: string;
    fillWeight?: number;
    hachureAngle?: number;
    hachureGap?: number;
    seed?: number;
  }

  interface RoughSVG {
    rectangle(x: number, y: number, width: number, height: number, options?: Options): SVGGElement;
    circle(x: number, y: number, diameter: number, options?: Options): SVGGElement;
    ellipse(x: number, y: number, width: number, height: number, options?: Options): SVGGElement;
    line(x1: number, y1: number, x2: number, y2: number, options?: Options): SVGGElement;
    polygon(points: [number, number][], options?: Options): SVGGElement;
    path(d: string, options?: Options): SVGGElement;
  }

  interface RoughStatic {
    svg(svg: SVGSVGElement): RoughSVG;
  }

  const rough: RoughStatic;
  export default rough;
}
