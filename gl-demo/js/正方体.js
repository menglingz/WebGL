// 顶点着色器
const vertexSource = `
  attribute vec4 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec2 aTextureCoord;

  uniform mat4 uNormalMatrix;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;

    // Apply lighting effect

    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
  }
`;


// 片段着色器
const fragmentSource = `
  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;

  uniform sampler2D uSampler;

  void main(void) {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

    gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
  }
`
let squareRotation = 0.0; // 正方形旋转角度
let cubeRotation = 0.0; // 立方体旋转角度
let deltaTime = 0;
let copyVideo  = false;

const main = () => {
  const canvas = document.getElementById('gl-canvas')
  const gl = canvas.getContext('webgl')

  if (!gl) {
    alert('Failed to get the rendering context for WebGL')
    return
  }

  // 设置清屏颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // 清屏
  gl.clear(gl.COLOR_BUFFER_BIT)

  // 着色器程序
  const shaderProgram = initShaderProgram(gl, vertexSource, fragmentSource)

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
    },
  };

  // 设置缓冲区
  const buffers = initBuffers(gl)

  // 加载纹理
  // const texture = loadTexture(gl, '../js/cubetexture.png')
  const texture = initTexture(gl);
  const video = setupVideo('../js/Firefox.mp4');
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let then = 0
  // 动画播放
  const render = (now) => {
    // 转换到秒
    now *= 0.001
    const deltaTime = now - then
    then = now
    // 视频纹理
    if(copyVideo) {
      updateTexture(gl, texture, video)
    }
    // 调用绘制方法
    drawScene(gl, programInfo, buffers, texture, cubeRotation)
    cubeRotation += deltaTime

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

// 初始化着色器
const initShaderProgram = (gl, vsSource, fsSource) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Failed to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
    return null
  }

  return shaderProgram
}

// 创建着色器
const loadShader = (gl, type, source) => {
  // 创建着色器
  const shader = gl.createShader(type)

  // 绑定着色器
  gl.shaderSource(shader, source)
  // 编译着色器
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('Failed to compile the shaders: ' + gl.getShaderInfoLog(shader))
    return null
  }

  return shader
}

// 初始化缓冲器
const initBuffers = gl => {
  // 创建缓冲区
  const positionBuffer = initPositionBuffer(gl)
  const colorBuffer = initColorBuffer(gl)
  const indexBuffer = initIndexBuffer(gl)
  const textureCoordBuffer = initTextureBuffer(gl)
  const cubeVerticesNormalBuffer = initCubeVerticesBuffer(gl)

  return {
    position: positionBuffer,
    color: colorBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
    vertice: cubeVerticesNormalBuffer,
  }
}
// 初始化缓冲区
const initPositionBuffer = gl => {
  // 创建缓冲区
  const positionBuffer = gl.createBuffer()
  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  const posiitons = [
    // Front face
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    // Back face
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
    // Top face
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
    // Bottom face
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
    // Right face
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
    // Left face
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
  ];
  // 向缓冲区中写入数据
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posiitons), gl.STATIC_DRAW)

  return positionBuffer
}

const initColorBuffer = gl => {
  // 创建缓冲区
  const colorBuffer = gl.createBuffer()
  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)

  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front face: white
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0], // Left face: purple
  ];

  let colors = []
  for (let i = 0; i < faceColors.length; i++) {
    const c = faceColors[i]
    colors = colors.concat(c, c, c, c)
  }
  console.log(new Float32Array(colors))
  // 向缓冲区中写入数据
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  return colorBuffer
}

const initTextureBuffer = (gl) => {
  // 创建缓冲区
  const textureBuffer = gl.createBuffer()
  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer)

  const textureCoordinates = [
    // Front
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Back
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Top
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Bottom
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Right
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Left
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ]

  // 向缓冲区中写入数据
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW)

  return textureBuffer
}

// 初始化元素缓冲区 
const initIndexBuffer = gl => {
  // 创建缓冲区
  const indexBuffer = gl.createBuffer()
  // 绑定缓冲区
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

  // indices 数组声明每一个面都使用两个三角形来渲染。通过立方体顶点数组的索引指定每个三角形的顶点。那么这个立方体就是由 12 个三角形组成的了。
  const indices = [
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // back
    8, 9, 10, 8, 10, 11, // top
    12, 13, 14, 12, 14, 15, // bottom
    16, 17, 18, 16, 18, 19, // right
    20, 21, 22, 20, 22, 23, // left
  ]
  // 向缓冲区中写入数据
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

  return indexBuffer
}

const initCubeVerticesBuffer = gl => {
  const cubeVerticesNormalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer)

  const vertexNormals = [
    // Front
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    // Back
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    // Top
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    // Bottom
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
    // Right
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    // Left
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW)

  return cubeVerticesNormalBuffer
}

