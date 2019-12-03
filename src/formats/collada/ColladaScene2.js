/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * @exports ColladaScene
 */
import WorldWind from 'webworldwind-gisat';

const {
    ArgumentError,
    BasicTextureProgram,
    Color,
    Logger,
    Matrix,
    PickedObject,
    Renderable,
    Vec3
} = WorldWind;

import * as WorldWind from '../../constants';


/**
 * Constructs a collada scene
 * @alias ColladaScene
 * @constructor
 * @augments Renderable
 * @classdesc Represents a scene. A scene is a collection of nodes with meshes, materials and textures.
 * @param {Position} position The scene's geographic position.
 * @param {Object} sceneData The scene's data containing the nodes, meshes, materials, textures and other
 * info needed to render the scene.
 */
var ColladaScene = function (position, sceneData) {

    if (!position) {
        throw new ArgumentError(
            Logger.logMessage(Logger.LEVEL_SEVERE, "ColladaScene", "constructor", "missingPosition"));
    }

    Renderable.call(this);

    this.entities = [];

    // Documented in defineProperties below.
    this._position = position;

    // Documented in defineProperties below.
    this._nodes = [];
    this._meshes = {};
    this._materials = {};
    this._images = {};
    this._upAxis = '';
    this._dirPath = '';

    // Documented in defineProperties below.
    this._xRotation = 0;
    this._yRotation = 0;
    this._zRotation = 0;

    this.preX = 0;
    this.preY = 0;
    this.preZ = 0;

    // Documented in defineProperties below.
    this._xTranslation = 0;
    this._yTranslation = 0;
    this._zTranslation = 0;

    // Documented in defineProperties below.
    this._scale = 1;

    // Documented in defineProperties below.
    this._altitudeMode = WorldWind.ABSOLUTE;

    // Documented in defineProperties below.
    this._localTransforms = true;

    // Documented in defineProperties below.
    this._useTexturePaths = true;

    // Documented in defineProperties below.
    this._nodesToHide = [];
    this._hideNodes = false;

    this.setSceneData(sceneData);

    // Documented in defineProperties below.
    this._placePoint = new Vec3(0, 0, 0);

    // Documented in defineProperties below.
    this._transformationMatrix = Matrix.fromIdentity();

    // Documented in defineProperties below.
    this._normalMatrix = Matrix.fromIdentity();

    this._texCoordMatrix = Matrix.fromIdentity().setToUnitYFlip();

    this.finalNormalMatrix = Matrix.fromIdentity();
    this.mvpMatrix = Matrix.fromIdentity();

    this._activeTexture = null;

    this.mustUpdate = true;
    this.vaoSetup = false;

    this.scratchVector = new Vec3(0, 0, 0);
    this.scratchColor = new Color(0, 0, 0, 1);

    this.buffers = [];

    this.textures = [];

    this.iboCahckeKey = null;
    this.vboCahckeKey = null;
    this.hasIbo = null;

    this.greyedOut = false;

};

ColladaScene.prototype = Object.create(Renderable.prototype);
ColladaScene.prototype.constructor = ColladaScene;

