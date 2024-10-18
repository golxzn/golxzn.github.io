
Object.assign(SHADERS["3D"], { PRIMITIVE : {

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 2) in vec2 a_uv;

out vec2 f_uv;
out vec3 f_color;

uniform mat4 u_mvp;

void main() {
	gl_Position = u_mvp * vec4(a_position, 1.0);
	f_uv = a_uv;
	f_color = a_color;
}
`,


frag : /* glsl */ `#version 300 es
precision mediump float;

in vec2 f_uv;
in vec3 f_color;

layout(location = 0) out vec4 frag_color;
layout(location = 1) out vec4 bright_color;

void main() {
	frag_color = vec4(f_color, 1.0);
	bright_color = frag_color;

	// float brightness = dot(frag_color.rgb, vec3(0.2126, 0.7152, 0.0722));
	// bright_color = brightness > 5.0 ? vec4(frag_color.rgb, 1.0) : vec4(0.0, 0.0, 0.0, 1.0);
}
`

} });
