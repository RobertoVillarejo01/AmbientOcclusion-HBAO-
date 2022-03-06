#version 430

layout (location =  0) out vec4 NormalShinny;
layout (location =  1) out vec4 Diffuse;

in vec2 uvs;
in vec3 mFragPos;

void main()
{
	// Store the values in the GBuffer
	NormalShinny	= vec4(1.0f, 0.0f, 0.0f, 1.0);
	Diffuse			= vec4(1,1,1,0.0);
}
