//Big note
//If we host this with a real web site we can more conveniently load them with ajax

var simpleVertexShader = `
    attribute vec4 aVertexPosition;

    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying vec2 texture_coords;
    void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
        texture_coords = aVertexPosition.xy;
    }
`

var whiteFragmentSharder = `
    void main() 
    {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
`

var textureFragmentSharder = `
    uniform sampler2D cube_texture;
    varying vec2 texture_coords;

    void main() 
    {
        gl_FragColor = texture(cube_texture, texture_coords);
    }
`

function compileShader(gl, type, source) 
{
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
    {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
}

function attachShaders(gl, vertexShaderSource, fragmentShaderSource)
{
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);


    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) 
    {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}