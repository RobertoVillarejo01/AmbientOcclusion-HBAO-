#version 430

// Inputs / Outputs
out vec4 outputColor;
in  vec2 uvs;

// GBUFFER
layout(location = 0) uniform sampler2D regular_scene;
layout(location = 1) uniform sampler2D bloom;

void main()
{
	//outputColor = vec4(texture(bloom, uvs).rgb, 1.0f);
	//outputColor = vec4(texture(regular_scene, uvs).rgb, 1.0f);
	outputColor = vec4(texture(regular_scene, uvs).rgb + texture(bloom, uvs).rgb, 1.0f);
}
