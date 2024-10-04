
Object.assign(SHADERS["3D"], { DEPTH : {

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec3 a_position;

uniform mat4 u_mvp;

void main() {
	gl_Position = u_mvp * vec4(a_position, 1.0);
}
`,


frag : /* glsl */ `#version 300 es
precision mediump float;
void main() { }
`

} });
