#version 430

layout (location = 0) in vec3 mPos;
layout (location = 0) uniform mat4 Model2Proj;

void main()
{
    gl_Position = Model2Proj * vec4(mPos, 1);
}