import {Node, Transform} from '../engine/core.js';
import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { LunaController } from './LunaController.js';
import { transformMesh } from '../engine/core/MeshUtils.js';



export class Jetpack {

    constructor(node, fuel){

        this.fuel = fuel;
        
        this.node = node;

        this.transform = node.getComponentOfType(Transform);

        this.initial_y = this.transform.translation[1];
        
    }


    update(time, dt){
        this.transform.translation[1] = this.initial_y + Math.sin(time);
        quat.rotateY(this.transform.rotation, this.transform.rotation, dt);

    }
}