class Scene
{
    constructor(gl, objectData, programInfo)
    {
        this.gl = gl;
        this.objectData = objectData;
        this.programInfo = programInfo;

        this.fieldOfView = 45 * Math.PI / 180;   // in radians
        this.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        this.zNear = 0.1;
        this.zFar = 100.0;

        this.projectionMatrix = mat4.create();
        mat4.perspective(this.projectionMatrix,
            this.fieldOfView,
            this.aspect,
            this.zNear,
            this.zFar
        );

        //Should make an object class if we make more objects
        this.modelMatrix = mat4.create();

        this.camera = new Camera(6, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

        this.furDataSize = 512;
        this.baseFurData = guassBlur5x5Noise(this.furDataSize);
        this.finTextureSize = 128;
        this.finTextureRaw = finTextureData(this.finTextureSize, 0.2, 0.0);

        this.finBuffers = {
            position: gl.createBuffer(),
            face: gl.createBuffer(),
            finTexCoords: gl.createBuffer(),
            colorTexCoords: gl.createBuffer()
        }

        this.initializeBuffers(this.gl);
        this.initializeTexture();
        this.initializeFinTexture()
        this.setShellCount(10);
    }

    initializeBuffers(gl)
    {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objectData.position), gl.STATIC_DRAW);
    