Object.defineProperties(ColladaScene.prototype, {

    /**
     * The scene's geographic position.
     * @memberof ColladaScene.prototype
     * @type {Position}
     */
    position: {
        get: function () {
            return this._position;
        },
        set: function (value) {
            this._position = value;
            this.mustUpdate = true;
        }
    },

    /**
     * An array of nodes extracted from the collada file.
     * @memberof ColladaScene.prototype
     * @type {ColladaNode[]}
     */
    nodes: {
        get: function () {
            return this._nodes;
        },
        set: function (value) {
            this._nodes = value;
        }
    },

    /**
     * An object with meshes extracted from the collada file.
     * @memberof ColladaScene.prototype
     * @type {{ColladaMesh}}
     */
    meshes: {
        get: function () {
            return this._meshes;
        },
        set: function (value) {
            this._meshes = value;
        }
    },

    /**
     * An object with materials and their effects extracted from the collada file.
     * @memberof ColladaScene.prototype
     * @type {ColladaMaterial}
     */
    materials: {
        get: function () {
            return this._materials;
        },
        set: function (value) {
            this._materials = value;
        }
    },

    /**
     * An object with images extracted from the collada file.
     * @memberof ColladaScene.prototype
     * @type {ColladaImage}
     */
    images: {
        get: function () {
            return this._images;
        },
        set: function (value) {
            this._images = value;
        }
    },

    /**
     * The up axis of the collada model extracted from the collada file.
     * @memberof ColladaScene.prototype
     * @type {String}
     */
    upAxis: {
        get: function () {
            return this._upAxis;
        },
        set: function (value) {
            this._upAxis = value;
        }
    },

    /**
     * The path to the directory of the collada file.
     * @memberof ColladaScene.prototype
     * @type {String}
     */
    dirPath: {
        get: function () {
            return this._dirPath;
        },
        set: function (value) {
            this._dirPath = value;
        }
    },

    /**
     * The scene's rotation angle in degrees for the x axis.
     * @memberof ColladaScene.prototype
     * @type {Number}
     */
    xRotation: {
        get: function () {
            return this._xRotation;
        },
        set: function (value) {
            this._xRotation = value;
            this.mustUpdate = true;
        }
    },

    /**
     * The scene's rotation angle in degrees for the x axis.
     * @memberof ColladaScene.prototype
     * @type {Number}
     */
    yRotation: {
        get: function () {
            return this._yRotation;
        },
        set: function (value) {
            this._yRotation = value;
            this.mustUpdate = true;
        }
    },

    /**
     * The scene's rotation angle in degrees for the x axis.
     * @memberof ColladaScene.prototype
     * @type {Number}
     */
    zRotation: {
        get: function () {
            return this._zRotation;
        },
        set: function (value) {
            this._zRotation = value;
            this.mustUpdate = true;
        }
    },

    /**
     * The scene's translation for the x axis.
     * @memberof ColladaScene.prototype
     * @type {Number}
     */
    xTranslation: {
        get: function () {
            return this._xTranslation;
        },
        set: function (value) {
            this._xTranslation = value;
            this.mustUpdate = true;
        }
    },

    /**
     * The scene's translation for the y axis.
     * @memberof ColladaScene.prototype
     * @type {Number}
     */
    yTranslation: {
        get: function () {
            return this._yTranslation;
        },
        set: function (value) {
            this._yTranslation = value;
            this.mustUpdate = true;
        }
    },

    /**
     * The scene's translation for the z axis.
     * @memberof ColladaScene.prototype
     * @type {Number}
     */
    zTranslation: {
        get: function () {
            return this._zTranslation;
        },
        set: function (value) {
            this._zTranslation = value;
            this.mustUpdate = true;
        }
    },

    /**
     * The scene's scale.
     * @memberof ColladaScene.prototype
     * @type {Number}
     */
    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            this._scale = value;
            this.mustUpdate = true;
        }
    },

    /**
     * The scene's Cartesian point on the globe for the specified position.
     * @memberof ColladaScene.prototype
     * @type {Vec3}
     */
    placePoint: {
        get: function () {
            return this._placePoint;
        },
        set: function (value) {
            this._placePoint = value;
        }
    },

    /**
     * The scene's altitude mode. May be one of
     * <ul>
     *  <li>[WorldWind.ABSOLUTE]{@link WorldWind#ABSOLUTE}</li>
     *  <li>[WorldWind.RELATIVE_TO_GROUND]{@link WorldWind#RELATIVE_TO_GROUND}</li>
     *  <li>[WorldWind.CLAMP_TO_GROUND]{@link WorldWind#CLAMP_TO_GROUND}</li>
     * </ul>
     * @default WorldWind.ABSOLUTE
     * @memberof ColladaScene.prototype
     * @type {String}
     */
    altitudeMode: {
        get: function () {
            return this._altitudeMode;
        },
        set: function (value) {
            this._altitudeMode = value;
            this.mustUpdate = true;
        }
    },

    /**
     * The scene's transformation matrix containing the scale, rotations and translations
     * @memberof ColladaScene.prototype
     * @type {Matrix}
     */
    transformationMatrix: {
        get: function () {
            return this._transformationMatrix;
        },
        set: function (value) {
            this._transformationMatrix = value;
        }
    },

    /**
     * The scene's normal matrix
     * @memberof ColladaScene.prototype
     * @type {Matrix}
     */
    normalMatrix: {
        get: function () {
            return this._normalMatrix;
        },
        set: function (value) {
            this._normalMatrix = value;
        }
    },

    /**
     * Force the use of the nodes transformation info. Some 3d software may break the transformations when
     * importing/exporting models to collada format. Set to false to ignore the the nodes transformation.
     * Only use this option if the model does not render properly.
     * @memberof ColladaScene.prototype
     * @default true
     * @type {Boolean}
     */
    localTransforms: {
        get: function () {
            return this._localTransforms;
        },
        set: function (value) {
            this._localTransforms = value;
        }
    },

    /**
     * Force the use of the texture path specified in the collada file. Set to false to ignore the paths of the
     * textures in the collada file and instead get the textures from the same dir as the collada file.
     * @memberof ColladaScene.prototype
     * @default true
     * @type {Boolean}
     */
    useTexturePaths: {
        get: function () {
            return this._useTexturePaths;
        },
        set: function (value) {
            this._useTexturePaths = value;
        }
    },

    /**
     * An array of node id's to not render.
     * @memberof ColladaScene.prototype
     * @type {String[]}
     */
    nodesToHide: {
        get: function () {
            return this._nodesToHide;
        },
        set: function (value) {
            this._nodesToHide = value;
        }
    },

    /**
     * Set to true to force the renderer to not draw the nodes passed to the nodesToHide list.
     * @memberof ColladaScene.prototype
     * @default false
     * @type {Boolean}
     */
    hideNodes: {
        get: function () {
            return this._hideNodes;
        },
        set: function (value) {
            this._hideNodes = value;
        }
    }

});

