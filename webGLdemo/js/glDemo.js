$(document).ready(function(){
    main();
});

const PI = 3.14159;
var currentScene;
function clamp(val, min, max) 
{
    if(val > max)
    {
        return max;
    }
    if(val < min)
    {
        return min;
    }
    return val;
}

function bindMouseEvents(canvas)
{
    canvas.on("mousedown", function(event){
        if(currentScene)
        {
            if(!currentScene.anyMouseDown())
            {
                canvas.on("mousemove", function(event){
                    if(currentScene)
                    {
                        currentScene.mousemove(event.pageX, event.pageY);
                        currentScene.redraw();
                    }
                });
            }

            currentScene.mousedown(event.which, event.pageX, event.pageY);
            event.preventDefault();
        }
    });

    $(document).on("mouseup", function(event){
        if(currentScene)
        {
            currentScene.mouseup(event.which);

            if(!currentScene.anyMouseDown())
            {
                canvas.off("mousemove");
            }
        }
    });

    canvas.on("contextmenu", function(event) {event.preventDefault();});
}

function main()
{
    const canvas = $("#glCanvas");
    bindMouseEvents(canvas);
    const gl = canvas[0].getContext("webgl");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    //get shaders going
    const baseShaderProgram = attachShaders(gl, baseVertexShader, baseFragmentShader);
    const baseProgramInfo = 
    {
        program: baseShaderProgram,
        attribLocations: 
        {
          vertexPosition: gl.getAttribLocation(baseShaderProgram, 'aVertexPosition'),
          texCoords: gl.getAttribLocation(baseShaderProgram, 'aTexCoords'),
          vertexNormal: gl.getAttribLocation(baseShaderProgram, 'aVertexNormal'),
        },
        uniformLocations: 
        {
          projectionMatrix: gl.getUniformLocation(baseShaderProgram, 'uProjectionMatrix'),
          modelMatrix: gl.getUniformLocation(baseShaderProgram, 'uModelMatrix'),
          viewMatrix: gl.getUniformLocation(baseShaderProgram, 'uViewMatrix'),
          normalMatrix: gl.getUniformLocation(baseShaderProgram, 'uNormalMatrix'),
          colorTexture: gl.getUniformLocation(baseShaderProgram, 'uColorTexture'),
        }
    };

    const shellShaderProgram = attachShaders(gl, shellVertexShader, shellFragmentShader);
    const shellProgramInfo = 
    {
        program: shellShaderProgram,
        attribLocations: 
        {
          vertexPosition: gl.getAttribLocation(shellShaderProgram, 'aVertexPosition'),
          texCoords: gl.getAttribLocation(shellShaderProgram, 'aTexCoords'),
          vertexNormal: gl.getAttribLocation(shellShaderProgram, 'aVertexNormal'),
          furLength: gl.getAttribLocation(shellShaderProgram, 'aFurLength'),
        },
        uniformLocations: 
        {
          projectionMatrix: gl.getUniformLocation(shellShaderProgram, 'uProjectionMatrix'),
          modelMatrix: gl.getUniformLocation(shellShaderProgram, 'uModelMatrix'),
          viewMatrix: gl.getUniformLocation(shellShaderProgram, 'uViewMatrix'),
          normalMatrix: gl.getUniformLocation(shellShaderProgram, 'uNormalMatrix'),
          colorTexture: gl.getUniformLocation(shellShaderProgram, 'uColorTexture'),
          shellAlphaTexture: gl.getUniformLocation(shellShaderProgram, 'uShellAlphaTexture'),
          shellCount: gl.getUniformLocation(shellShaderProgram, 'uShellCount'),
          currentShell: gl.getUniformLocation(shellShaderProgram, 'uCurrentShell'),
        }
    };

    var objectData = loadObject();

    const programInfo = 
    {
        baseProgramInfo: baseProgramInfo,
        shellProgramInfo: shellProgramInfo,
    }

    console.log(programInfo);
    currentScene = new Scene(gl, objectData, programInfo);
    currentScene.redraw();
}

function loadObject() 
{
    const positions = [
        // front
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // back
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // right
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // left
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
    ];

    const normals = [
        // front
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        // back
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        // Top face
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        // Bottom face
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        // right
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        // left
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
    ];

    const indices = [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23,   // left
    ];

    const tex_coords = 
    [
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,    // front
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,    // back
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,     // top
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,     // bottom
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,     // right
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,     // left
    ];

    const furLengths = 
    [
        0.2, 0.7, 0.3, 0.1,    // front
        0.2, 0.7, 0.3, 0.1,    // back
        0.2, 0.7, 0.3, 0.1,     // top
        0.2, 0.7, 0.3, 0.1,     // bottom
        0.2, 0.7, 0.3, 0.1,     // right
        0.2, 0.7, 0.3, 0.1,     // left
    ];


    return {
        position: positions,
        normal: normals,
        face: indices,
        texCoord: tex_coords,
        furLength: furLengths
    }
}