        const normalBuffer = gl.createBuffer(); 
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objectData.normal), gl.STATIC_DRAW);
    

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.objectData.face),
            gl.STATIC_DRAW);


        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objectData.texCoord), gl.STATIC_DRAW);
    
    
        const furLengthBuffer = gl.createBuffer();  
        gl.bindBuffer(gl.ARRAY_BUFFER, furLengthBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objectData.furLength), gl.STATIC_DRAW);

        this.buffers = {
            position: positionBuffer,
            normal: normalBuffer,
            indices: indexBuffer,
            texCoords: textureCoordBuffer,
            furLength: furLengthBuffer,
        };
    }

    resetFinBuffers(gl, finData)
    {
        gl.deleteBuffer(this.finBuffers.face);
        gl.deleteBuffer(this.finBuffers.position);
        gl.deleteBuffer(this.finBuffers.finTexCoords);
        gl.deleteBuffer(this.finBuffers.colorTexCoords);

        
        const finPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, finPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finData.positions), gl.STATIC_DRAW);

        const finFaceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, finFaceBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(finData.faces), gl.STATIC_DRAW);

        const finTexCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, finTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finData.finTexCoords), gl.STATIC_DRAW);

        const colorTexCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finData.colorTexCoords), gl.STATIC_DRAW);

        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, finFaceBuffer);
        
        var finAttributeLocations = this.programInfo.finProgramInfo.attribLocations;
        this.setAttributeBuffer(gl, [finAttributeLocations.vertexPosition], finPositionBuffer, 3, false);
        this.setAttributeBuffer(gl, [finAttributeLocations.finTexCoords], finTexCoordBuffer, 2, false);
        this.setAttributeBuffer(gl, [finAttributeLocations.colorTexCoords], colorTexCoordBuffer, 2, false);

        this.finBuffers = {
            face: finFaceBuffer,
            position: finPositionBuffer,
            finTexCoords: finTexCoordBuffer,
            colorTexCoords: colorTexCoordBuffer
        };
        
    }

    setAttributeBuffer(gl, programLocations, buffer, numComponents, normalize)
    {
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        for(var programIndex = 0; programIndex < programLocations.length; programIndex++)
        {
            gl.vertexAttribPointer(
                programLocations[programIndex],
                numComponents,
                type,
                normalize,
                stride,
                offset);
    
            gl.enableVertexAttribArray(programLocations[programIndex]);
        }
    }

    loadBaseShellAttributeBuffers()
    {
        const gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);

        var numComponents = 3;
        var normalize = false;
        var vertexPosLocations = [this.programInfo.baseProgramInfo.attribLocations.vertexPosition, this.programInfo.shellProgramInfo.attribLocations.vertexPosition];
        this.setAttributeBuffer(gl, vertexPosLocations, this.buffers.position, numComponents, normalize);
        
        numComponents = 3;
        normalize = true;
        var vertexNormalLocations = [this.programInfo.baseProgramInfo.attribLocations.vertexNormal, this.programInfo.shellProgramInfo.attribLocations.vertexNormal];
        this.setAttributeBuffer(gl, vertexNormalLocations, this.buffers.normal, numComponents, normalize);

        numComponents = 2;
        normalize = false;
        var texCoordLocations = [this.programInfo.baseProgramInfo.attribLocations.texCoords, this.programInfo.shellProgramInfo.attribLocations.texCoords];
        this.setAttributeBuffer(gl, texCoordLocations, this.buffers.texCoords, numComponents, normalize);

        numComponents = 1;
        normalize = false;
        var furLengthLocations = [this.programInfo.shellProgramInfo.attribLocations.furLength];
        this.setAttributeBuffer(gl, furLengthLocations, this.buffers.furLength, numComponents, normalize);
    }

    initializeTexture()
    {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, load_texture(this.gl, this, "testabstract.jpg"));
    }

    loadBaseUniforms(programInfo)
    {
        const gl = this.gl;

        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            this.projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelMatrix,
            false,
            this.modelMatrix);
        
        gl.uniform1i(programInfo.uniformLocations.colorTexture, 0);

        this.setViewDependentTransforms(programInfo);
    }

    loadBaseShaderProgram()
    {
        this.loadBaseUniforms(this.programInfo.baseProgramInfo);
    }

    loadShellShaderProgram()
    {
        var shellProgramInfo = this.programInfo.shellProgramInfo;
        this.loadBaseUniforms(shellProgramInfo);

        this.gl.uniform1f(shellProgramInfo.uniformLocations.shellCount, this.shellCount);
        this.gl.uniform1i(shellProgramInfo.uniformLocations.shellAlphaTexture, 1);
    }

    loadFinShaderProgram()
    {
        var finProgramInfo = this.programInfo.finProgramInfo;
        this.loadBaseUniforms(finProgramInfo);

        this.gl.uniform1i(finProgramInfo.uniformLocations.finTexture, 2);
    }

    setViewDependentTransforms(programInfo)
    {
        var viewMatrix = this.camera.viewMatrix();
        this.currentViewMatrix = viewMatrix;
        this.gl.uniformMatrix4fv(
            programInfo.uniformLocations.viewMatrix,
            false,
            viewMatrix);

        this.currentNormalMatrix = this.normalMatrix(this.modelMatrix, viewMatrix);
        this.gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            this.currentNormalMatrix);
    }

    normalMatrix(modelMatrix, viewMatrix)
    {
        var normalMat = mat4.create();
        var modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        mat4.invert(normalMat, modelViewMatrix);
        mat4.transpose(normalMat, normalMat);

        return normalMat;
    }

    redraw()
    {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        this.gl.clearDepth(1.0);                 // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST);           // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL);            // Near things obscure far things
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        // Clear the canvas before we start drawing on it.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        {
            const offset = 0;
            const type = this.gl.UNSIGNED_SHORT;
            var vertexCount = this.objectData.face.length;

            
            this.loadBaseShellAttributeBuffers();

            this.loadBaseShaderProgram();
            this.gl.depthMask(true);

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
            this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
            
            this.gl.depthMask(false);
            
            
            this.loadFinShaderProgram();
            
            this.loadFins();

            
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.finBuffers.face);
            vertexCount = this.finElementCount;
            this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
            
            
            vertexCount = this.objectData.face.length;
            this.loadShellShaderProgram();
            this.loadBaseShellAttributeBuffers();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);

            for(var shell_number = 1; shell_number <= this.shellCount; shell_number++)
            {
                this.setCurrentShell(shell_number);
                //Load alpha texture
                this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
            }
        }
    }

    debugReadPixelColor(x, y)
    {
        var pixels = new Uint8Array(4);
        this.gl.readPixels(320, 240, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        console.log(pixels);
    }

    setShellCount(shells)
    {
        this.shellCount = shells;
        this.initializeFurTextures();
    }

    initializeFurTextures()
    {
        this.shellTextures = [];
        for(var shellNumber = 0; shellNumber < this.shellCount; shellNumber++)
        {
            const base = 127;
            const max = 182;
            var limit = base + (max - base) * (shellNumber / this.shellCount);
            var filtered = sampleFur(limit, this.baseFurData);
            this.shellTextures.push(textureFromData(this.gl, padAlphaData(filtered), this.furDataSize));
        }
    }

    setCurrentShell(shell)
    {
        this.gl.uniform1f(this.programInfo.shellProgramInfo.uniformLocations.currentShell, shell);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shellTextures[Math.max(0, shell - 1)]);

        //I don't know why this matters but it definitely does.
        //No display when this is not done.
        this.gl.activeTexture(this.gl.TEXTURE0);
    }

    loadFins()
    {
        //var startTime = Date.now(); 
        var eyeVec = vec4.fromValues(0, 0, 1, 0.0)
        var normalMatrix = this.currentNormalMatrix;

        var finData = generateFins(eyeVec, normalMatrix, this.objectData.sharedTriangle, this.objectData);
        this.finElementCount = finData.faces.length;
        this.resetFinBuffers(this.gl, finData);

        //console.log(Date.now() - startTime);
    }

    initializeFinTexture()
    {
        const gl = this.gl;

        var finTexture = textureFromData(gl, padAlphaData(this.finTextureRaw), this.finTextureSize);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, finTexture);

        gl.activeTexture(gl.TEXTURE0);
    }

    mousedown(type, x, y)
    {
        this.x = x;
        this.y = y;

        if(type == 1)
        {
            this.leftMouseDown = true;
        }

        if(type == 2)
        {
            this.middleMouseDown = true;
        }

        if(type == 3)
        {
            this.rightMouseDown = true;
        }
    }

    mouseup(type)
    {
        if(type == 1)
        {
            this.leftMouseDown = false;
        }

        if(type == 2)
        {
            this.middleMouseDown = false;
        }

        if(type == 3)
        {
            this.rightMouseDown = false;
        }
    }

    
    anyMouseDown()
    {
        return this.rightMouseDown || this.middleMouseDown || this.leftMouseDown;
    }

    mousemove(x, y)
    {
        var xchange = x - this.x;
        var ychange = y - this.y;

        this.x = x;
        this.y = y;

        if(this.leftMouseDown)
        {
            //console.log("left is down");
            this.camera.changeLatitude(ychange);
            this.camera.changeLongitude(xchange);

        }
        if(this.rightMouseDown)
        {
            //console.log("right is down");
            this.camera.changeRadius(ychange);
        }
    }
}