// Internal. Intentionally not documented.
ColladaScene.prototype.setSceneData = function (sceneData) {
    if (sceneData) {
        this.nodes = sceneData.root.children;
        this.meshes = sceneData.meshes;
        this.materials = sceneData.materials;
        this.images = sceneData.images;
        this.upAxis = sceneData.metadata.up_axis;
        this.dirPath = sceneData.dirPath;

        this.flattenModelBegin();
    }
};

ColladaScene.prototype.flattenModelBegin = function () {
    for (var i = 0, nodesLen = this.nodes.length; i < nodesLen; i++) {
        this.flattenModel(this.nodes[i]);
    }

    this.entities.sort(function (a, b) {
        var va = (a.texture === null) ? "" : "" + a,
            vb = (b.texture === null) ? "" : "" + b;
        return va > vb ? 1 : ( va === vb ? 0 : -1 );
    });

};

ColladaScene.prototype.flattenModel = function (node) {

    var renderNode = this.mustRenderNode(node.id);

    if (renderNode) {

        if (node.mesh) {

            var meshKey = node.mesh;
            var buffers = this.meshes[meshKey].buffers;

            for (var i = 0, bufLen = buffers.length; i < bufLen; i++) {

                var materialBuf = buffers[i].material;

                for (var j = 0; j < node.materials.length; j++) {
                    if (materialBuf === node.materials[j].symbol) {
                        var materialKey = node.materials[j].id;
                        break;
                    }
                }

                var material = this.materials[materialKey];
                var textureCacheKey = null;
                if (material.textures) {
                    if (material.textures.diffuse) {
                        var imageKey = material.textures.diffuse.mapId;
                    }
                    else {
                        imageKey = material.textures.reflective.mapId;
                    }

                    var image = this.useTexturePaths ? this.images[imageKey].path : this.images[imageKey].filename;
                    textureCacheKey = this.dirPath + image + "";
                }

                this.entities.push({
                    mesh: buffers[i],
                    material: material,
                    node: node,
                    texture: textureCacheKey
                });
            }
        }


        for (var k = 0; k < node.children.length; k++) {
            this.flattenModel(node.children[k]);
        }

    }

};

// Internal. Intentionally not documented.
ColladaScene.prototype.render = function (dc) {

    var orderedScene;
    var frustum = dc.navigatorState.frustumInModelCoordinates;

    if (!this.enabled) {
        return;
    }

    if (this.lastFrameTime !== dc.timestamp) {
        orderedScene = this.makeOrderedRenderable(dc);
    }

    if (!orderedScene) {
        return;
    }

    if (!frustum.containsPoint(this._placePoint)) {
        return;
    }

    orderedScene.layer = dc.currentLayer;

    this.lastFrameTime = dc.timestamp;

    dc.addOrderedRenderable(orderedScene);
};

