#version 430

layout (location =  0) out vec4 NormalShinny;
layout (location =  1) out vec4 Diffuse;

layout (location = 1) uniform sampler2D	gbuffer_depth;
layout (location = 2) uniform sampler2D	decal_diffuse;
layout (location = 3) uniform sampler2D	decal_normal;
layout (location = 4) uniform sampler2D	decal_material;

layout (location = 5) uniform mat4 Proj2World;
layout (location = 6) uniform mat4 World2Cube;
layout (location = 7) uniform mat4 World2View;
layout (location = 8) uniform vec3 CubeDir;
layout (location = 9) uniform float Tolerance;
layout (location = 10) uniform bool Colors;

void main()
{
	// Read the depth from the GBuffer's depth texture (using the frag coords as UVs)
	vec2  tSize = textureSize(gbuffer_depth, 0);
    vec2  nCoords = vec2(gl_FragCoord.x / tSize.x, gl_FragCoord.y / tSize.y);
	float t_depth = texture(gbuffer_depth, nCoords).r;

	// Using the depth and the frag coords as coordinates, conver them back
	// to world space and then to cube's model space
	vec4 pos = Proj2World * vec4(nCoords * 2 - 1, t_depth * 2 - 1, 1.0);
	pos /= pos.w;
	vec4 cube_pos = World2Cube * pos;

	// Check if the pixel is outside the cube
	if (cube_pos.x < -0.5 || cube_pos.x > 0.5 || 
		cube_pos.y < -0.5 || cube_pos.y > 0.5 || 
		cube_pos.z < -0.5 || cube_pos.z > 0.5)
		discard;

	// If basic plane, just paint it white 
	if (!Colors) {
		NormalShinny	= vec4(1.0f, 0.0f, 0.0f, 1.0);
		Diffuse			= vec4(1,1,1,0.0);
		return;
	}

	// Change from [-0.5, 0.5] to [0,1] so that we can use them as proper UVs
	cube_pos += 0.5;

	// Extract the values from the textures
	vec4 diffuse = texture(decal_diffuse, cube_pos.xy);
	if (diffuse.a < 0.01) discard;
	vec4 spec_shinny = texture(decal_material, cube_pos.xy);
	vec4 normal = texture(decal_normal, cube_pos.xy);

	// TBN Space computing
	vec3 view_pos = vec3(World2View * pos);
	vec3 T = normalize(dFdx(view_pos));
	vec3 B = normalize(dFdy(view_pos));
	vec3 N = normalize(cross(T, B));				
	B = normalize(cross(N, T));

	// Check if the normal of the surface is perpendicular (or close to being)
	// to the decal transform
	vec3 surface_n = normalize(mat3(T,B,N) * vec3(1,0,0));
	if (abs(dot(N, CubeDir)) < Tolerance)
		discard;

	vec3 final_normal = normalize(mat3(T,B,N) * (vec3(normal) * 2 - 1));

	// Detect 
	if (dot(final_normal, final_normal) == 0)
		discard;

	// Fill back the GBuffer
	//Diffuse			= vec4(N, spec_shinny.b);
	Diffuse			= vec4(diffuse.xyz, spec_shinny.b);
	NormalShinny	= vec4(final_normal, spec_shinny.g);
}