// 渲染场景
const drawScene = (gl, programInfo, buffers, texture, cubeRotation) => {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL) 

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // 创建矩阵
  const fieldOfView = (45 * Math.PI) / 180 // 角度转换为弧度
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight // 窗口的宽高比
  const zNear = 0.1 // 最近面
  const zFar = 100.0 // 最远面
  const projectionMatrix = mat4.create() // 投影矩阵
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar) // 激活矩阵
  const modelViewMatrix = mat4.create() // 模型视图矩阵
  // 把图形放在距离视口6个单位的位置
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0])
  // Z轴旋转
  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    cubeRotation, // amount to rotate in radians
    [0, 0, 1],
  );
  // Y轴旋转
  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    cubeRotation * 0.7, // amount to rotate in radians
    [0, 1, 0],
  );
  // X轴旋转
  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    cubeRotation * 0.3, // amount to rotate in radians
    [1, 0, 0],
  );

  // 灯光法向量矩阵
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  setPositionAttribute(gl, programInfo, buffers)
  setTextureAttribute(gl, programInfo, buffers)
  setVertexAttribute(gl, programInfo, buffers)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // 使用着色器程序
  gl.useProgram(programInfo.program)

  // 传递矩阵
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.normalMatrix,
    false,
    normalMatrix
  );

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    // 渲染
    const vertexCount = 36 // 每个三角形有3个顶点
    const type = gl.UNSIGNED_SHORT; // 渲染模式
    const offset = 0 // 顶点坐标的偏移量
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}

// 如何从缓冲区提取位置数据并将其绑定到顶点着色器的属性上
const setPositionAttribute = (gl, programInfo, buffers) => {
  const numComponents = 3 // 顶点坐标的个数(xyz)
  const type = gl.FLOAT // 顶点坐标的类型
  const normalize = false // 顶点坐标是否归一化
  const stride = 0 // 每个顶点坐标占用的字节数
  const offset = 0 // 顶点坐标的偏移量

  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition) // 激活顶点着色器
}

// 如何从缓冲区提取颜色数据并将其绑定到顶点着色器的属性上
const setColorAttribute = (gl, programInfo, buffers) => {
  const numComponents = 4 // 顶点坐标的个数
  const type = gl.FLOAT // 顶点坐标的类型
  const normalize = false // 顶点坐标是否归一化
  const stride = 0// 每个顶点坐标占用的字节数
  const offset = 0 // 顶点坐标的偏移量
  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
  gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor) // 激活顶点着色器
}

const isPowerOf2 = (value) => {
  return (value & (value - 1)) === 0
}

// 告诉 WebGL 如何从缓冲区中提取纹理坐标
const setTextureAttribute = (gl, programInfo, buffers) => {
  const numComponents = 2 // 纹理坐标的个数(xy)
  const type = gl.FLOAT // 纹理坐标的类型
  const normalize = false // 纹理坐标是否归一化
  const stride = 0 // 每个纹理坐标占用的字节数
  const offset = 0 // 纹理坐标的偏移量

  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord)
  gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord) // 激活顶点着色器
}

const setVertexAttribute = (gl, programInfo, buffers) => {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertice)
  gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)
}


// 加载文件纹理
const loadTexture = (gl, url) => {
  // 创建纹理
  const texture = gl.createTexture()
  // 绑定纹理
  gl.bindTexture(gl.TEXTURE_2D, texture)

  const level = 0 // 纹理的级别
  const internalFormat = gl.RGBA // 纹理的格式
  const width = 1 // 纹理的宽度
  const height = 1 // 纹理的高度
  const border = 0 // 纹理边框尺寸
  const srcFormat = gl.RGBA // 纹理数据的格式
  const srcType = gl.UNSIGNED_BYTE // 纹理数据的类型
  const pixel = new Uint8Array([0, 0, 255, 255]) // 纹理数据

  // 将纹理数据放入纹理中 上传一个蓝色的像素点
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel)

  const image = new Image()
  image.onload = function () {
    // 绑定
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // 将图片作为纹理的数据源
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

    // 根据下载的图像在两个维度上是否为 2 的幂来设置纹理的过滤（filter）和平铺（wrap）
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // 纹理是2的幂
      // 如果纹理在两个维度上都是 2 的幂，那么 WebGL 就可以使用更高质量的过滤，可以使用贴图，还能够将平铺模式设置为 REPEAT 或 MIRRORED_REPEAT
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      // 纹理不是2的幂
      // WebGL1 中，对于非 2 的幂纹理只能使用 NEAREST 和 LINEAR 过滤，且不会生成贴图。此外，平铺模式也必须设置为 CLAMP_TO_EDGE
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    }
  }
  image.src = url
  return texture
}

// 初始化视频纹理
const initTexture = (gl) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 这里需要初始化一些数据以便在视频还没下载完成之前使用
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);

  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );

  // 关闭 mips 并将包裹（wrapping）设置为边缘分割（clamp to edge）
  // 这样无论视频的尺寸如何，都可以正常工作。
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}

const updateTexture = (gl, texture, video) => {
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    video
  )
}

const setupVideo = url => {
  const video = document.createElement('video');

  let playing = false;
  let timeupdate = false;

  video.playsInline = true;
  video.muted = true;
  video.loop = true;

  video.addEventListener('playing', () => {
    playing = true;
    checkReady()
  }, true)

  video.addEventListener('timeupdate', () => {
    timeupdate = true;
    checkReady()
  }, true)

  video.src= url;
  video.play();

  const checkReady = () => {
    if (playing && timeupdate) {
      copyVideo = true
    }
  }

  return video;
}

main()
