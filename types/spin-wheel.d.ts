declare module 'spin-wheel' {
  export type WheelItemProps = {
    label?: string;
    backgroundColor?: string | null;
    value?: string | number | null;
    weight?: number;
    image?: HTMLImageElement | null;
  };

  export type WheelProps = {
    items?: WheelItemProps[];
    isInteractive?: boolean;
    pointerAngle?: number;
    borderColor?: string;
    image?: HTMLImageElement | null;
    overlayImage?: HTMLImageElement | null;
    itemBackgroundColors?: string[];
    itemLabelColors?: string[];
    itemLabelFont?: string;
    borderWidth?: number;
    lineWidth?: number;
    onCurrentIndexChange?: ((event: { currentIndex: number }) => void) | null;
    onRest?: ((event: { currentIndex: number; rotation: number }) => void) | null;
    onSpin?: ((event: Record<string, unknown>) => void) | null;
  };

  export class Wheel {
    image: HTMLImageElement | null;
    isInteractive: boolean;
    constructor(container: Element, props?: WheelProps | null);
    init(props?: WheelProps | null): void;
    remove(): void;
    spinToItem(
      itemIndex?: number,
      duration?: number,
      spinToCenter?: boolean,
      numberOfRevolutions?: number,
      direction?: number,
      easingFunction?: ((n: number) => number) | null,
    ): void;
    stop(): void;
    getCurrentIndex(): number;
  }
}
