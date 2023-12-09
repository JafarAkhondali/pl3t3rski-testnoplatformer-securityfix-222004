import { mat3, mat4, vec3 } from '../../../lib/gl-matrix-module.js';

import * as WebGPU from '../WebGPU.js';

import { createVertexBuffer } from '../../../common/engine/core/VertexUtils.js';

import { Camera, Transform } from '../core.js';

import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getGlobalModelMatrix,
    getProjectionMatrix,
    getModels,
} from '../core/SceneUtils.js';

export class Renderer {

    constructor(canvas) {
        this.canvas = canvas;
        this.gpuObjects = new Map();
    }

    async createShaderModule(path){
        let code = await fetch(path).then(response => response.text());
        let module = this.device.createShaderModule({ code });
    
        return module;
    }

    async createVertexLayout(names, formats, loc_init = 0){

        let location_offset = loc_init;
        let byte_offset = 0;

        let attributes = [];
        for (let i = 0; i < names.length; i++){
            let a = {name: names[i], shaderLocation: location_offset, offset: byte_offset, format: formats[i]};
            attributes.push(a);
            
            location_offset += 1;
            byte_offset += parseInt(formats[i].split("x")[1]) * 4;
        }

        let arrayStride = byte_offset + 4; // !!!

        return {attributes: attributes, arrayStride: arrayStride};
    }

    async createRenderPipeline(module, layout){

        let pipeline = await this.device.createRenderPipelineAsync({
            layout: 'auto',
            vertex: {
                module,
                entryPoint: 'vertex',
                buffers: [ layout ],
            },
            fragment: {
                module,
                entryPoint: 'fragment',
                targets: [{ format: this.format }],
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
        });

        return pipeline;
    }


    async getPipeline(layout_information, shader_information){

        let layout = await this.createVertexLayout(layout_information[0], layout_information[1]);
        let shader = await this.createShaderModule(shader_information);
        let pipeline = await this.createRenderPipeline(shader, layout);

        let complete_pipeline = {
            layout: layout,
            shader: shader,
            pipeline: pipeline,
        };

        return complete_pipeline;

    }

    setupPipeline(elements){
        this.shader = elements.shader;
        this.layout = elements.layout;
        this.pipeline = elements.pipeline;
    }

    async initialize() {
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const context = this.canvas.getContext('webgpu');
        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format });

