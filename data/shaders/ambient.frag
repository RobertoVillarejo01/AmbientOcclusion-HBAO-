#version 430

out vec4 outputColor;
in  vec2 uvs;

layout(location = 0) uniform sampler2D gbuffer_diffuse;
layout(location = 1) uniform sampler2D gbuffer_ambient;
layout(location = 2) uniform vec4 Ambient;
layout(location = 3) uniform int useAO;

void main()
{
	vec3 diffuse = texture(gbuffer_diffuse, uvs).rgb;
	vec3 ambient = Ambient.rgb;

	if (useAO == 1) ambient *= vec3(texture(gbuffer_ambient, uvs).x);

	outputColor = vec4(ambient * diffuse, 1);
}
