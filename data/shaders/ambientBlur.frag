#version 430

// Inputs / Outputs
out float outputColor;
in  vec2  uvs;

// Uniforms
layout(location = 0) uniform sampler2D inputTexture;
layout(location = 1) uniform float denominatorSpatial;
layout(location = 2) uniform float denominatorRange;
layout(location = 3) uniform float exp_denominatorSpatial;
layout(location = 4) uniform float exp_denominatorRange;
layout(location = 5) uniform int steps;
layout(location = 6) uniform int mode;


float PI = 3.141592;

float GaussianSpatial(float x2)
{
	return exp(-x2 * exp_denominatorSpatial) * denominatorSpatial;
}
float GaussianRange(float x2)
{
	return exp(-x2 * exp_denominatorRange) * denominatorRange;
}

float GaussianBlur1D()
{
	// Get the size of each pixel (to know the offsets when looking for the neighbours)
    vec2 tex_offset = 1.0 / textureSize(inputTexture, 0);

	// The current pixel will always be included
	float normalizing_factor = 0.0;
	float result = 0.0;

	// The rest of pixels will depend on whether we are sampling vertically or horizontally
	vec2 offset = vec2(1, 0); 
	offset.x *=  tex_offset.x;
	offset.y *=  tex_offset.y;

	for(int i = -steps + 1; i < steps; ++i)
	for(int j = -steps + 1; j < steps; ++j)
	{
		float spatial_weight = GaussianSpatial(i*i);
		normalizing_factor += spatial_weight;
		result += texture(inputTexture, uvs + tex_offset * vec2(i,j)).r * spatial_weight;
	}

	return result / normalizing_factor;
}

float BilateralFilter()
{
	// Get the size of each pixel (to know the offsets when looking for the neighbours)
    vec2 tex_offset = 1.0 / textureSize(inputTexture, 0);
    float result = 0.0;
	float normalizing_factor = 0.0;
	float mAO = texture(inputTexture, uvs).r;

	int blur_width = steps;
	for(int i = -blur_width + 1 ; i < blur_width ; ++i)
	{
		for(int j = -blur_width + 1 ; j < blur_width ; ++j)
		{
			float ao_sample = texture(inputTexture, uvs + tex_offset * vec2(i,j)).r;
			float spatial_weight = GaussianSpatial(i*i+j*j);
			float range_weight = GaussianRange(abs(mAO - ao_sample) * abs(mAO - ao_sample));

			result += ao_sample * spatial_weight * range_weight;
			normalizing_factor += spatial_weight * range_weight;
		}
	}
	
	return result / normalizing_factor;
}

void main()
{
	if (mode == 0)
		outputColor = texture(inputTexture, uvs).r;
	else if (mode == 1)
		outputColor = GaussianBlur1D();
	else if (mode == 2)
		outputColor = BilateralFilter();
}
