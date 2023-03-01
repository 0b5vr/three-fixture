const n=`declare module 'three/src/core/Layers' {
export class Layers {
    constructor();

    /**
     * @default 1 | 0
     */
    mask: number;

    set(channel: number): void;
    enable(channel: number): void;
    enableAll(): void;
    toggle(channel: number): void;
    disable(channel: number): void;
    disableAll(): void;
    test(layers: Layers): boolean;
    isEnabled(channel: number): boolean;
}

}`;export{n as default};