// Internal. Intentionally not documented.
ColladaScene.prototype.makeOrderedRenderable = function (dc) {

    dc.surfacePointForMode(this.position.latitude, this.position.longitude, this.position.altitude,
        this.altitudeMode, this.placePoint);

    this.eyeDistance = dc.navigatorState.eyePoint.distanceTo(this.placePoint);

    return this;

};

// Internal. Intentionally not documented.
ColladaScene.prototype.renderOrdered = function (dc) {

    this.loadTextures(dc);

    if (!this.allTexturesLoaded) {
        return;
    }

    this.drawOrderedScene(dc);

    if (dc.pickingMode) {
        var po = new PickedObject(this.pickColor.clone(), this,
            this.position, this.layer, false);

        dc.resolvePick(po);
    }
};

// Internal. Intentionally not documented.
ColladaScene.prototype.drawOrderedScene = function (dc) {
    this.beginDrawing(dc);
    this.endDrawing(dc);
};

// Internal. Intentionally not documented.
ColladaScene.prototype.beginDrawing = function (dc) {

    var gl = dc.currentGlContext;
    dc.findAndBindProgram(BasicTextureProgram);
    var gpuResourceCache = dc.gpuResourceCache;

    var vboId = gpuResourceCache.resourceForKey(this.vboCahckeKey);
    var iboId = gpuResourceCache.resourceForKey(this.iboCahckeKey);
    if (this.hasIbo === null) {
        this.setupBuffers(dc);
    }
    if (!vboId || (!iboId && this.hasIbo === true)) {
        this.setupBuffers(dc);
    }
    else {
        gl.bindBuffer(gl.ARRAY_BUFFER, vboId);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iboId);
    }

    gl.enableVertexAttribArray(0);
    gl.disableVertexAttribArray(1);

    if (dc.pickingMode) {
        this.pickColor = dc.uniquePickColor();
    }

    this.computeTransformationMatrix(dc.globe);

    for (var i = 0, len = this.entities.length; i < len; i++) {
        if (this.greyedOut) {
            this.drawGreyedOut(dc, this.entities[i]);
        }
        else {
            this.draw(dc, this.entities[i]);
        }
    }

};

ColladaScene.prototype.setupBuffers = function (dc) {

    var gl = dc.currentGlContext;
    var sizeOfFloat32 = Float32Array.BYTES_PER_ELEMENT || 4;
    var sizeOfUint16 = Uint16Array.BYTES_PER_ELEMENT || 2;
    var numIndices = 0;
    var numVertices = 0;

    var vbo = gl.createBuffer();

    for (var i = 0, len = this.entities.length; i < len; i++) {
        var mesh = this.entities[i].mesh;
        if (mesh.indexedRendering) {
            numIndices += mesh.indices.length;
        }
        numVertices += mesh.vertices.length;
        if (this.entities[i].texture) {
            numVertices += mesh.uvs.length;
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, sizeOfFloat32 * numVertices, gl.STATIC_DRAW);

    var offset = 0;
    for (i = 0, len = this.entities.length; i < len; i++) {
        var data = this.entities[i].mesh.vertices;
        this.entities[i].vertexOffset = offset;
        gl.bufferSubData(gl.ARRAY_BUFFER, offset * sizeOfFloat32, data);
        offset += data.length;
    }

    for (i = 0, len = this.entities.length; i < len; i++) {
        if (this.entities[i].texture) {
            data = this.entities[i].mesh.uvs;
            this.entities[i].uvOffset = offset;
            gl.bufferSubData(gl.ARRAY_BUFFER, offset * sizeOfFloat32, data);
            offset += data.length;
        }
    }

    if (numIndices) {
        var ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sizeOfUint16 * numIndices, gl.STATIC_DRAW);

        offset = 0;
        for (i = 0, len = this.entities.length; i < len; i++) {
            mesh = this.entities[i].mesh;
            if (mesh.indexedRendering) {
                data = this.entities[i].mesh.indices;
                this.entities[i].indicesOffset = offset;
                gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, offset * sizeOfUint16, data);
                offset += data.length;
            }
        }
    }


    this.vboCahckeKey = dc.gpuResourceCache.generateCacheKey();
    dc.gpuResourceCache.putResource(this.vboCahckeKey, vbo, numVertices * sizeOfFloat32);

    if (numIndices) {
        this.iboCahckeKey = dc.gpuResourceCache.generateCacheKey();
        dc.gpuResourceCache.putResource(this.iboCahckeKey, ibo, numIndices * sizeOfUint16);
        this.hasIbo = true;
    }
    else {
        this.hasIbo = false;
    }

};

