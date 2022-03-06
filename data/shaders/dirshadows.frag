#version 430

layout (location =  1) uniform bool			mat_use_alpha_cutoff;
layout (location =  2) uniform float		mat_alpha_cutoff_value;
layout (location =  3) uniform sampler2D 	mat_diffuse_sampler;

in vec2 uvs;

void main()
{
	// Check if the pixel should be discarded
	if (mat_use_alpha_cutoff)
	{
		vec4 diffuse_from_texture = texture(mat_diffuse_sampler, uvs);
		if (mat_alpha_cutoff_value > diffuse_from_texture.a)
			discard;
	}
}
