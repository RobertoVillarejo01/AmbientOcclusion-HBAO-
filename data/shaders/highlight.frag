#version 430

// Inputs / Outputs
out vec4 outputColor;
in  vec2 uvs;

// GBUFFER
layout(location = 0) uniform sampler2D scene;

void main()
{
	vec4 og_color = texture(scene, uvs);

	float brightness = dot(og_color.rgb, vec3(0.2126, 0.7152, 0.0722));

    if( brightness > 1.0 ) 
		outputColor = og_color;
	else
		outputColor = vec4(0,0,0,1);
}