// Internal. Intentionally not documented.
ColladaScene.prototype.draw = function (dc, entity) {

    var buffers = entity.mesh;
    var material = entity.material;
    var nodeWorldMatrix = entity.node.worldMatrix;
    var textureCacheKey = entity.texture;

    var gl = dc.currentGlContext,
        program = dc.currentProgram;

    this.applyColor(dc, material);

    if (textureCacheKey) {
        this._activeTexture = dc.gpuResourceCache.resourceForKey(textureCacheKey);
        if (!this._activeTexture) {
            var wrapMode = buffers.isClamp ? gl.CLAMP_TO_EDGE : gl.REPEAT;
            this._activeTexture = dc.gpuResourceCache.retrieveTexture(gl, textureCacheKey, wrapMode);
        }
        var textureBound = this._activeTexture && this._activeTexture.bind(dc);
        if (textureBound) {
            program.loadTextureEnabled(gl, true);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8, entity.uvOffset * 4);
            gl.enableVertexAttribArray(2);
            program.loadModulateColor(gl, dc.pickingMode);
        }
        else {
            program.loadTextureEnabled(gl, false);
            gl.disableVertexAttribArray(2);
        }
    }
    else {
        program.loadTextureEnabled(gl, false);
        gl.disableVertexAttribArray(2);
    }

    this.applyMatrix(dc, false, textureCacheKey, nodeWorldMatrix);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, entity.vertexOffset * 4);

    if (buffers.indexedRendering) {
        gl.drawElements(gl.TRIANGLES, buffers.indices.length, gl.UNSIGNED_SHORT, entity.indicesOffset * 2);
    }
    else {
        gl.drawArrays(gl.TRIANGLES, 0, Math.floor(buffers.vertices.length / 3));
    }
};

ColladaScene.prototype.drawGreyedOut = function (dc, entity) {
    var buffers = entity.mesh;
    var material = entity.material;
    var nodeWorldMatrix = entity.node.worldMatrix;
    var textureCacheKey = entity.texture;

    var gl = dc.currentGlContext,
        program = dc.currentProgram;

    program.loadTextureEnabled(gl, false);
    gl.disableVertexAttribArray(2);

    this.scratchColor.set(0.196, 0.196, 0.196, 1);
    var opacity = dc.currentLayer.opacity;
    //gl.depthMask(opacity >= 1 || dc.pickingMode);
    program.loadColor(gl, dc.pickingMode ? this.pickColor : this.scratchColor);
    program.loadOpacity(gl, dc.pickingMode ? (opacity > 0 ? 1 : 0) : opacity);

    this.applyMatrix(dc, false, false, nodeWorldMatrix);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, entity.vertexOffset * 4);

    if (buffers.indexedRendering) {
        gl.drawElements(gl.TRIANGLES, buffers.indices.length, gl.UNSIGNED_SHORT, entity.indicesOffset * 2);
    }
    else {
        gl.drawArrays(gl.TRIANGLES, 0, Math.floor(buffers.vertices.length / 3));
    }
};

ColladaScene.prototype.applyColor = function (dc, material) {

    var gl = dc.currentGlContext,
        program = dc.currentProgram;

    if (material) {
        if (material.techniqueType === 'constant') {
            var diffuse = material.reflective;
        }
        else {
            diffuse = material.diffuse;
        }
    }

    var opacity;
    var r = 1, g = 1, b = 1, a = 1;

    if (diffuse) {
        r = diffuse[0];
        g = diffuse[1];
        b = diffuse[2];
        a = diffuse[3] != null ? diffuse[3] : 1;
    }

    this.scratchColor.set(r, g, b, a);
    opacity = a * dc.currentLayer.opacity;
    //gl.depthMask(opacity >= 1 || dc.pickingMode);
    program.loadColor(gl, dc.pickingMode ? this.pickColor : this.scratchColor);
    program.loadOpacity(gl, dc.pickingMode ? (opacity > 0 ? 1 : 0) : opacity);
};

