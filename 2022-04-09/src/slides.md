---
theme: seriph
background: https://source.unsplash.com/collection/94734566/1920x1080
class: 'text-center'
highlighter: shiki
lineNumbers: false
info: |
  ## Slidev Starter Template
  Presentation slides for developers.
  Learn more at [Sli.dev](https://sli.dev)
drawings:
  persist: false
---

# Welcome to Golang

Golang slides for developers

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

# 第一行 Go 语言程序
Hello, 世界

```go {all|1|3|6|all}
package main

import "fmt"

func main() {
    fmt.Println("Hello, 世界")
}
```

---
layout: center
class: text-center
---

# 模块

---

# 包（package）

引用的包名与导入路径的最后一个元素一致

```go {all|5|9|all}
package main

import (
    "fmt"
    "math/rand"
)

func main() {
    fmt.Println("My favorite number is", rand.Intn(10)) // math/rand -> rand
}
```

---

# 导出名（exported names）

如果一个名字以大写字母开头，那么它就是已导出的，即 public

```go {all|9|10|all}
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println(math.pi) // ❎
    fmt.Println(math.Pi) // ✅
}
```

---

# 函数(function)

类型在变量名之后

```go {all|5|all}
package main

import "fmt"

func add(x int, y int) int {
    return x + y
}

func main() {
    fmt.Println(add(42, 13))
}
```

---

# 多返回值(multiple results)

函数可以返回任意数量的返回值

```go {all|6|10|all}
package main

import "fmt"

func swap(x, y string) (string, string) {
    return y, x
}

func main() {
    a, b := swap("hello", "world")
    fmt.Println(a, b)
}
```

---
layout: center
class: text-center
---

# 变量

---

# 变量(variables)

var 语句可以出现在包或函数级别，用于声明变量列表、类型在最后

```go {all|5|8|all}
package main

import "fmt"

var c, python, java bool

func main() {
    var i int
    fmt.Println(i, c, python, java)
}
```

---

# 变量初始化(initializer)

变量声明可以包含初始值，可以省略类型

```go {all|5|8|all}
package main

import "fmt"

var i, j int = 1, 2

func main() {
    var c, python, java = true, false, "no!"
    fmt.Println(i, j, c, python, java)
}
```

---

# 简洁变量声明(short declarations)

简洁赋值语句 := 可在类型明确的地方代替 var 声明，只能函数中使用

```go {all|9-10|all}
package main

import "fmt"

var i, j int = 1, 2

func main() {
    var i, j int = 1, 2
    k := 3
    c, python, java := true, false, "no!"
    fmt.Println(i, j, k, c, python, java)
}
```

---

# 基本类型(basic types)

int, uint 和 uintptr 在 32/64 位系统上通常为 32/64 位宽

```go
bool // true, false

string // "no!"

int  int8  int16  int32  int64 // 1, 2
rune // int32 的别名；表示一个 Unicode 码点

uint uint8 uint16 uint32 uint64 uintptr // 1<<64 - 1
byte // uint8 的别名

float32 float64 // 3.141592653589793

complex64 complex128 // 复数，如 2+3i
```
---
layout: center
class: text-center
---

# 控制流程

---

# for 循环

Go 只有一种循环结构：for 循环，没有小括号，而 大括号 { } 则是必须的

```go {all|7-9|all}
package main

import "fmt"

func main() {
    sum := 0
    for i := 0; i < 10; i++ {
        sum += i
    }
    fmt.Println(sum)
}
```

---

# for As while

初始化语句和后置语句是可选的，while 在 Go 中叫做 for

```go {all|7-9|all}
package main

import "fmt"

func main() {
    sum := 1
    for sum < 1000 {
        sum += sum
    }
    fmt.Println(sum)
}
```

---

# if

if 语句可以在条件表达式前执行一个简单的语句

```go {all|9-11|all}
package main

import (
    "fmt"
    "math"
)

func pow(x, n, lim float64) float64 {
    if v := math.Pow(x, n); v < lim {
        return v
    }
    return lim
}
```

---

# if/else

在 if 的简短语句中声明的变量同样可以在任何对应的 else 块中使用

```go {all|4|6|8|11|all}
...
func pow(x, n, lim float64) float64 {
    if v := math.Pow(x, n); v < lim {
        return v
    } else if v == lim {
        fmt.Printf("%g == %g\n", v, lim)
    } else {
        fmt.Printf("%g >= %g\n", v, lim)
    }

    // 这里开始就不能使用 v 了
    return lim
}
```

---

# switch

switch 是编写一连串 if - else 语句的简便方法

```go {all|4-12|all}
...
func main() {
    fmt.Print("Go runs on ")
    switch os := runtime.GOOS; os {
    case "darwin":
        fmt.Println("OS X.")
    case "linux":
        fmt.Println("Linux.")
    default:
        // freebsd, openbsd, plan9, windows...
        fmt.Printf("%s.\n", os)
    }
}
```

---

# defer

将函数推迟到外层函数返回之后执行，推迟调用的函数，其参数会立即求值

```go {all|6|10-11|all}
package main

import "fmt"

func main() {
    defer fmt.Println("world")

    fmt.Println("hello")
}
-> hello
-> world
```

---
layout: center
class: text-center
---

# 指针、结构体、 切片和 Map

---

# 指针

指针保存了值的内存地址

```go {all|6-9|10-12|all}
package main
import "fmt"

func main() {
    i, j := 42, 2701
    p := &i         // 指向 i
    fmt.Println(*p) // 通过指针读取 i 的值，42
    *p = 21         // 通过指针设置 i 的值
    fmt.Println(i)  // 查看 i 的值，21
    p = &j          // 指向 j
    *p = *p / 37    // 通过指针对 j 进行除法运算，73
    fmt.Println(j)  // 查看 j 的值，73
}
```

---

# 结构体

一个结构体(struct)就是一组字段(field)，通过点号访问

```go {all|4-7|10-12|all}
package main
import "fmt"

type Vertex struct {
    X int
    Y int
}

func main() {
    v := Vertex{1, 2}
    v.X = 4
    fmt.Println(v.X)
}
```

---

# 数组

类型 [n]T 表示拥有 n 个 T 类型的值的数组

```go {all|5-9|11-12|all}
package main
import "fmt"

func main() {
    var a [2]string
    a[0] = "Hello"
    a[1] = "World"
    fmt.Println(a[0], a[1]) // Hello World
    fmt.Println(a)          // [Hello World]

    primes := [6]int{2, 3, 5, 7, 11, 13}
    fmt.Println(primes)     // [2 3 5 7 11 13]
}
```

---

# 切片

切片是数组的引用，提供动态的视图，表示一个左闭右开区间

```go {all|8-9|all}
package main
import "fmt"

func main() {
    names := [4]string{ "John", "Paul", "George", "Ringo", }
    fmt.Println(names) // [John Paul George Ringo]
   
    a := names[0:2]
    b := names[1:3]
    fmt.Println(a, b) // [John Paul] [Paul George]
        b[0] = "XXX"
    fmt.Println(a, b) // [John XXX] [XXX George]
    fmt.Println(names) // [John XXX George Ringo]
}
```

---

# 创建切片

使用 make 创建动态数组

```go {all|5|7|all}
package main
import "fmt"

func main() {
    a := make([]int, 0, 5)
    printSlice("b", b) // b len=0 cap=5 []
    c := a[:2]
    printSlice("c", c) // c len=2 cap=5 [0 0]
}

func printSlice(s string, x []int) {
    fmt.Printf("%s len=%d cap=%d %v\n", s, len(x), cap(x), x)
}
```

---

# 向切片追加元素

func append(s []T, vs ...T) []T

```go {all|9|all}
package main

import "fmt"

func main() {
    var s []int
    printSlice(s) // len=0 cap=0 []

    s = append(s, 1, 2, 3) // 可以一次性添加多个元素
    printSlice(s) // len=3 cap=4 [1 2 3]
}
```

---

# 范围（Range）

for 循环的 range 形式可遍历切片

```go {all|7-9|all}
package main
import "fmt"

var pow = []int{1, 2, 4, 8, 16, 32, 64, 128}

func main() {
    for i, v := range pow {
        fmt.Printf("2**%d = %d\n", i, v) // 2**0 = 1...
    }
}

```

---

# Map
使用 make 创建Map

```go {all|12|13-15|all}
package main

import "fmt"

type Vertex struct {
    Lat, Long float64
}

var m map[string]Vertex

func main() {
    m = make(map[string]Vertex)
    m["Bell Labs"] = Vertex{
        40.68433, -74.39967,
    }
    fmt.Println(m["Bell Labs"]) // {40.68433 -74.39967}
}
```

---

## Map 的赋值

```go {all|8-11|all}
package main
import "fmt"

type Vertex struct {
    Lat, Long float64
}

var m = map[string]Vertex{
    "Bell Labs": {40.68433, -74.39967}, // 忽略类型名 Vertex{}
    "Google":    {37.42202, -122.08408},
}

func main() {
    fmt.Println(m)
}
```

---

## 修改 Map

elem, ok := m[key] 判断某个键是否存在

```go {all|3|6|9|12|all}
func main() {
    m := make(map[string]int)
    m["Answer"] = 42
    fmt.Println("The value:", m["Answer"]) // The value: 42

    m["Answer"] = 48
    fmt.Println("The value:", m["Answer"]) // The value: 48

    delete(m, "Answer")
    fmt.Println("The value:", m["Answer"]) // The value: 0

    v, ok := m["Answer"]
    fmt.Println("The value:", v, "Present?", ok) // The value: 0 Present? false
}

```

---

# 函数为一等公民

函数也是值。它们可以像其它值一样传递

```go {all|6-8|1-3|10-11|all}
func compute(fn func(float64, float64) float64) float64 {
    return fn(3, 4)
}

func main() {
    hypot := func(x, y float64) float64 {
        return math.Sqrt(x*x + y*y)
    }
    fmt.Println(hypot(5, 12))
    fmt.Println(compute(hypot)) // 作为参数
    fmt.Println(compute(math.Pow))
}
```

---

# 函数作为闭包

闭包是包含自由变量的开放表达式

```go {all|2|3-6|12|all}
func adder() func(int) int {
    sum := 0
    return func(x int) int {
        sum += x
        return sum
    }
}

func main() {
    pos, neg := adder(), adder()
    for i := 0; i < 10; i++ {
        fmt.Println(pos(i), neg(-2*i))
    }
}
```

---
layout: center
class: text-center
---

# Learn More
[A tour of Go](https://go.dev/tour/welcome/1)
