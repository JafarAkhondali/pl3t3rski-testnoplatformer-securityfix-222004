import { Transform } from '../engine/core.js';
import { vec3 } from '../../lib/gl-matrix-module.js';

export class SkyBox {

    constructor(node, camera) {
        this.node = node;
        this.camera = camera;
    }

    update(time, dt) {
        const cameraTransform = this.camera.getComponentOfType(Transform);
        const skyboxTransform = this.node.getComponentOfType(Transform);
        
        skyboxTransform.translation = vec3.clone(cameraTransform.translation);
    }
}