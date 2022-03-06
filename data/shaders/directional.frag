#version 430

// Structs
struct MaterialParameters
{
  vec3  ambient;    
  vec3  diffuse;    
  vec3  specular;   
  float shininess;  
};

struct DirectionalLight
{
  // Basic properties
  vec3 direction;
  vec3 color;
};

// DATA
const float PI = 3.141592;
const vec3 CamPos = vec3(0, 0, 0);
MaterialParameters material;

// Inputs / Outputs
out vec4 outputColor;

// GBUFFER
layout(location = 1) uniform sampler2D gbuffer_pos_spec;
layout(location = 2) uniform sampler2D gbuffer_normal_shinny;
layout(location = 3) uniform sampler2D gbuffer_diffuse;

// Directional Light
layout(location = 4) uniform DirectionalLight light;

// Shadows
layout(location =  6) uniform sampler2D shadow_map[3];
layout(location =  9) uniform mat4 	mWorld2CamInv;
layout(location = 10) uniform mat4 	mWorld2LightPersp[3];
layout(location = 13) uniform float mSubfrustaSplits[4];
layout(location = 17) uniform int 	pcf_size;
layout(location = 18) uniform float mBias;
layout(location = 19) uniform float mOverlap;
layout(location = 20) uniform bool  mUseColors;

// From GBuffer for lighting computations
vec3 mFragPos;
vec3 mNormal;


vec3 SectionShadow(vec3 FragPos, int section)
{
	// Assuming we have found the proper region, still need to check if in shadow or not
	vec4 mWorldPos 		= mWorld2CamInv * vec4(FragPos, 1);
	vec4 mLightSpacePos = mWorld2LightPersp[section] * mWorldPos;
	vec3 mProjectedPos  = vec3(mLightSpacePos / mLightSpacePos.w * 0.5 + 0.5);

	float fragDepth = mProjectedPos.z;

	// Transform the bias based on the section of the cascade we are at
	float bias = mBias / (mSubfrustaSplits[section] * 0.5f);

	// PCF
	float total_shadow = 0.0f;
	vec2  pixel_size = 1.0 / vec2(textureSize(shadow_map[section], 0));
	for (int x = -pcf_size + 1; x < pcf_size; ++x)
	for (int y = -pcf_size + 1; y < pcf_size; ++y)
	{
		vec2 coords = mProjectedPos.xy + vec2(x, y) * pixel_size;
		float textureDepth = texture(shadow_map[section], coords).r;

		if (fragDepth - bias > textureDepth)  total_shadow += 0.0f;
		else								  total_shadow += 1.0f;
	}

	int side = 2 * pcf_size - 1;
	return vec3(total_shadow / (side * side));
}

vec3 SectionColor(int section)
{
	vec3 res = vec3(0,0,0);
	res[section] = 1;
	return res;
}

// Shadow computations (Space conversion, selecting the proper texture, blending and PCF)
vec3 Shadow(vec3 FragPos)
{
	// Select the proper section
	int section = -1;
	for (int i = 0; i < 3; ++i)
	{
		// Check if the fragment is in the subfrustum region
		if (abs(FragPos.z) > mSubfrustaSplits[i] && 
			abs(FragPos.z) < mSubfrustaSplits[i+1])
		{
			section = i;
			break;
		}
	}

	if (section == -1)
		return vec3(1.0f);

	// Check if we are also in the increased region of another level (using overlap)
	int overlap_section = section;
	float overlap_percent = 0.0;
	for (int i = 0; i < 3; ++i)
	{
		// Check if the fragment is in the subfrustum region
		if (abs(FragPos.z) > (mSubfrustaSplits[i]   - mOverlap) && 
			abs(FragPos.z) < (mSubfrustaSplits[i+1] + mOverlap) &&
			i != section)
		{
			overlap_section = i;

			if (section > overlap_section)
				overlap_percent = abs(abs(FragPos.z) - mSubfrustaSplits[i+1]) / mOverlap;
			else
				// Chose to go for overlap = 1 when going to a less precission buffer
				// It did not seem logical to blend with a lower precission one for no reason 
				overlap_percent = 1;
				//overlap_percent = abs(abs(FragPos.z) - mSubfrustaSplits[i]) / mOverlap;

			break;
		}
	}

	// Mix the results
	overlap_percent *= 1;

	if (mUseColors)
		return SectionColor(section) * (overlap_percent) + (1-overlap_percent) * SectionColor(overlap_section);
	else
		return SectionShadow(FragPos, section) * (overlap_percent) + (1-overlap_percent) * SectionShadow(FragPos, overlap_section);
}


void main()
{
	vec2 uvs = gl_FragCoord.xy / textureSize(gbuffer_diffuse, 0);

	vec4 pos_spec		= texture(gbuffer_pos_spec, uvs);
	vec4 normal_shinny	= texture(gbuffer_normal_shinny, uvs);
	vec4 diffuse		= texture(gbuffer_diffuse, uvs);

	material.diffuse = diffuse.rgb;
	material.specular = vec3(pos_spec.a);
	material.shininess = normal_shinny.a;

	mFragPos = pos_spec.rgb;
	mNormal = normal_shinny.rgb;
	
	// This normal is expected to be normalized (and it should be since it is being stored normalized to the GBuffer)
	vec3 N = mNormal;	
	vec3 L = normalize(-light.direction);
	
	// Specular
	vec3 V = normalize(CamPos - mFragPos);
	vec3 R = 2 * dot(N, L) * N - L;
	float specFactor = pow ( max( dot(R, V), 0 ), 1);
	//float specFactor = pow ( max( dot(R, V), 0 ), material.shininess);

	// Different light totals
	vec3 diffuseTotal = material.diffuse * light.color * max( dot(N, L), 0 );
	vec3 specularTotal = material.specular * light.color * specFactor;
	

	// Result / Addition
	if (mUseColors)
		outputColor = vec4(Shadow(mFragPos), 1);
	else
		outputColor = vec4((diffuseTotal + specularTotal) * Shadow(mFragPos).x, 1);
}
