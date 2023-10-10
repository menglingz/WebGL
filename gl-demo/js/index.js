const canvas = document.querySelector('#canvas')
const vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
const fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
const gl = canvas.getContext('webgl')
console.log(gl.COMPILE_STATUS)

if (!gl) {
  throw new Error('Unable to initialize WebGL')
}

const createShader = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (success) {
    return shader
  }

  console.log(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

const createProgram = (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  const success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (success) {
    return program
  }

  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

// 创建shader
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
// 创建着色器程序
const program = createProgram(gl, vertexShader, fragmentShader)
// 查找属性值位置
const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
// 创建一个缓冲
const positionBuffer = gl.createBuffer()
// 绑定缓冲
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
// 创建数据
const positions = [
  1.0, 1.0, 0.1,
  -1.0, 1.0, 0.2,
  1.0, -1.0, 0.3,
  -1.0, -1.0, 0.4
]
// 绑定数据
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

// 绑定属性值
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)
// 激活属性值
gl.enableVertexAttribArray(positionAttributeLocation)

// 调整画布尺寸
webglUtils.resizeCanvasToDisplaySize(canvas)
// 裁剪空间的 -1 -> +1 分别对应到x轴的 0 -> gl.canvas.width 和y轴的 0 -> gl.canvas.height
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
// 清空画布
gl.clearColor(0.0, 0.0, 0.0, 0.0)
gl.clear(gl.COLOR_BUFFER_BIT)

// 运行着色程序
gl.useProgram(program)

// 启用对应属性
gl.enableVertexAttribArray(positionAttributeLocation)
// 绑定缓冲数据
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

const size = 3 // 每次迭代运行提取两个单位数据
const type = gl.FLOAT // 每个单位的数据类型是32位浮点数
const normalize = false // 归一化数据
const stride = 0 // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）每次迭代运行运动多少内存到下一个数据开始点
const offset = 0 // 每次迭代运行从缓冲起始点开始读取数据
// 告诉属性从缓冲里读取数据
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
// 运行渲染
const primitiveType = gl.TRIANGLES
const secOffset = 0
const count = 4
gl.drawArrays(primitiveType, secOffset, count)

