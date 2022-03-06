#version 430

out vec4 outputColor;

layout (location =  1) uniform vec4 light_color;
layout (location =  2) uniform float light_intensity;

void main()
{
	outputColor = vec4(light_color.rgb * light_intensity, 1.0f);
}
