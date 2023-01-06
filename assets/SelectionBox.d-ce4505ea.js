const e=`declare module 'three/examples/jsm/interactive/SelectionBox' {
import { Camera, Frustum, Mesh, Object3D, Scene, Vector3 } from 'three/src/Three';

export class SelectionBox {
    constructor(camera: Camera, scene: Scene, deep?: number);
    camera: Camera;
    collection: Mesh[];
    deep: number;
    endPoint: Vector3;
    scene: Scene;
    startPoint: Vector3;

    select(startPoint?: Vector3, endPoint?: Vector3): Mesh[];
    updateFrustum(startPoint: Vector3, endPoint: Vector3): void;
    searchChildInFrustum(frustum: Frustum, object: Object3D): void;
}

}`;export{e as default};