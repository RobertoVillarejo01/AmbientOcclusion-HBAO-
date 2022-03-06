#version 430

// Inputs / Outputs
out vec4 outputColor;
in  vec2 uvs;

// GBUFFER
layout(location = 0) uniform sampler2D input;
layout(location = 1) uniform bool vertical;

// Coeficients for the Gaussian Blur
float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main()
{
	vec4 og_color = texture(input, uvs);
     
	// Get the size of each pixel (to know the offsets when looking for the neighbours)
    vec2 tex_offset = 1.0 / textureSize(input, 0);

	// The current pixel will always be included
    vec3 result = texture(input, uvs).rgb * weight[0];

	// The rest of pixels will depend on whether we are sampling vertically or horizontally
	vec2 offset = vec2(!vertical, vertical); 
	offset.x *=  tex_offset.x;
	offset.y *=  tex_offset.y;

	for(int i = 1; i < 5; ++i)
	{
		result += texture(input, uvs + offset * i).rgb * weight[i];
		result += texture(input, uvs - offset * i).rgb * weight[i];
	}
		
    outputColor = vec4(result, 1.0);
}