ColladaScene.prototype.loadTextures = function (dc) {

    if (this.allTexturesLoaded) {
        return;
    }

    var gl = dc.currentGlContext;

    this.partialTexturesLoaded = true;
    for (var i = 0; i < this.entities.length; i++) {

        if (!this.entities[i].texture || this.entities[i].textureLoaded) {
            continue;
        }

        var buffers = this.entities[i].mesh;
        var textureId = this.entities[i].texture;

        this.textureLoaded = dc.gpuResourceCache.resourceForKey(textureId);
        if (!this.textureLoaded) {
            var wrapMode = buffers.isClamp ? gl.CLAMP_TO_EDGE : gl.REPEAT;
            this.textureLoaded = dc.gpuResourceCache.retrieveTexture(gl, textureId, wrapMode);
            this.entities[i].textureLoaded = false;
            this.partialTexturesLoaded = false;
        }
        else {
            this.entities[i].textureLoaded = true;
        }

    }

    if (this.partialTexturesLoaded) {
        this.allTexturesLoaded = true;
    }
};

// Internal. Intentionally not documented.
ColladaScene.prototype.applyMatrix = function (dc, hasLighting, hasTexture, nodeWorldMatrix) {


    this.mvpMatrix.copy(dc.navigatorState.modelviewProjection);

    this.mvpMatrix.multiplyMatrix(this.transformationMatrix);

    if (nodeWorldMatrix && this.localTransforms) {
        this.mvpMatrix.multiplyMatrix(nodeWorldMatrix);
    }

    if (hasTexture && this._activeTexture) {
        dc.currentProgram.loadTextureMatrix(dc.currentGlContext, this._texCoordMatrix);
        this._activeTexture = null;
    }

    dc.currentProgram.loadModelviewProjection(dc.currentGlContext, this.mvpMatrix);

};

// Internal. Intentionally not documented.
ColladaScene.prototype.endDrawing = function (dc) {

    var gl = dc.currentGlContext,
        program = dc.currentProgram;

    program.loadApplyLighting(gl, false);
    gl.disableVertexAttribArray(2);


};

// Internal. Intentionally not documented.
ColladaScene.prototype.computeTransformationMatrix = function (globe) {

    if (!this.mustUpdate) {
        return;
    }

    this.transformationMatrix.setToIdentity();

    this.transformationMatrix.multiplyByLocalCoordinateTransform(this.placePoint, globe);

    this.transformationMatrix.multiplyByRotation(1, 0, 0, this.xRotation);
    this.transformationMatrix.multiplyByRotation(0, 1, 0, this.yRotation);
    this.transformationMatrix.multiplyByRotation(0, 0, 1, this.zRotation);

    this.transformationMatrix.multiplyByScale(this.scale, this.scale, this.scale);

    this.transformationMatrix.multiplyByTranslation(this.xTranslation, this.yTranslation, this.zTranslation);

    /*this.transformationMatrix.multiplyByRotation(1, 0, 0, (window.preX || 0));
     this.transformationMatrix.multiplyByRotation(0, 1, 0, (window.preY || 180));
     this.transformationMatrix.multiplyByRotation(0, 0, 1, (window.preZ || 0));*/

    this.transformationMatrix.multiplyByRotation(1, 0, 0, this.preX);
    this.transformationMatrix.multiplyByRotation(0, 1, 0, this.preY);
    this.transformationMatrix.multiplyByRotation(0, 0, 1, this.preZ);

    //this.computeNormalMatrix();

    this.mustUpdate = false;

};

// Internal. Intentionally not documented.
ColladaScene.prototype.computeNormalMatrix = function () {

    this.transformationMatrix.extractRotationAngles(this.scratchVector);

    this.normalMatrix.setToIdentity();

    this.normalMatrix.multiplyByRotation(-1, 0, 0, this.scratchVector[0]);
    this.normalMatrix.multiplyByRotation(0, -1, 0, this.scratchVector[1]);
    this.normalMatrix.multiplyByRotation(0, 0, -1, this.scratchVector[2]);
};

// Internal. Intentionally not documented.
ColladaScene.prototype.mustRenderNode = function (nodeId) {
    var draw = true;
    if (this.hideNodes) {
        var pos = this.nodesToHide.indexOf(nodeId);
        draw = (pos === -1);
    }

    return draw;
};


export default ColladaScene;