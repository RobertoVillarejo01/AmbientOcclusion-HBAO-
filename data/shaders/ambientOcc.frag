#version 430

out vec4  outAO;
in  vec2  uvs;

layout(location = 0) uniform sampler2D gbuffer_depth;
layout(location = 1) uniform mat4 Proj2View;
layout(location = 2) uniform int steps;
layout(location = 3) uniform int sections;
layout(location = 4) uniform float radius_scale;
layout(location = 5) uniform float angle_bias;
layout(location = 6) uniform float W0;
layout(location = 7) uniform float contrast;
layout(location = 8) uniform float t_radius;
layout(location = 9) uniform sampler2D gbuffer_positions;
layout(location = 10) uniform int mode;

float PI = 3.141592;
float rand(vec2 uvs)
{
	return fract(sin(dot(uvs, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 DirectAngle()
{
	// Some basic properties that will be used through the function
	vec2 Resolution = textureSize(gbuffer_depth, 0).xy;
	vec2 PixelSize = 1 / Resolution;
	vec2 UVs = gl_FragCoord.xy * PixelSize;

	float angle_start = rand(UVs) * 2 * PI;
	float angle_step = 2 * PI / sections;

	// Depth and tangent computations for this pixel's uv
	vec4  ViewPos = texture(gbuffer_positions, UVs);
	float depth   = texture(gbuffer_depth, UVs).r;
	vec4  ProjPos = vec4(UVs * 2 - 1, depth * 2 - 1, 1.0);

	vec3 dX = normalize(dFdx(ViewPos.xyz));
	vec3 dY = normalize(dFdy(ViewPos.xyz));
	vec3 normal = cross(dX, dY);
	
	// Compute how much is the radius for the pixel (Taking in account that 
	// the projection makes objects seem smaller as they are further back)
	float radius = t_radius;
	vec4 proj_radius =  inverse(Proj2View) * (ViewPos + vec4(radius, 0, 0, 1));
	proj_radius /= proj_radius.w;

	float p_radius = length(ProjPos.xyz - proj_radius.xyz);
	float step_size = p_radius / float(steps);

	// Go around the circle
	float angle = angle_start;
	float addition = 0.0;
	for (int i = 0; i < sections; ++i, angle += angle_step)
	{
		vec3 tangent = cos(angle) * dX + sin(angle) * dY;
		float tangent_angle = angle_bias + atan(tangent.z / length(tangent.xy));

		// Check at different distances and get the highest Horizon Angle
		float maxAngle = angle_bias;
		float stepAO = 0.0;

		// Loop
		for (int j = 1; j < (steps + 1); ++j)
		{
			// Compute uvs of new pos
			vec2 deltaUV = j * step_size * vec2(cos(angle), sin(angle));
			vec2 newUVs = UVs + deltaUV;
			if (newUVs.x < -PixelSize.x * 3 || newUVs.y < 0 || newUVs.x > 1 || newUVs.y > 1)
				continue;

			vec4 H_ViewPos =  texture(gbuffer_positions, newUVs);

			// Check if the pixel for the Horizon vector is inside the radius
			vec3  horizon = H_ViewPos.xyz - ViewPos.xyz;
			float h_length2 = dot(horizon, horizon);
			float r = (radius * radius_scale);
			if (h_length2 > r*r) {
				continue;
			}
			
			// Compute the horizon angle and store the biggest one
			float horizon_angle = (PI / 2.0) - acos(dot(normal, normalize(horizon)));
			if (horizon_angle > maxAngle)
			{
				float AttValue = sin(horizon_angle) - sin(maxAngle);   // Apply the formula
				stepAO += AttValue * W0 * (1 - h_length2 / (r*r));
				maxAngle = horizon_angle;
			}
		}

		// Accumulate the AO
		addition += stepAO;
	}

	return vec4(vec3(1 - (addition / sections) * contrast), 1);
}

vec4 TangentAngle()
{
	vec2 Resolution = textureSize(gbuffer_depth, 0).xy;
	vec2 PixelSize = 1 / Resolution;
	vec2 UVs = gl_FragCoord.xy * PixelSize;

	float angle_start = rand(UVs) * 2 * PI;
	float angle_step = 2 * PI / sections;

	// Depth and tangent computations for this pixel's uv
	vec4  ViewPos = texture(gbuffer_positions, UVs);
	float depth   = texture(gbuffer_depth, UVs).r;
	vec4  ProjPos = vec4(UVs * 2 - 1, depth * 2 - 1, 1.0);

	vec3 dX = normalize(dFdx(ViewPos.xyz));
	vec3 dY = normalize(dFdy(ViewPos.xyz));
	
	// Compute how much is the radius for the pixel (Taking in account that 
	// the projection makes objects seem smaller as they are further back)
	float radius = t_radius;
	vec4 proj_radius =  inverse(Proj2View) * (ViewPos + vec4(radius, 0, 0, 1));
	proj_radius /= proj_radius.w;

	float p_radius = length(ProjPos.xyz - proj_radius.xyz);
	float step_size = p_radius / float(steps);

	// Go around the circle
	float angle = angle_start;
	float addition = 0.0;
	for (int i = 0; i < sections; ++i, angle += angle_step)
	{
		vec3 tangent = cos(angle) * dX + sin(angle) * dY;
		float tangent_angle = angle_bias + atan(tangent.z / length(tangent.xy));

		// Check at different distances and get the highest Horizon Angle
		float maxAngle = tangent_angle;
		float stepAO = 0.0;

		// Loop
		for (int j = 1; j < (steps + 1); ++j)
		{
			// Compute uvs of new pos
			vec2 deltaUV = j * step_size * vec2(cos(angle), sin(angle));
			vec2 newUVs = UVs + deltaUV;
			if (newUVs.x < -PixelSize.x * 3 || newUVs.y < 0 || newUVs.x > 1 || newUVs.y > 1)
				continue;

			vec4 H_ViewPos =  texture(gbuffer_positions, newUVs);

			// Check if the pixel for the Horizon vector is inside the radius
			vec3  horizon = H_ViewPos.xyz - ViewPos.xyz;
			float h_length2 = dot(horizon, horizon);
			float r = (radius * radius_scale);
			if (h_length2 > r*r) {
				continue;
			}
			
			// Compute the horizon angle and store the biggest one
			float horizon_angle = atan(horizon.z / length(horizon.xy));
			if (horizon_angle > maxAngle)
			{
				float AttValue = sin(horizon_angle) - sin(maxAngle);   // Apply the formula
				stepAO += AttValue * (1 - h_length2 / (r*r));
				maxAngle = horizon_angle;
			}
		}


		addition += stepAO;
	}

	return vec4(vec3(1 - (addition / sections) * contrast), 1);
}




void main()
{
	if (mode == 0)
		outAO = TangentAngle();
	else
		outAO = DirectAngle();
}
