class Scene
{
    constructor(gl, buffers, programInfo)
    {
        this.gl = gl;
        this.buffers = buffers;
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
        
        {
            var numComponents = 3;  // pull out 2 values per iteration
            const type = gl.FLOAT;    // the data in the buffer is 32bit floats
            var normalize = false;  // don't normalize
            const stride = 0;         // how many bytes to get from one set of values to the next
            const offset = 0;         // how many bytes inside the buffer to start from
            this.gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
            //console.log(this.programInfo);
            this.gl.vertexAttribPointer(
                this.programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
    
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

            numComponents = 3;
            normalize = true;
            this.gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
            this.gl.vertexAttribPointer(
                this.programInfo.attribLocations.vertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexNormal);

            numComponents = 2;
            normalize = false;
            this.gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoords);
            this.gl.vertexAttribPointer(
                this.programInfo.attribLocations.texCoords,
                numComponents,
                type,
                normalize,
                stride,
                offset,
            )
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.texCoords);
        }

        this.gl.useProgram(this.programInfo.program);

        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            this.projectionMatrix);
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelMatrix,
            false,
            this.modelMatrix);

        this.gl.activeTexture(gl.TEXTURE0);
        this.gl.bindTexture(gl.TEXTURE_2D, load_texture(gl, this, "testabstract.jpg"));
        this.gl.uniform1i(this.programInfo.uniformLocations.cube_texture, 0);
        
        this.setViewDependentTransforms();
    }

    redraw()
    {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        this.gl.clearDepth(1.0);                 // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST);           // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL);            // Near things obscure far things
    
        // Clear the canvas before we start drawing on it.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        {
            const offset = 0;
            const type = this.gl.UNSIGNED_SHORT;
            const vertexCount = 36;
            //this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
            this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
        }
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
            this.setViewDependentTransforms();

        }
        if(this.rightMouseDown)
        {
            //console.log("right is down");
            this.camera.changeRadius(ychange);
            this.setViewDependentTransforms();
        }
    }

    setViewDependentTransforms()
    {
        var viewMatrix = this.camera.viewMatrix();
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.viewMatrix,
            false,
            viewMatrix);

        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.normalMatrix,
            false,
            this.normalMatrix(this.modelMatrix, viewMatrix));
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
}