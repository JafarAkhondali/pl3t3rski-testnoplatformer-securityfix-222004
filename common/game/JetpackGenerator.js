import { Node, Transform, Model, Primitive } from '../engine/core.js';
import { quat, vec3 } from '../../../lib/gl-matrix-module.js';
import { Jetpack } from './Jetpack.js';
import { Luna } from './Luna.js';
import { LunaController } from './LunaController.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from '../engine/core/MeshUtils.js';


export class JetpackGenerator {

    constructor(node, player, meshes, materials) {
        this.node = node;
        this.player = player;
        this.meshes = meshes;
        this.materials = materials;

    }

    update(time, dt) {

        {
            let player_position = this.player.getComponentOfType(Transform).translation;

            let deletion = [];
            for (let i = 0; i < this.node.children.length; i++){
                let jetpack_position = this.node.children[i].getComponentOfType(Transform).translation;

                let distance = vec3.distance(player_position, jetpack_position);

                if (distance < 7){
                    deletion.push(i);
                }
            }

            deletion.reverse().forEach((i) => {
                this.player.getComponentOfType(LunaController).fuel += this.node.children[i].getComponentOfType(Jetpack).fuel;
                this.node.children.splice(i, 1);
            });
        }

        {
            let player_position = this.player.getComponentOfType(Transform).translation[1];

            let deletion = [];
            for (let i = 0; i < this.node.children.length; i++){
                let jetpack_position = this.node.children[i].getComponentOfType(Transform).translation[1];

                let distance = player_position - jetpack_position;

                if (distance > 200){
                    deletion.push(i);
                }
            }

            deletion.reverse().forEach((i) => {
                this.node.children.splice(i, 1);
            });
        }

    }

    createJetpack(translation, fuel, offset, material_index=0){

        let material = this.materials[material_index];
        let mesh = this.meshes[0];

        const jetpack = new Node();

        let pos = [0, 0, 0]
        vec3.add(pos, translation, [0, offset, 0]);

        jetpack.addComponent(new Transform({ translation: pos, scale: [2, 2, 2]}));


        let jetpack_ptimitive = [new Primitive({ mesh: mesh, material: material })];
        jetpack.addComponent(new Model({ primitives: jetpack_ptimitive }));
        jetpack.isStatic = true;
        jetpack.isDynamic = false;

        jetpack.aabb = {
            min: [-2, -1, -2],
            max: [ 2,  1,  2],
        };

        const model = jetpack.getComponentOfType(Model);
        const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
        jetpack.aabb = mergeAxisAlignedBoundingBoxes(boxes);



        jetpack.addComponent(new Jetpack(jetpack, fuel));
        
        this.node.addChild(jetpack);
    }

}