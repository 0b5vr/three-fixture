const e=`declare module 'three/examples/jsm/geometries/ParametricGeometry' {
import { Vector3, BufferGeometry } from 'three/src/Three';

export class ParametricGeometry extends BufferGeometry {
    constructor(func?: (u: number, v: number, target: Vector3) => void, slices?: number, stacks?: number);

    /**
     * @default 'ParametricGeometry'
     */
    type: string;

    parameters: {
        func: (u: number, v: number, dest: Vector3) => void;
        slices: number;
        stacks: number;
    };
}

export { ParametricGeometry as ParametricBufferGeometry };

}`;export{e as default};