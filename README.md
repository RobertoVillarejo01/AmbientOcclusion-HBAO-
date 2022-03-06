# Horizon-Based Ambient Occlusion

## About

Program built in a C++ Engine from scratch using SDL2, glew, OpenGL, glm and ImGui.  
Implementation based on the paper from NVIDIA: 

>Bavoil, L., Sainz, M., & Dimitrov, R. (2008). Image-space horizon-based ambient occlusion. In ACM SIGGRAPH 2008 talks (pp. 1-1).

<br>

## Preview

![This is a alt text.](/docs/GeneralView.gif "AO On/off - General view")
![This is a alt text.](/docs/AO1.png "AO only Screenshot #1")
![This is a alt text.](/docs/AO2.png "AO only Screenshot #2")

<br>

## Blur type

All images until were using a special type of blurring: [Bilateral Filtering](https://en.wikipedia.org/wiki/Bilateral_filter)  

This type of blurring is the best option when we want to avoid the general foggy outputs from the regular Gaussian Blur. However, it comes at a considerable performance cost. This is because, unlike Gaussian Blur, the bilateral filter should not be implemented in 2 pases (and therefore we need a nested for-loop).  
  
The following extract of code can be found at *data/shaders/ambientBlur.frag*:

```
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
            float ao_sample      = texture(inputTexture, uvs + tex_offset * vec2(i,j)).r;
            float spatial_weight = GaussianSpatial(i*i+j*j);
            float range_weight   = GaussianRange(abs(mAO - ao_sample) * abs(mAO - ao_sample));
            
            result += ao_sample * spatial_weight * range_weight;
            normalizing_factor += spatial_weight * range_weight;
        }
    }
    
    return result / normalizing_factor;
}
```

Here we can see the difference between the 3 blur options provided (No Blurring, Gaussian Blur and Bilateral Filter): 

![This is a alt text.](/docs/BlurComparison.gif "Blur Comparisons")

<br>

## Deferred rendering pipeline

The framework is based on deferred shading. This can become apparent after checking the demo or even reading some of the shaders at *data/shaders*  
  
In any case, the user may check the different data contained in the GBuffer by using the editor:

![This is a alt text.](/docs/GBuffer.gif "Blur Comparisons")

<br>

## Controls

<pre>
AWSDQE             = Move camera Following Forward, Right or World's Up Vector
Right Mouse click  = Rotate
Up/Down/Left/Right = Rotate too (Around Pitch and Yaw)
F5                 = Refresh shaders
Ctrl+R             = Reset Scene (Delete objects and creates them again)
</pre>
