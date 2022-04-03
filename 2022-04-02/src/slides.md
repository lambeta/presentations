---
# try also 'default' to start simple
theme: seriph
# random image from a curated Unsplash collection by Anthony
# like them? see https://unsplash.com/collections/94734566/slidev
background: https://source.unsplash.com/collection/94734566/1920x1080
# apply any windi css classes to the current slide
class: 'text-center'
# https://sli.dev/custom/highlighters.html
highlighter: shiki
# show line numbers in code blocks
lineNumbers: false
# some information about the slides, markdown enabled
info: |
  ## Slidev Starter Template
  Presentation slides for developers.

  Learn more at [Sli.dev](https://sli.dev)
# persist drawings in exports and build
drawings:
  persist: false
---
# Welcome to WebAssembly

Fundamental slides for developers

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor" class="text-xl icon-btn opacity-50 !border-none !hover:text-white">
    <carbon:edit />
  </button>
  <a href="https://github.com/lambeta/presentations" target="_blank" alt="GitHub"
    class="text-xl icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

<!--
The last comment block of each slide will be treated as slide notes. It will be visible and editable in Presenter Mode along with the slide. [Read more in the docs](https://sli.dev/guide/syntax.html#notes)
-->

---

# WebAssembly

Definition, [learn more](https://webassembly.github.io/spec/core/intro/index.html)

> WebAssembly (abbreviated Wasm) is a binary instruction format for a stack-based virtual machine. Wasm is designed as a portable compilation target for programming languages, enabling deployment on the web for client and server applications.

WASM 是一种兼容 WEB 的可移植的二进制指令格式。为的是让编译的文件尺寸更小，加载速度更快，运行也快。这种格式运行在栈式虚拟机上，专门为各类编程语言实现可移植编译目标而服务。可以部署在 WEB 的前端或者后端。

---

# Goal
高性能 Web，跨平台使用

> Its main goal is to enable high performance applications on the Web, but it does not make any Web-specific assumptions or provide Web-specific features, so it can be employed in other environments as well.

---

# History
As browser makers looked for ways to improve JavaScript’s performance, Mozilla (which makes the Firefox browser) defined a subset of JavaScript called asm.js

- 2015 - Frist announced, Mozilla [asm.js](https://en.wikipedia.org/wiki/Asm.js) & [Google Native Client](https://en.wikipedia.org/wiki/Google_Native_Client)
- 2017 - MVP
- 2018 - WebAssembly Working Group publish drafts for [Core Specification](https://www.w3.org/TR/wasm-core/), [Javascript interface](https://www.w3.org/TR/wasm-js-api/) & [Web API](https://www.w3.org/TR/wasm-web-api-1/)
    - WASM 标准（类型、指令和模块）
    - JS API 调用 WASM
    - Web 平台集成标准

---

# Core Specification
基本类型、结构体和指令格式

```js {all|2|1-4|4|all}
values: bytes, integes, floating-point, names
types
instructions
modules
```

---

# Javascript interface

```js
(module
    (import "js" "import1" (func $i1))
    (import "js" "import2" (func $i2))
    (func $main (call $i1))
    (start $main)
    (func (export "f") (call $i2))
) // demo.wasm
var importObj = {js: {
    import1: () => console.log("hello,"),
    import2: () => console.log("world!")
}};
fetch('demo.wasm').then(response =>
    response.arrayBuffer()
).then(buffer =>
    WebAssembly.instantiate(buffer, importObj)
).then(({module, instance}) =>
    instance.exports.f()
);
```

---

# Web api
定义了编译、序列化和指令的引用方式
```js
// 编译方式
partial namespace WebAssembly {
  Promise<Module> compileStreaming(Promise<Response> source);
  Promise<WebAssemblyInstantiatedSource> instantiateStreaming(
      Promise<Response> source, optional object importObject);
};

// 指令引用方式
${url}:wasm-function[${funcIndex}]:${pcOffset}

```

---

# Web Browsers Supports

- August 2020, 92.28% of installed browsers (92.5% of desktop browsers and 93.22% of mobile browsers) support WebAssembly
- For older browsers, Wasm can be compiled into asm.js by a JavaScript Polyfill.

---

# Compilers
从 X 编译到 WASM

- C/C++ - [Emscripten](https://en.wikipedia.org/wiki/Emscripten)
- Rust
- .Net
- Java
- Ruby

---

# WASM Program

- [指令集架构](https://webassembly.github.io/spec/core/appendix/index-instructions.html)
- 代码表示
    - .wasm（二进制）
    - .wat（s-expression 人类可读）

---

# Ported Projects
- Unreal Engine 3
- SQLite
- AutoCAD