        this.device = device;
        this.context = context;
        this.format = format;
    }

    mat3tomat4(matrix) {
        return mat4.fromValues(
            matrix[0], matrix[1], matrix[2], 0,
            matrix[3], matrix[4], matrix[5], 0,
            matrix[6], matrix[7], matrix[8], 0,
            0, 0, 0, 1,
        );
    }

    prepareImage(image) {
        if (this.gpuObjects.has(image)) {
            return this.gpuObjects.get(image);
        }

        const gpuTexture = WebGPU.createTexture(this.device, { source: image });

        const gpuObjects = { gpuTexture };
        this.gpuObjects.set(image, gpuObjects);
        return gpuObjects;
    }

    prepareSampler(sampler) {
        if (this.gpuObjects.has(sampler)) {
            return this.gpuObjects.get(sampler);
        }

        const gpuSampler = this.device.createSampler(sampler);

        const gpuObjects = { gpuSampler };
        this.gpuObjects.set(sampler, gpuObjects);
        return gpuObjects;
    }

    prepareMesh(mesh, layout) {

        const vertexBufferArrayBuffer = createVertexBuffer(mesh.vertices, layout);
        const vertexBuffer = WebGPU.createBuffer(this.device, {
            data: vertexBufferArrayBuffer,
            usage: GPUBufferUsage.VERTEX,
        });

        const indexBufferArrayBuffer = new Uint32Array(mesh.indices).buffer;
        const indexBuffer = WebGPU.createBuffer(this.device, {
            data: indexBufferArrayBuffer,
            usage: GPUBufferUsage.INDEX,
        });

        const gpuObjects = { vertexBuffer, indexBuffer };
        return gpuObjects;
    }

    recreateDepthTexture() {
        this.depthTexture?.destroy();
        this.depthTexture = this.device.createTexture({
            format: 'depth24plus',
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    prepareNode(node) {
        if (this.gpuObjects.has(node)) {
            return this.gpuObjects.get(node);
        }

        const modelUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const modelBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: modelUniformBuffer } },
            ],
        });

        const gpuObjects = { modelUniformBuffer, modelBindGroup };
        this.gpuObjects.set(node, gpuObjects);
        return gpuObjects;
    }

    prepareUniform(sizes, values, group, resources=[]){

        let sum = 0;
        for (const e of sizes){
            sum += e;
        }

        const uniformBuffer = this.device.createBuffer({
            size: sum,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        let bindings = [{binding: 0, resource: {buffer: uniformBuffer}}];
        for (let i = 0; i < resources.length; i++){
                bindings.push({binding: i+1, resource: resources[i]});
        }
        
        

        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(group),
            entries: bindings,
        });

        let suma = 0
        for (let i = 0; i < sizes.length; i++){
            this.device.queue.writeBuffer(uniformBuffer, suma, values[i])
            suma += sizes[i];
        }

        this.renderPass.setBindGroup(group, bindGroup);
    }

    setupLights(lights){
                let count = lights.length;

                let sizes = [16];
                let values = [new Int32Array([count])];

                for (let i = 0; i < count; i++){
                    for (let o = 0; o < 3; o++){
                        sizes.push(16);
                        values.push(lights[i][o]);
                    }

                }

                this.prepareUniform(
                    sizes,
                    values,
                    3
                );


    }

    render_begin() {
        if (this.depthTexture?.width !== this.canvas.width || this.depthTexture?.height !== this.canvas.height) {
            this.recreateDepthTexture();
        }


        this.encoder = this.device.createCommandEncoder();
        this.renderPass = this.encoder.beginRenderPass({
            
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'discard',
            },
        });

    }

    render_setup(camera){
        this.renderPass.setPipeline(this.pipeline);

        if (camera == null){
            return;
        }

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        const cameraPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera));

        this.setupLights(this.lights);

        this.prepareUniform(
            [64, 64, 64],
            [viewMatrix, projectionMatrix, cameraPosition],//, new Float32Array([performance.now() / 1000])],
            0
        );
    }

    render(scene){
        this.renderNode(scene);
    }

    render_end(){
        this.renderPass.end();
        this.device.queue.submit([this.encoder.finish()]);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.multiply(mat4.create(), modelMatrix, localMatrix);
        const normalMatrix = this.mat3tomat4(mat3.normalFromMat4(mat3.create(), modelMatrix));

        this.prepareUniform([64, 64], [modelMatrix, normalMatrix], 1);

        for (const model of getModels(node)) {
            this.renderModel(model);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderModel(model) {
        for (const primitive of model.primitives) {
            this.renderPrimitive(primitive);
        }
    }


    prepareTexture(source){
        let baseTexture = null;
        if (Array.isArray(source)){
            baseTexture = this.prepareImage(source).gpuTexture.createView({ dimension: 'cube' });
        }
        else{
            baseTexture = this.prepareImage(source).gpuTexture.createView();
        }
        return baseTexture;
    }

    renderPrimitive(primitive) {

        let material = primitive.material;

        let baseTexture = this.prepareTexture(material.baseTexture.image);
        
        const baseSampler = this.prepareSampler(material.baseTexture.sampler).gpuSampler;
        //const normalTexture = this.prepareImage(material.normalTexture.image).gpuTexture.createView();
        //const normalSampler = this.prepareSampler(material.normalTexture.sampler).gpuSampler;
        
        if (material.non_material_element == false){
            this.prepareUniform(
                [32],
                [new Float32Array([...material.baseFactor, material.diffuse, material.specular, material.shininess/*, material.normalFactor*/])],
                2,
                [baseTexture, baseSampler/*, normalTexture, normalSampler*/]
            );
        }
        else{
            this.prepareUniform(
                [32],
                [new Float32Array([...material.baseFactor, material.diffuse, material.specular, material.shininess/*, material.normalFactor*/])],
                2,
                [baseTexture, baseSampler/*, normalTexture, normalSampler*/]
            );
        }

        const { vertexBuffer, indexBuffer } = this.prepareMesh(primitive.mesh, this.layout);
        this.renderPass.setVertexBuffer(0, vertexBuffer);
        this.renderPass.setIndexBuffer(indexBuffer, 'uint32');

        this.renderPass.drawIndexed(primitive.mesh.indices.length);
    }

}
