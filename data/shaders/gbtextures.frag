#version 430

out vec4 outputColor;
in  vec2 uvs;

layout(location = 0) uniform uint mode;
layout(location = 1) uniform sampler2D gbuffer_normal_shinny;
layout(location = 2) uniform sampler2D gbuffer_diffuse;
layout(location = 3) uniform sampler2D gbuffer_depth;
layout(location = 4) uniform float contrast;
layout(location = 5) uniform sampler2D gbuffer_blurredambient;

void main()
{
	vec4 normal_shinny	= texture(gbuffer_normal_shinny, uvs);
	vec4 diffuse		= texture(gbuffer_diffuse, uvs);
	float depth			= texture(gbuffer_depth, uvs).r;
	float ambient		= texture(gbuffer_blurredambient, uvs).r;
	depth = max(0, depth - contrast) / (1 - contrast);

	if 	    (mode == 1) outputColor = vec4(normal_shinny.rgb, 		1.0f);		// Normals
	else if (mode == 2) outputColor = vec4(vec3(diffuse.a), 		1.0f);		// Specular
	else if (mode == 3) outputColor = vec4(vec3(normal_shinny.a), 	1.0f);		// Shinniness
	else if (mode == 4) outputColor = vec4(diffuse.rgb, 			1.0f);		// Diffuse
	else if (mode == 5) outputColor = vec4(vec3(depth),				1.0f);		// Depth
	else if (mode == 6) outputColor = vec4(vec3(ambient),			1.0f);		// Blurred Ambient
	else outputColor = vec4(1, 0,0,1);
}
