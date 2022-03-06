#version 430

layout (location = 0) in vec3 mPos;
layout (location = 1) in vec2 mUVs;

out vec2 uvs;

void main()
{
    gl_Position = vec4(mPos, 1);
    uvs         = mUVs;
}