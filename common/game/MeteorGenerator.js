import { Node, Transform, Model } from '../engine/core.js';
import { Meteor } from './Meteor.js';
import { vec3 } from '../../../lib/gl-matrix-module.js';
import { Island } from './Island.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from '../engine/core/MeshUtils.js';
import { IslandGenerator } from './IslandGenerator.js';

export class MeteorGenerator {

    constructor(node, player, islandGenerator, primitives) {
        this.node = node;
        this.player = player;
        this.primitives = primitives;
        this.generateTimer = 0;
        this.generateInterval = 10;
        this.islandGenerator = islandGenerator;
        this.targetIslandPosition = null;
        this.targetIsland = null;
        this.lightMaterial = islandGenerator.components[0].materials[3];
        this.materialDuration = 0;
        
    }

    update(time, dt) {
        this.generateTimer += dt;
        if(this.targetIsland) {
            this.materialDuration += dt;
            if(this.materialDuration >= 2) {
                this.targetIsland.getComponentOfType(Model).primitives[0].material = this.islandGenerator.components[0].materials[0];
                this.materialDuration = 0;
                this.targetIsland = null;
            }
        }
        if (this.generateTimer >= this.generateInterval) {
            this.pickTarget(50);
            // change material of target island
            if(this.targetIslandPosition) {
                let translation = this.spawnPosition();
                console.log("Meteor spawn position: " + translation);
                this.addMeteor(translation, 5);
            }
            this.generateTimer = 0;
            this.generateInterval = Math.round(Math.random() * (15 - 12) + 12);
        }
    }

    addMeteor(translation, scale) {

        const meteor = new Node();
        meteor.addComponent(new Transform({ translation: translation, scale: [1.5 * scale, 1.5 * scale, 1.5 * scale]}));
        meteor.addComponent(new Model({ primitives: this.primitives }));
        meteor.isStatic = false;
        meteor.isDynamic = true;

        meteor.addComponent(new Meteor(meteor, this.targetIslandPosition)); 
        meteor.aabb = {
            min: [-3 * scale, -1 * scale, -3 * scale],
            max: [ 3 * scale,  1 * scale,  3 * scale],
        };
        const model = meteor.getComponentOfType(Model);
        const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
        meteor.aabb = mergeAxisAlignedBoundingBoxes(boxes);
        

        this.node.addChild(meteor);
    }

    spawnPosition() {
    
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 20;
        const randomOffset = vec3.fromValues(
            Math.random() * radius * 2,
            Math.abs(radius * Math.cos(phi)) + 75,
            Math.random() * radius * 2
        );
        
        const meteorPosition = vec3.create();
        vec3.add(meteorPosition, this.targetIslandPosition, randomOffset);
        console.log("Meteor: " + meteorPosition);
        return meteorPosition;
    }
    

    pickTarget(nearThreshold) {
        const islands = this.islandGenerator.getComponentOfType(IslandGenerator).node.children;
        const playerPosition = this.player.getComponentOfType(Transform).translation;

        const islandsNear = islands.filter(island => {
            const distance = vec3.distance(playerPosition, island.getComponentOfType(Transform).translation);
            return distance <= nearThreshold;
        });
        islandsNear.sort((a, b) => {
            const aY = a.getComponentOfType(Transform).translation[1];
            const bY = b.getComponentOfType(Transform).translation[1];
            return aY - bY;
        });
        if (islandsNear.length > 2) {
            const targetIndex = Math.floor(Math.random() * (islandsNear.length - 2)) + 2;
            this.targetIslandPosition = islandsNear[targetIndex].getComponentOfType(Transform).translation;
            this.targetIsland = islandsNear[targetIndex];
            this.lightMaterial.diffuse = 50;
            islandsNear[targetIndex].getComponentOfType(Model).primitives[0].material = this.lightMaterial;
            // Update target island material here
        } else {
            this.targetIslandPosition = null;
            this.targetIsland = null;
            this.pickTarget(nearThreshold + 10);
        }   
    }
}  

