#version 430

layout (location = 0) in vec3 mPos;
layout (location = 1) in vec3 mVtxNormal;
layout (location = 2) in vec4 mTangents;
layout (location = 3) in vec2 mUVs;

layout (location = 0) uniform mat4 Model2Proj;
layout (location = 2) uniform mat4 NormalsM2V;
layout (location = 11) uniform mat4 Model2World;
layout (location = 12) uniform mat4 Model2View;

out vec2 uvs;
out vec3 mNormal;
out vec4 mViewPos;

void main()
{
    gl_Position = Model2Proj * vec4(mPos, 1);
    mViewPos    = Model2View * vec4(mPos, 1);
    mNormal     = mat3(NormalsM2V) * mVtxNormal;
    uvs         = mUVs;
}