struct VertexInput {
    @location(0) position : vec2f,
    @location(1) texcoords : vec2f,
    @location(2) color : vec4f,
}

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(0) texcoords : vec2f,
    @location(1) color : vec4f,
}

struct FragmentInput {
    @location(0) texcoords : vec2f,
    @location(1) color : vec4f,
}

struct FragmentOutput {
    @location(0) color : vec4f,
}


struct ModelUniforms {
    modelMatrix : mat4x4f,
    normalMatrix : mat3x3f,
}

struct MaterialUniforms {
    baseFactor : vec4f,
    diffuse : f32,
    specular : f32,
    shininess : f32,
}

@group(1) @binding(0) var<uniform> model : ModelUniforms;
@group(2) @binding(0) var<uniform> material : MaterialUniforms;
@group(2) @binding(1) var uTexture : texture_2d<f32>;
@group(2) @binding(2) var uSampler : sampler;

@vertex
fn vertex(input : VertexInput) -> VertexOutput {

    var output : VertexOutput;
    output.position = model.modelMatrix * vec4(input.position, 0, 1);
    output.texcoords = input.texcoords;
    output.color = input.color;
    return output;
}

@fragment
fn fragment(input : FragmentInput) -> FragmentOutput {
    var output : FragmentOutput;
    output.color = (textureSample(uTexture, uSampler, input.texcoords) + input.color) / 2; 
    return output;
}
