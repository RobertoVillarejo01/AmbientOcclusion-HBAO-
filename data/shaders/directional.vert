#version 430

layout (location = 0) in vec3 mPos;

void main()
{
    gl_Position = vec4(mPos, 1);
}