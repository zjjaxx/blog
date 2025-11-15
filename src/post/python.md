## 简介
Python优缺点

- 简单优雅，跟其他很多编程语言相比，Python 更容易上手。
- 能用更少的代码做更多的事情，提升开发效率。
- 开放源代码，拥有强大的社区和生态圈。
- 能够做的事情非常多，有极强的适应性。
- 胶水语言，能够黏合其他语言开发的东西。
- 解释型语言，更容易跨平台，能够在多种操作系统上运行。
- Python 最主要的缺点是执行效率低（解释型语言的通病），如果更看重代码的执行效率，C、C++ 或 Go 可能是你更好的选择。

## 变量

### 布尔型（`bool`）

布尔型只有`True`、`False`两种值，要么是`True`，要么是`False`

### 变量命名

- 惯例1：变量名通常使用**小写英文字母**，**多个单词用下划线进行连接**。
- 惯例2：受保护的变量用单个下划线开头。
- 惯例3：私有的变量用两个下划线开头。

### 改变变量的类型

可以通过 Python 内置的函数来改变变量的类型，下面是一些常用的和变量类型相关的函数。

- `int()`：将一个数值或字符串转换成整数，可以指定进制。
- `float()`：将一个字符串（在可能的情况下）转换成浮点数。
- `str()`：将指定的对象转换成字符串形式，可以指定编码方式。
- `chr()`：将整数（字符编码）转换成对应的（一个字符的）字符串。
- `ord()`：将（一个字符的）字符串转换成对应的整数（字符编码）。

## `type`函数

在 Python 中可以使用`type`函数对变量的类型进行检查。

```python
"""
使用type函数检查变量的类型

Version: 1.0
Author: 骆昊
"""
a = 100
b = 123.45
c = 'hello, world'
d = True
print(type(a))  # <class 'int'>
print(type(b))  # <class 'float'>
print(type(c))  # <class 'str'>
print(type(d))  # <class 'bool'>
```

## Python语言中的运算符

| 运算符                                                       | 描述                           |
| ------------------------------------------------------------ | ------------------------------ |
| `[]`、`[:]`                                                  | 索引、切片                     |
| `**`                                                         | 幂                             |
| `~`、`+`、`-`                                                | 按位取反、正号、负号           |
| `*`、`/`、`%`、`//`                                          | 乘、除、模、整除               |
| `+`、`-`                                                     | 加、减                         |
| `>>`、`<<`                                                   | 右移、左移                     |
| `&`                                                          | 按位与                         |
| `^`、`                                                       | `                              |
| `<=`、`<`、`>`、`>=`                                         | 小于等于、小于、大于、大于等于 |
| `==`、`!=`                                                   | 等于、不等于                   |
| `is`、`is not`                                               | 身份运算符                     |
| `in`、`not in`                                               | 成员运算符                     |
| `not`、`or`、`and`                                           | 逻辑运算符                     |
| `=`、`+=`、`-=`、`*=`、`/=`、`%=`、`//=`、`**=`、`&=`、`|=`、`^=`、`>>=`、`<<=` | 赋值运算符                     |

::: tip

```python
"""
BMI计算器

Version: 1.0
Author: 骆昊
"""
height = float(input('身高(cm)：'))
weight = float(input('体重(kg)：'))
bmi = weight / (height / 100) ** 2
print(f'{bmi = :.1f}')
if 18.5 <= bmi < 24:
    print('你的身材很棒！')
```

支持连续的比较运算符

:::

## 格式化输出

一个带占位符的字符串，字符串前面的`f`表示这个字符串是需要格式化处理的，其中的`{f:.1f}`和`{c:.1f}`可以先看成是`{f}`和`{c}`，表示输出时会用变量`f`和变量`c`的值替换掉这两个占位符，后面的`:.1f`表示这是一个浮点数，小数点后保留1位有效数字。

```python
"""
将华氏温度转换为摄氏温度

Version: 1.1
Author: 骆昊
"""
f = float(input('请输入华氏温度: '))
c = (f - 32) / 1.8
print(f'{f:.1f}华氏度 = {c:.1f}摄氏度')
```

## 分支结构

在 Python 中，构造分支结构最常用的是`if`、`elif`和`else`三个关键字。

Python 3.10 中增加了一种新的构造分支结构的方式，通过使用`match`和`case` 关键字，我们可以轻松的构造出多分支结构。

下面是使用`match-case`语法实现的代码，虽然作用完全相同，但是代码显得更加简单优雅。

```python
status_code = int(input('响应状态码: '))
match status_code:
    case 400: description = 'Bad Request'
    case 401: description = 'Unauthorized'
    case 403: description = 'Forbidden'
    case 404: description = 'Not Found'
    case 405: description = 'Method Not Allowed'
    case 418: description = 'I am a teapot'
    case 429: description = 'Too many requests'
    case _: description = 'Unknown Status Code'
print('状态码描述:', description)
```

> **说明**：带有`_`的`case`语句在代码中起到通配符的作用，如果前面的分支都没有匹配上，代码就会来到`case _`。`case _`的是可选的，并非每种分支结构都要给出通配符选项。如果分支中出现了`case _`，它只能放在分支结构的最后面，如果它的后面还有其他的分支，那么这些分支将是不可达的。

当然，`match-case`语法还有很多高级玩法，其中有一个合并模式可以先教给大家。例如，我们要将响应状态码`401`、`403`和`404`归入一个分支，`400`和`405`归入到一个分支，其他保持不变，代码还可以这么写。

```python
status_code = int(input('响应状态码: '))
match status_code:
    case 400 | 405: description = 'Invalid Request'
    case 401 | 403 | 404: description = 'Not Allowed'
    case 418: description = 'I am a teapot'
    case 429: description = 'Too many requests'
    case _: description = 'Unknown Status Code'
print('状态码描述:', description)
```

## 循环结构

### for-in循环

如果明确知道循环执行的次数，我们推荐使用`for-in`循环，例如上面说的那个重复 3600 次的场景，我们可以用下面的代码来实现。 注意，被`for-in`循环控制的代码块也是通过缩进的方式来构造，这一点跟分支结构中构造代码块的做法是一样的。我们被`for-in`循环控制的代码块称为循环体，通常循环体中的语句会根据循环的设定被重复执行。

```python
"""
每隔1秒输出一次“hello, world”，持续1小时

Author: 骆昊
Version: 1.1
"""
import time

for _ in range(3600):
    print('hello, world')
    time.sleep(1)
```

需要说明的是，上面代码中的`range(3600)`可以构造出一个从`0`到`3599`的范围，当我们把这样一个范围放到`for-in`循环中，就可以通过前面的循环变量`i`依次取出从`0`到`3599`的整数，这就会让`for-in`代码块中的语句重复 3600 次。当然，`range`的用法非常灵活，下面的清单给出了使用`range`函数的例子：

- `range(101)`：可以用来产生`0`到`100`范围的整数，需要注意的是取不到`101`。
- `range(1, 101)`：可以用来产生`1`到`100`范围的整数，相当于是左闭右开的设定，即`[1, 101)`。
- `range(1, 101, 2)`：可以用来产生`1`到`100`的奇数，其中`2`是步长（跨度），即每次递增的值，`101`取不到。
- `range(100, 0, -2)`：可以用来产生`100`到`1`的偶数，其中`-2`是步长（跨度），即每次递减的值，`0`取不到。

### while循环

如果要构造循环结构但是又不能确定循环重复的次数，我们推荐使用`while`循环。`while`循环通过布尔值或能产生布尔值的表达式来控制循环，当布尔值或表达式的值为`True`时，循环体（`while`语句下方保持相同缩进的代码块）中的语句就会被重复执行，当表达式的值为`False`时，结束循环。

```python
"""
从1到100的整数求和

Version: 1.1
Author: 骆昊
"""
total = 0
i = 1
while i <= 100:
    total += i
    i += 1
print(total)
```

### break和continue

`break`关键字，它的作用是终止循环结构的执行

关键字`continue`，它可以用来放弃本次循环后续的代码直接让循环进入下一轮

## 列表

### 创建列表

在 Python 中，**列表是由一系元素按特定顺序构成的数据序列**，这就意味着如果我们定义一个列表类型的变量，**可以用它来保存多个数据**。在 Python 中，可以使用`[]`字面量语法来定义列表，列表中的多个元素用逗号进行分隔，代码如下所示。

```python
items1 = [35, 12, 99, 68, 55, 35, 87]
items2 = ['Python', 'Java', 'Go', 'Kotlin']
items3 = [100, 12.3, 'Python', True]
print(items1)  # [35, 12, 99, 68, 55, 35, 87]
print(items2)  # ['Python', 'Java', 'Go', 'Kotlin']
print(items3)  # [100, 12.3, 'Python', True]
```

除此以外，还可以通过 Python 内置的`list`函数将其他序列变成列表。准确的说，`list`并不是一个普通的函数，它是创建列表对象的构造器

```python
items4 = list(range(1, 10))
items5 = list('hello')
print(items4)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
print(items5)  # ['h', 'e', 'l', 'l', 'o']
```

### 列表的运算

我们可以使用`+`运算符实现两个列表的拼接，拼接运算会将两个列表中的元素连接起来放到一个列表中，代码如下所示。

```python
items5 = [35, 12, 99, 45, 66]
items6 = [45, 58, 29]
items7 = ['Python', 'Java', 'JavaScript']
print(items5 + items6)  # [35, 12, 99, 45, 66, 45, 58, 29]
print(items6 + items7)  # [45, 58, 29, 'Python', 'Java', 'JavaScript']
items5 += items6
print(items5)  # [35, 12, 99, 45, 66, 45, 58, 29]
```

我们可以使用`*`运算符实现列表的重复运算，`*`运算符会将列表元素重复指定的次数，我们在上面的代码中增加两行，如下所示。

```python
print(items6 * 3)  # [45, 58, 29, 45, 58, 29, 45, 58, 29]
print(items7 * 2)  # ['Python', 'Java', 'JavaScript', 'Python', 'Java', 'JavaScript']
```

我们可以使用`in`或`not in`运算符判断一个元素在不在列表中，我们在上面的代码代码中再增加两行，如下所示。

```python
print(29 in items6)  # True
print(99 in items6)  # False
print('C++' not in items7)     # True
print('Python' not in items7)  # False
```

如果希望一次性访问列表中的多个元素，我们可以使用切片运算。切片运算是形如`[start:end:stride]`的运算符，其中`start`代表访问列表元素的起始位置，`end`代表访问列表元素的终止位置（终止位置的元素无法访问），而`stride`则代表了跨度，简单的说就是位置的增量，比如我们访问的第一个元素在`start`位置，那么第二个元素就在`start + stride`位置，当然`start + stride`要小于`end`。我们给上面的代码增加下面的语句，来使用切片运算符访问列表元素。

```python
print(items8[1:3:1])     # ['strawberry', 'durian']
print(items8[0:3:1])     # ['apple', 'strawberry', 'durian']
print(items8[0:5:2])     # ['apple', 'durian', 'watermelon']
print(items8[-4:-2:1])   # ['strawberry', 'durian']
print(items8[-2:-6:-1])  # ['peach', 'durian', 'strawberry', 'apple']
```

如果`start`值等于`0`，那么在使用切片运算符时可以将其省略；如果`end`值等于`N`，`N`代表列表元素的个数，那么在使用切片运算符时可以将其省略；如果`stride`值等于`1`，那么在使用切片运算符时也可以将其省略。所以，下面的代码跟上面的代码作用完全相同。

```python
print(items8[1:3])     # ['strawberry', 'durian']
print(items8[:3:1])    # ['apple', 'strawberry', 'durian']
print(items8[::2])     # ['apple', 'durian', 'watermelon']
print(items8[-4:-2])   # ['strawberry', 'durian']
print(items8[-2::-1])  # ['peach', 'durian', 'strawberry', 'apple']
```

事实上，我们还可以通过切片操作修改列表中的元素，例如我们给上面的代码再加上一行，大家可以看看这里的输出。

```python
items8[1:3] = ['x', 'o']
print(items8)  # ['apple', 'x', 'o', 'peach', 'watermelon']
```

### 元素的遍历

如果想逐个取出列表中的元素，可以使用`for-in`循环的，有以下两种做法。

方法一：在循环结构中通过索引运算，遍历列表元素。

```python
languages = ['Python', 'Java', 'C++', 'Kotlin']
for index in range(len(languages)):
    print(languages[index])
```

方法二：直接对列表做循环，循环变量就是列表元素的代表。

```python
languages = ['Python', 'Java', 'C++', 'Kotlin']
for language in languages:
    print(language)
```

### 列表的方法

#### 添加和删除元素

我们可以使用列表的`append`方法向列表中追加元素，使用`insert`方法向列表中插入元素。追加指的是将元素添加到列表的末尾，而插入则是在指定的位置添加新元素，大家可以看看下面的代码。

```python
languages = ['Python', 'Java', 'C++']
languages.append('JavaScript')
print(languages)  # ['Python', 'Java', 'C++', 'JavaScript']
languages.insert(1, 'SQL')
print(languages)  # ['Python', 'SQL', 'Java', 'C++', 'JavaScript']
```

我们可以用列表的`remove`方法从列表中删除指定元素，需要注意的是，如果要删除的元素并不在列表中，会引发`ValueError`错误导致程序崩溃，所以建议大家在删除元素时，先用之前讲过的成员运算做一个判断。我们还可以使用`pop`方法从列表中删除元素，`pop`方法默认删除列表中的最后一个元素，当然也可以给一个位置，删除指定位置的元素。在使用`pop`方法删除元素时，如果索引的值超出了范围，会引发`IndexError`异常，导致程序崩溃。除此之外，列表还有一个`clear`方法，可以清空列表中的元素，代码如下所示。

```python
languages = ['Python', 'SQL', 'Java', 'C++', 'JavaScript']
if 'Java' in languages:
    languages.remove('Java')
if 'Swift' in languages:
    languages.remove('Swift')
print(languages)  # ['Python', 'SQL', C++', 'JavaScript']
languages.pop()
temp = languages.pop(1)
print(temp)       # SQL
languages.append(temp)
print(languages)  # ['Python', C++', 'SQL']
languages.clear()
print(languages)  # []
```

#### 元素位置和频次

列表的`index`方法可以查找某个元素在列表中的索引位置，如果找不到指定的元素，`index`方法会引发`ValueError`错误；列表的`count`方法可以统计一个元素在列表中出现的次数，代码如下所示。

```python
items = ['Python', 'Java', 'Java', 'C++', 'Kotlin', 'Python']
print(items.index('Python'))     # 0
# 从索引位置1开始查找'Python'
print(items.index('Python', 1))  # 5
print(items.count('Python'))     # 2
print(items.count('Kotlin'))     # 1
print(items.count('Swfit'))      # 0
# 从索引位置3开始查找'Java'
print(items.index('Java', 3))    # ValueError: 'Java' is not in list
```

#### 元素排序和反转

列表的`sort`操作可以实现列表元素的排序，而`reverse`操作可以实现元素的反转，代码如下所示。

```python
items = ['Python', 'Java', 'C++', 'Kotlin', 'Swift']
items.sort()
print(items)  # ['C++', 'Java', 'Kotlin', 'Python', 'Swift']
items.reverse()
print(items)  # ['Swift', 'Python', 'Kotlin', 'Java', 'C++']
```

### 列表生成式

在 Python 中，列表还可以通过一种特殊的字面量语法来创建，这种语法叫做生成式。下面，我们通过例子来说明使用列表生成式创建列表到底有什么好处。

场景一：创建一个取值范围在`1`到`99`且能被`3`或者`5`整除的数字构成的列表。

```python
items = []
for i in range(1, 100):
    if i % 3 == 0 or i % 5 == 0:
        items.append(i)
print(items)
```

使用列表生成式做同样的事情，代码如下所示。

```python
items = [i for i in range(1, 100) if i % 3 == 0 or i % 5 == 0]
print(items)
```

场景二：有一个整数列表`nums1`，创建一个新的列表`nums2`，`nums2`中的元素是`nums1`中对应元素的平方。

```python
nums1 = [35, 12, 97, 64, 55]
nums2 = []
for num in nums1:
    nums2.append(num ** 2)
print(nums2)
```

使用列表生成式做同样的事情，代码如下所示。

```python
nums1 = [35, 12, 97, 64, 55]
nums2 = [num ** 2 for num in nums1]
print(nums2)
```

## 元组

### 元组的定义和运算

元组和列表的不同之处在于，**元组是不可变类型**，这就意味着元组类型的变量一旦定义，其中的元素不能再添加或删除，而且元素的值也不能修改。如果试图修改元组中的元素，将引发`TypeError`错误，导致程序崩溃。定义元组通常使用形如`(x, y, z)`的字面量语法，元组类型支持的运算符跟列表是一样的，我们可以看看下面的代码。

```python
# 定义一个三元组
t1 = (35, 12, 98)
# 定义一个四元组
t2 = ('骆昊', 45, True, '四川成都')

# 查看变量的类型
print(type(t1))  # <class 'tuple'>
print(type(t2))  # <class 'tuple'>

# 查看元组中元素的数量
print(len(t1))  # 3
print(len(t2))  # 4

# 索引运算
print(t1[0])    # 35
print(t1[2])    # 98
print(t2[-1])   # 四川成都

# 切片运算
print(t2[:2])   # ('骆昊', 43)
print(t2[::3])  # ('骆昊', '四川成都')

# 循环遍历元组中的元素
for elem in t1:
    print(elem)

# 成员运算
print(12 in t1)         # True
print(99 in t1)         # False
print('Hao' not in t2)  # True

# 拼接运算
t3 = t1 + t2
print(t3)  # (35, 12, 98, '骆昊', 43, True, '四川成都')

# 比较运算
print(t1 == t3)            # False
print(t1 >= t3)            # False
print(t1 <= (35, 11, 99))  # False
```

::: tip

需要提醒大家注意的是，`()`表示空元组，但是如果元组中只有一个元素，需要加上一个逗号，否则`()`就不是代表元组的字面量语法，而是改变运算优先级的圆括号，所以`('hello', )`和`(100, )`才是一元组，而`('hello')`和`(100)`只是字符串和整数。

:::

### 打包和解包操作

当我们把多个用逗号分隔的值赋给一个变量时，多个值会打包成一个元组类型；当我们把一个元组赋值给多个变量时，元组会解包成多个值然后分别赋给对应的变量，如下面的代码所示。

```python
# 打包操作
a = 1, 10, 100
print(type(a))  # <class 'tuple'>
print(a)        # (1, 10, 100)
# 解包操作
i, j, k = a
print(i, j, k)  # 1 10 100
```

在解包时，如果解包出来的元素个数和变量个数不对应，会引发`ValueError`异常，错误信息为：`too many values to unpack`（解包的值太多）或`not enough values to unpack`（解包的值不足）。

```python
a = 1, 10, 100, 1000
# i, j, k = a             # ValueError: too many values to unpack (expected 3)
# i, j, k, l, m, n = a    # ValueError: not enough values to unpack (expected 6, got 4)
```

有一种解决变量个数少于元素的个数方法，就是使用星号表达式。通过星号表达式，我们可以让一个变量接收多个值，代码如下所示。需要注意两点：首先，用星号表达式修饰的变量会变成一个列表，列表中有0个或多个元素；其次，在解包语法中，星号表达式只能出现一次。

```python
a = 1, 10, 100, 1000
i, j, *k = a
print(i, j, k)        # 1 10 [100, 1000]
i, *j, k = a
print(i, j, k)        # 1 [10, 100] 1000
*i, j, k = a
print(i, j, k)        # [1, 10] 100 1000
*i, j = a
print(i, j)           # [1, 10, 100] 1000
i, *j = a
print(i, j)           # 1 [10, 100, 1000]
i, j, k, *l = a
print(i, j, k, l)     # 1 10 100 [1000]
i, j, k, l, *m = a
print(i, j, k, l, m)  # 1 10 100 1000 []
```

需要说明一点，解包语法对所有的序列都成立，这就意味着我们之前讲的列表、`range`函数构造的范围序列甚至字符串都可以使用解包语法。大家可以尝试运行下面的代码，看看会出现怎样的结果。

```python
a, b, *c = range(1, 10)
print(a, b, c)
a, b, c = [1, 10, 100]
print(a, b, c)
a, *b, c = 'hello'
print(a, b, c)
```

交换变量的值

交换变量的值是写代码时经常用到的一个操作，但是在很多编程语言中，交换两个变量的值都需要借助一个中间变量才能做到，如果不用中间变量就需要使用比较晦涩的位运算来实现。在 Python 中，交换两个变量`a`和`b`的值只需要使用如下所示的代码。

```
a, b = b, a
```

同理，如果要将三个变量`a`、`b`、`c`的值互换，即`b`的值赋给`a`，`c`的值赋给`b`，`a`的值赋给`c`，也可以如法炮制。

```
a, b, c = b, c, a
```

需要说明的是，上面的操作并没有用到打包和解包语法，Python 的字节码指令中有`ROT_TWO`和`ROT_THREE`这样的指令可以直接实现这个操作，效率是非常高的。但是如果有多于三个变量的值要依次互换，这个时候是没有直接可用的字节码指令的，需要通过打包解包的方式来完成变量之间值的交换。

### 元组和列表的比较

这里还有一个非常值得探讨的问题，Python 中已经有了列表类型，为什么还需要元组这样的类型呢？

1. 元组是不可变类型，**不可变类型更适合多线程环境**，因为它降低了并发访问变量的同步化开销。

2. 元组是不可变类型，通常**不可变类型在创建时间上优于对应的可变类型**。我们可以使用`timeit`模块的`timeit`函数来看看创建保存相同元素的元组和列表各自花费的时间，`timeit`函数的`number`参数表示代码执行的次数。下面的代码中，我们分别创建了保存`1`到`9`的整数的列表和元组，每个操作执行`10000000`次，统计运行时间。

   ```
   import timeit
   
   print('%.3f 秒' % timeit.timeit('[1, 2, 3, 4, 5, 6, 7, 8, 9]', number=10000000))
   print('%.3f 秒' % timeit.timeit('(1, 2, 3, 4, 5, 6, 7, 8, 9)', number=10000000))
   ```

当然，Python 中的元组和列表类型是可以相互转换的，我们可以通过下面的代码来完成该操作。

```python
infos = ('骆昊', 43, True, '四川成都')
# 将元组转换成列表
print(list(infos))  # ['骆昊', 43, True, '四川成都']

frts = ['apple', 'banana', 'orange']
# 将列表转换成元组
print(tuple(frts))  # ('apple', 'banana', 'orange')
```

## 字符串

### 原始字符串

Python 中有一种以`r`或`R`开头的字符串，这种字符串被称为原始字符串，意思是字符串中的每个字符都是它本来的含义，没有所谓的转义字符。例如，在字符串`'hello\n'`中，`\n`表示换行；而在`r'hello\n'`中，`\n`不再表示换行，就是字符`\`和字符`n`。大家可以运行下面的代码，看看会输出什么。

```python
s1 = '\it \is \time \to \read \now'
s2 = r'\it \is \time \to \read \now'
print(s1)
print(s2)
```

### 字符串的运算

Python 语言为字符串类型提供了非常丰富的运算符，有很多运算符跟列表类型的运算符作用类似。例如，我们可以使用`+`运算符来实现字符串的拼接，可以使用`*`运算符来重复一个字符串的内容，可以使用`in`和`not in`来判断一个字符串是否包含另外一个字符串，我们也可以用`[]`和`[:]`运算符从字符串取出某个字符或某些字符。

### 字符的遍历

如果希望遍历字符串中的每个字符，可以使用`for-in`循环，有如下所示的两种方式。

方式一：

```python
s = 'hello'
for i in range(len(s)):
    print(s[i])
```

方式二：

```python
s = 'hello'
for elem in s:
    print(elem)
```

### 格式化

从 Python 3.6 开始，格式化字符串还有更为简洁的书写方式，就是在字符串前加上`f`来格式化字符串，在这种以`f`打头的字符串中，`{变量名}`是一个占位符，会被变量对应的值将其替换掉，代码如下所示。

```python
a = 321
b = 123
print(f'{a} * {b} = {a * b}')
```

## 集合

### 创建集合

在 Python 中，创建集合可以使用`{}`字面量语法,当然，也可以使用 Python 内置函数`set`来创建一个集合，准确的说`set`并不是一个函数，而是创建集合对象的构造器，

```python
set1 = {1, 2, 3, 3, 3, 2}
print(set1)

set2 = {'banana', 'pitaya', 'apple', 'apple', 'banana', 'grape'}
print(set2)

set3 = set('hello')
print(set3)

set4 = set([1, 2, 2, 3, 3, 3, 2, 1])
print(set4)

set5 = {num for num in range(1, 20) if num % 3 == 0 or num % 7 == 0}
print(set5)
```

### 元素的遍历

我们可以通过`len`函数来获得集合中有多少个元素，但是我们不能通过索引运算来遍历集合中的元素，因为集合元素并没有特定的顺序。当然，要实现对集合元素的遍历，我们仍然可以使用`for-in`循环，代码如下所示。

```python
set1 = {'Python', 'C++', 'Java', 'Kotlin', 'Swift'}
for elem in set1:
    print(elem)
```

### 集合的方法

刚才我们说过，Python 中的集合是可变类型，我们可以通过集合的方法向集合添加元素或从集合中删除元素。

```python
set1 = {1, 10, 100}

# 添加元素
set1.add(1000)
set1.add(10000)
print(set1)  # {1, 100, 1000, 10, 10000}

# 删除元素
set1.discard(10)
if 100 in set1:
    set1.remove(100)
print(set1)  # {1, 1000, 10000}

# 清空元素
set1.clear()
print(set1)  # set()
```

> **说明**：删除元素的`remove`方法在元素不存在时会引发`KeyError`错误，所以上面的代码中我们先通过成员运算判断元素是否在集合中。集合类型还有一个`pop`方法可以从集合中随机删除一个元素，该方法在删除元素的同时会返回（获得）被删除的元素，而`remove`和`discard`方法仅仅是删除元素，不会返回（获得）被删除的元素。

## 字典

### 创建和使用字典

Python 中创建字典可以使用`{}`字面量语法，这一点跟上一节课讲的集合是一样的。但是字典的`{}`中的元素是以键值对的形式存在的，每个元素由`:`分隔的两个值构成，`:`前面是键，`:`后面是值，代码如下所示。

```python
xinhua = {
    '麓': '山脚下',
    '路': '道，往来通行的地方；方面，地区：南～货，外～货；种类：他俩是一～人',
    '蕗': '甘草的别名',
    '潞': '潞水，水名，即今山西省的浊漳河；潞江，水名，即云南省的怒江'
}
print(xinhua)
person = {
    'name': '王大锤',
    'age': 55,
    'height': 168,
    'weight': 60,
    'addr': '成都市武侯区科华北路62号1栋101', 
    'tel': '13122334455',
    'emergence contact': '13800998877'
}
print(person)
```

当然，如果愿意，我们也可以使用内置函数`dict`或者是字典的生成式语法来创建字典，代码如下所示。

```python
# dict函数(构造器)中的每一组参数就是字典中的一组键值对
person = dict(name='王大锤', age=55, height=168, weight=60, addr='成都市武侯区科华北路62号1栋101')
print(person)  # {'name': '王大锤', 'age': 55, 'height': 168, 'weight': 60, 'addr': '成都市武侯区科华北路62号1栋101'}

# 可以通过Python内置函数zip压缩两个序列并创建字典
items1 = dict(zip('ABCDE', '12345'))
print(items1)  # {'A': '1', 'B': '2', 'C': '3', 'D': '4', 'E': '5'}
items2 = dict(zip('ABCDE', range(1, 10)))
print(items2)  # {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5}

# 用字典生成式语法创建字典
items3 = {x: x ** 3 for x in range(1, 6)}
print(items3)  # {1: 1, 2: 8, 3: 27, 4: 64, 5: 125}
```

想知道字典中一共有多少组键值对，仍然是使用`len`函数；如果想对字典进行遍历，可以用`for`循环，但是需要注意，`for`循环只是对字典的键进行了遍历，不过没关系，在学习了字典的索引运算后，我们可以通过字典的键访问它对应的值。

```python
person = {
    'name': '王大锤',
    'age': 55,
    'height': 168,
    'weight': 60,
    'addr': '成都市武侯区科华北路62号1栋101'
}
print(len(person))  # 5
for key in person:
    print(key)
```

### 字典的方法

字典类型的方法基本上都跟字典的键值对操作相关，其中`get`方法可以通过键来获取对应的值。跟索引运算不同的是，`get`方法在字典中没有指定的键时不会产生异常，而是返回`None`或指定的默认值，代码如下所示。

```
person = {'name': '王大锤', 'age': 25, 'height': 178, 'addr': '成都市武侯区科华北路62号1栋101'}
print(person.get('name'))       # 王大锤
print(person.get('sex'))        # None
print(person.get('sex', True))  # True
```



如果需要获取字典中所有的键，可以使用`keys`方法；如果需要获取字典中所有的值，可以使用`values`方法。字典还有一个名为`items`的方法，它会将键和值组装成二元组，通过该方法来遍历字典中的元素也是非常方便的。

```python
person = {'name': '王大锤', 'age': 25, 'height': 178}
print(person.keys())    # dict_keys(['name', 'age', 'height'])
print(person.values())  # dict_values(['王大锤', 25, 178])
print(person.items())   # dict_items([('name', '王大锤'), ('age', 25), ('height', 178)])
for key, value in person.items():
    print(f'{key}:\t{value}')
```

字典的`update`方法实现两个字典的合并操作。例如，有两个字典`x`和`y`，当执行`x.update(y)`操作时，`x`跟`y`相同的键对应的值会被`y`中的值更新，而`y`中有但`x`中没有的键值对会直接添加到`x`中，代码如下所示。

```python
person1 = {'name': '王大锤', 'age': 55, 'height': 178}
person2 = {'age': 25, 'addr': '成都市武侯区科华北路62号1栋101'}
person1.update(person2)
print(person1)  # {'name': '王大锤', 'age': 25, 'height': 178, 'addr': '成都市武侯区科华北路62号1栋101'}
```

如果使用 Python 3.9 及以上的版本，也可以使用`|`运算符来完成同样的操作，代码如下所示。

```python
person1 = {'name': '王大锤', 'age': 55, 'height': 178}
person2 = {'age': 25, 'addr': '成都市武侯区科华北路62号1栋101'}
person1 |= person2
print(person1)  # {'name': '王大锤', 'age': 25, 'height': 178, 'addr': '成都市武侯区科华北路62号1栋101'}
```

可以通过`pop`或`popitem`方法从字典中删除元素，前者会返回（获得）键对应的值，但是如果字典中不存在指定的键，会引发`KeyError`错误；后者在删除元素时，会返回（获得）键和值组成的二元组。字典的`clear`方法会清空字典中所有的键值对，代码如下所示。

```python
person = {'name': '王大锤', 'age': 25, 'height': 178, 'addr': '成都市武侯区科华北路62号1栋101'}
print(person.pop('age'))  # 25
print(person)             # {'name': '王大锤', 'height': 178, 'addr': '成都市武侯区科华北路62号1栋101'}
print(person.popitem())   # ('addr', '成都市武侯区科华北路62号1栋101')
print(person)             # {'name': '王大锤', 'height': 178}
person.clear()
print(person)             # {}
```

跟列表一样，从字典中删除元素也可以使用`del`关键字，在删除元素的时候如果指定的键索引不到对应的值，一样会引发`KeyError`错误，具体的做法如下所示。

```python
person = {'name': '王大锤', 'age': 25, 'height': 178, 'addr': '成都市武侯区科华北路62号1栋101'}
del person['age']
del person['addr']
print(person)  # {'name': '王大锤', 'height': 178}
```

## 函数和模块

我们再来写一个函数，根据给出的三条边的长度判断是否可以构成三角形，如果可以构成三角形则返回`True`，否则返回`False`，代码如下所示。

```python
def make_judgement(a, b, c):
    """判断三条边的长度能否构成三角形"""
    return a + b > c and b + c > a and a + c > b
```



上面`make_judgement`函数有三个参数，这种参数叫做位置参数，在调用函数时通常按照从左到右的顺序依次传入，而且传入参数的数量必须和定义函数时参数的数量相同，如下所示。

```python
print(make_judgement(1, 2, 3))  # False
print(make_judgement(4, 5, 6))  # True
```

如果不想按照从左到右的顺序依次给出`a`、`b`、`c` 三个参数的值，也可以使用关键字参数，通过“参数名=参数值”的形式为函数传入参数，如下所示。

```python
print(make_judgement(b=2, c=3, a=1))  # False
print(make_judgement(c=6, b=4, a=5))  # True
```

在定义函数时，我们可以在参数列表中用`/`设置**强制位置参数**（*positional-only arguments*），用`*`设置**命名关键字参数**。所谓强制位置参数，就是调用函数时只能按照参数位置来接收参数值的参数；而命名关键字参数只能通过“参数名=参数值”的方式来传递和接收参数，大家可以看看下面的例子。

```python
# /前面的参数是强制位置参数
def make_judgement(a, b, c, /):
    """判断三条边的长度能否构成三角形"""
    return a + b > c and b + c > a and a + c > b


# 下面的代码会产生TypeError错误，错误信息提示“强制位置参数是不允许给出参数名的”
# TypeError: make_judgement() got some positional-only arguments passed as keyword arguments
# print(make_judgement(b=2, c=3, a=1))
```

> **说明**：强制位置参数是 Python 3.8 引入的新特性，在使用低版本的 Python 解释器时需要注意。

```python
# *后面的参数是命名关键字参数
def make_judgement(*, a, b, c):
    """判断三条边的长度能否构成三角形"""
    return a + b > c and b + c > a and a + c > b


# 下面的代码会产生TypeError错误，错误信息提示“函数没有位置参数但却给了3个位置参数”
# TypeError: make_judgement() takes 0 positional arguments but 3 were given
# print(make_judgement(1, 2, 3))
```

### 可变参数

Python 语言中可以通过星号表达式语法让函数支持可变参数。所谓可变参数指的是在调用函数时，可以向函数传入`0`个或任意多个参数。将来我们以团队协作的方式开发商业项目时，很有可能要设计函数给其他人使用，但有的时候我们并不知道函数的调用者会向该函数传入多少个参数，这个时候可变参数就能派上用场。

下面的代码演示了如何使用可变位置参数实现对任意多个数求和的`add`函数，调用函数时传入的参数会保存到一个元组，通过对该元组的遍历，可以获取传入函数的参数。

```python
# 用星号表达式来表示args可以接收0个或任意多个参数
# 调用函数时传入的n个参数会组装成一个n元组赋给args
# 如果一个参数都没有传入，那么args会是一个空元组
def add(*args):
    total = 0
    # 对保存可变参数的元组进行循环遍历
    for val in args:
        # 对参数进行了类型检查（数值型的才能求和）
        if type(val) in (int, float):
            total += val
    return total


# 在调用add函数时可以传入0个或任意多个参数
print(add())         # 0
print(add(1))        # 1
print(add(1, 2, 3))  # 6
print(add(1, 2, 'hello', 3.45, 6))  # 12.45
```

如果我们希望通过“参数名=参数值”的形式传入若干个参数，具体有多少个参数也是不确定的，我们还可以给函数添加可变关键字参数，把传入的关键字参数组装到一个字典中，代码如下所示。

```python
# 参数列表中的**kwargs可以接收0个或任意多个关键字参数
# 调用函数时传入的关键字参数会组装成一个字典（参数名是字典中的键，参数值是字典中的值）
# 如果一个关键字参数都没有传入，那么kwargs会是一个空字典
def foo(*args, **kwargs):
    print(args)
    print(kwargs)


foo(3, 2.1, True, name='骆昊', age=43, gpa=4.95)
```

### 用模块管理函数

在导入模块时，还可以使用`as`关键字对模块进行别名，这样我们可以使用更为简短的完全限定名。

```python
test.py
import module1 as m1
import module2 as m2

m1.foo()  # hello, world!
m2.foo()  # goodbye, world!
```

上面两段代码，我们导入的是定义函数的模块，我们也可以使用`from...import...`语法从模块中直接导入需要使用的函数，代码如下所示。

```python
test.py
from module1 import foo

foo()  # hello, world!

from module2 import foo

foo()  # goodbye, world!
```

### Lambda函数

在使用高阶函数的时候，如果作为参数或者返回值的函数本身非常简单，一行代码就能够完成，也不需要考虑对函数的复用，那么我们可以使用 lambda 函数。Python 中的 lambda 函数是没有的名字函数，所以很多人也把它叫做**匿名函数**，lambda 函数只能有一行代码，代码中的表达式产生的运算结果就是这个匿名函数的返回值。之前的代码中，我们写的`is_even`和`square`函数都只有一行代码，我们可以考虑用 lambda 函数来替换掉它们，代码如下所示。

```python
old_nums = [35, 12, 8, 99, 60, 52]
new_nums = list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, old_nums)))
print(new_nums)  # [144, 64, 3600, 2704]
```

通过上面的代码可以看出，定义 lambda 函数的关键字是`lambda`，后面跟函数的参数，如果有多个参数用逗号进行分隔；冒号后面的部分就是函数的执行体，通常是一个表达式，表达式的运算结果就是 lambda 函数的返回值，不需要写`return` 关键字。

### 装饰器

在 Python 中，使用装饰器很有更为便捷的**语法糖**（编程语言中添加的某种语法，这种语法对语言的功能没有影响，但是使用更加方法，代码的可读性也更强，我们将其称之为“语法糖”或“糖衣语法”），可以用`@装饰器函数`将装饰器函数直接放在被装饰的函数上，效果跟上面的代码相同。我们把完整的代码为大家罗列出来，大家可以再看看我们是如何定义和使用装饰器的。

```python
import random
import time


def record_time(func):

    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f'{func.__name__}执行时间: {end - start:.2f}秒')
        return result

    return wrapper


@record_time
def download(filename):
    print(f'开始下载{filename}.')
    time.sleep(random.random() * 6)
    print(f'{filename}下载完成.')


@record_time
def upload(filename):
    print(f'开始上传{filename}.')
    time.sleep(random.random() * 8)
    print(f'{filename}上传完成.')


download('MySQL从删库到跑路.avi')
upload('Python从入门到住院.pdf')
```

## 面向对象编程

### 定义类

在 Python 语言中，我们可以使用`class`关键字加上类名来定义类，通过缩进我们可以确定类的代码块，就如同定义函数那样。在类的代码块中，我们需要写一些函数，我们说过类是一个抽象概念，那么这些函数就是我们对一类对象共同的动态特征的提取。写在类里面的函数我们通常称之为**方法**，方法就是对象的行为，也就是对象可以接收的消息。方法的第一个参数通常都是`self`，它代表了接收这个消息的对象本身。

```python
class Student:

    def study(self, course_name):
        print(f'学生正在学习{course_name}.')

    def play(self):
        print(f'学生正在玩游戏.')
```

### 创建和使用对象

在我们定义好一个类之后，可以使用构造器语法来创建对象，代码如下所示。

```python
stu1 = Student()
stu2 = Student()
print(stu1)    # <__main__.Student object at 0x10ad5ac50>
print(stu2)    # <__main__.Student object at 0x10ad5acd0> 
print(hex(id(stu1)), hex(id(stu2)))    # 0x10ad5ac50 0x10ad5acd0
```

### 初始化方法

大家可能已经注意到了，刚才我们创建的学生对象只有行为没有属性，如果要给学生对象定义属性，我们可以修改`Student`类，为其添加一个名为`__init__`的方法。在我们调用`Student`类的构造器创建对象时，首先会在内存中获得保存学生对象所需的内存空间，然后通过自动执行`__init__`方法，完成对内存的初始化操作，也就是把数据放到内存空间中。所以我们可以通过给`Student`类添加`__init__`方法的方式为学生对象指定属性，同时完成对属性赋初始值的操作，正因如此，`__init__`方法通常也被称为初始化方法。

我们对上面的`Student`类稍作修改，给学生对象添加`name`（姓名）和`age`（年龄）两个属性。

```python
class Student:
    """学生"""

    def __init__(self, name, age):
        """初始化方法"""
        self.name = name
        self.age = age

    def study(self, course_name):
        """学习"""
        print(f'{self.name}正在学习{course_name}.')

    def play(self):
        """玩耍"""
        print(f'{self.name}正在玩游戏.')
```

### 可见性和属性装饰器

在很多面向对象编程语言中，对象的属性通常会被设置为私有（private）或受保护（protected）的成员，简单的说就是不允许直接访问这些属性；对象的方法通常都是公开的（public），因为公开的方法是对象能够接受的消息，也是对象暴露给外界的调用接口，这就是所谓的访问可见性。在 Python 中，可以通过给对象属性名添加前缀下划线的方式来说明属性的访问可见性，例如，可以用`__name`表示一个私有属性，`_name`表示一个受保护属性，代码如下所示。

```python
class Student:

    def __init__(self, name, age):
        self.__name = name
        self.__age = age

    def study(self, course_name):
        print(f'{self.__name}正在学习{course_name}.')


stu = Student('王大锤', 20)
stu.study('Python程序设计')
print(stu.__name)  # AttributeError: 'Student' object has no attribute '__name'
```

上面代码的最后一行会引发`AttributeError`（属性错误）异常，异常消息为：`'Student' object has no attribute '__name'`。由此可见，以`__`开头的属性`__name`相当于是私有的，在类的外面无法直接访问，但是类里面的`study`方法中可以通过`self.__name`访问该属性。需要说明的是，大多数使用 Python 语言的人在定义类时，通常不会选择让对象的属性私有或受保护，正如有一句名言说的：“**We are all consenting adults here**”（大家都是成年人），成年人可以为自己的行为负责，而不需要通过 Python 语言本身来限制访问可见性。事实上，大多数的程序员都认为**开放比封闭要好**，把对象的属性私有化并非必不可少的东西，所以 Python 语言并没有从语义上做出最严格的限定，也就是说上面的代码如果你愿意，用`stu._Student__name`的方式仍然可以访问到私有属性`__name`，有兴趣的读者可以自己试一试

### 动态属性

Python 语言属于动态语言，维基百科对动态语言的解释是：“在运行时可以改变其结构的语言，例如新的函数、对象、甚至代码可以被引进，已有的函数可以被删除或是其他结构上的变化”。动态语言非常灵活，目前流行的 Python 和 JavaScript 都是动态语言，除此之外，诸如 PHP、Ruby 等也都属于动态语言，而 C、C++ 等语言则不属于动态语言。

在 Python 中，我们可以动态为对象添加属性，这是 Python 作为动态类型语言的一项特权，代码如下所示。需要提醒大家的是，对象的方法其实本质上也是对象的属性，如果给对象发送一个无法接收的消息，引发的异常仍然是`AttributeError`。

```python
class Student:

    def __init__(self, name, age):
        self.name = name
        self.age = age


stu = Student('王大锤', 20)
stu.sex = '男'  # 给学生对象动态添加sex属性
```

如果不希望在使用对象时动态的为对象添加属性，可以使用 Python 语言中的`__slots__`魔法。对于`Student`类来说，可以在类中指定`__slots__ = ('name', 'age')`，这样`Student`类的对象只能有`name`和`age`属性，如果想动态添加其他属性将会引发异常，代码如下所示。

```python
class Student:
    __slots__ = ('name', 'age')

    def __init__(self, name, age):
        self.name = name
        self.age = age


stu = Student('王大锤', 20)
# AttributeError: 'Student' object has no attribute 'sex'
stu.sex = '男'
```

### 静态方法和类方法

之前我们在类中定义的方法都是对象方法，换句话说这些方法都是对象可以接收的消息。除了对象方法之外，类中还可以有静态方法和类方法，这两类方法是发给类的消息，二者并没有实质性的区别。在面向对象的世界里，一切皆为对象，我们定义的每一个类其实也是一个对象，而静态方法和类方法就是发送给类对象的消息。那么，什么样的消息会直接发送给类对象呢？

举一个例子，定义一个三角形类，通过传入三条边的长度来构造三角形，并提供计算周长和面积的方法。计算周长和面积肯定是三角形对象的方法，这一点毫无疑问。但是在创建三角形对象时，传入的三条边长未必能构造出三角形，为此我们可以先写一个方法来验证给定的三条边长是否可以构成三角形，这种方法很显然就不是对象方法，因为在调用这个方法时三角形对象还没有创建出来。我们可以把这类方法设计为静态方法或类方法，也就是说这类方法不是发送给三角形对象的消息，而是发送给三角形类的消息，代码如下所示。

```python
class Triangle(object):
    """三角形"""

    def __init__(self, a, b, c):
        """初始化方法"""
        self.a = a
        self.b = b
        self.c = c

    @staticmethod
    def is_valid(a, b, c):
        """判断三条边长能否构成三角形(静态方法)"""
        return a + b > c and b + c > a and a + c > b

    # @classmethod
    # def is_valid(cls, a, b, c):
    #     """判断三条边长能否构成三角形(类方法)"""
    #     return a + b > c and b + c > a and a + c > b

    def perimeter(self):
        """计算周长"""
        return self.a + self.b + self.c

    def area(self):
        """计算面积"""
        p = self.perimeter() / 2
        return (p * (p - self.a) * (p - self.b) * (p - self.c)) ** 0.5
```

上面的代码使用`staticmethod`装饰器声明了`is_valid`方法是`Triangle`类的静态方法，如果要声明类方法，可以使用`classmethod`装饰器（如上面的代码15~18行所示）。可以直接使用`类名.方法名`的方式来调用静态方法和类方法，二者的区别在于，类方法的第一个参数是类对象本身，而静态方法则没有这个参数。简单的总结一下，**对象方法、类方法、静态方法都可以通过“类名.方法名”的方式来调用，区别在于方法的第一个参数到底是普通对象还是类对象，还是没有接受消息的对象**。静态方法通常也可以直接写成一个独立的函数，因为它并没有跟特定的对象绑定。

这里做一个补充说明，我们可以给上面计算三角形周长和面积的方法添加一个`property`装饰器（Python 内置类型），这样三角形类的`perimeter`和`area`就变成了两个属性，不再通过调用方法的方式来访问，而是用对象访问属性的方式直接获得，修改后的代码如下所示。

```python
class Triangle(object):
    """三角形"""

    def __init__(self, a, b, c):
        """初始化方法"""
        self.a = a
        self.b = b
        self.c = c

    @staticmethod
    def is_valid(a, b, c):
        """判断三条边长能否构成三角形(静态方法)"""
        return a + b > c and b + c > a and a + c > b

    @property
    def perimeter(self):
        """计算周长"""
        return self.a + self.b + self.c

    @property
    def area(self):
        """计算面积"""
        p = self.perimeter / 2
        return (p * (p - self.a) * (p - self.b) * (p - self.c)) ** 0.5


t = Triangle(3, 4, 5)
print(f'周长: {t.perimeter}')
print(f'面积: {t.area}')
```

### 继承和多态

面向对象的编程语言支持在已有类的基础上创建新类，从而减少重复代码的编写。提供继承信息的类叫做父类（超类、基类），得到继承信息的类叫做子类（派生类、衍生类）。例如，我们定义一个学生类和一个老师类，我们会发现他们有大量的重复代码，而这些重复代码都是老师和学生作为人的公共属性和行为，所以在这种情况下，我们应该先定义人类，再通过继承，从人类派生出老师类和学生类，代码如下所示。

```python
class Person:
    """人"""

    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def eat(self):
        print(f'{self.name}正在吃饭.')
    
    def sleep(self):
        print(f'{self.name}正在睡觉.')


class Student(Person):
    """学生"""
    
    def __init__(self, name, age):
        super().__init__(name, age)
    
    def study(self, course_name):
        print(f'{self.name}正在学习{course_name}.')


class Teacher(Person):
    """老师"""

    def __init__(self, name, age, title):
        super().__init__(name, age)
        self.title = title
    
    def teach(self, course_name):
        print(f'{self.name}{self.title}正在讲授{course_name}.')



stu1 = Student('白元芳', 21)
stu2 = Student('狄仁杰', 22)
tea1 = Teacher('武则天', 35, '副教授')
stu1.eat()
stu2.sleep()
tea1.eat()
stu1.study('Python程序设计')
tea1.teach('Python程序设计')
stu2.study('数据科学导论')
```

在子类的初始化方法中，我们可以通过`super().__init__()`来调用父类初始化方法，`super`函数是 Python 内置函数中专门为获取当前对象的父类对象而设计的。从上面的代码可以看出，子类除了可以通过继承得到父类提供的属性和方法外，还可以定义自己特有的属性和方法，所以子类比父类拥有的更多的能力。在实际开发中，我们经常会用子类对象去替换掉一个父类对象，这是面向对象编程中一个常见的行为，也叫做“里氏替换原则”（Liskov Substitution Principle）。

子类继承父类的方法后，还可以对方法进行重写（重新实现该方法），不同的子类可以对父类的同一个方法给出不同的实现版本，这样的方法在程序运行时就会表现出多态行为（调用相同的方法，做了不同的事情）。多态是面向对象编程中最精髓的部分

## 对象的序列化和反序列化

### 读写JSON格式的数据

在Python中，如果要将字典处理成JSON格式（以字符串形式存在），可以使用`json`模块的`dumps`函数，代码如下所示。

```python
import json

my_dict = {
    'name': '骆昊',
    'age': 40,
    'friends': ['王大锤', '白元芳'],
    'cars': [
        {'brand': 'BMW', 'max_speed': 240},
        {'brand': 'Audi', 'max_speed': 280},
        {'brand': 'Benz', 'max_speed': 280}
    ]
}
print(json.dumps(my_dict))

```

运行上面的代码，输出如下所示，可以注意到中文字符都是用Unicode编码显示的。

```python
{"name": "\u9a86\u660a", "age": 40, "friends": ["\u738b\u5927\u9524", "\u767d\u5143\u82b3"], "cars": [{"brand": "BMW", "max_speed": 240}, {"brand": "Audi", "max_speed": 280}, {"brand": "Benz", "max_speed": 280}]}
```

`json`模块有四个比较重要的函数，分别是：

- `dump` - 将Python对象按照JSON格式序列化到文件中
- `dumps` - 将Python对象处理成JSON格式的字符串
- `load` - 将文件中的JSON数据反序列化成对象
- `loads` - 将字符串的内容反序列化成Python对象

### `ujson`

Python标准库中的`json`模块在数据序列化和反序列化时性能并不是非常理想，为了解决这个问题，可以使用三方库`ujson`来替换`json`。

### [`requests`](http://docs.python-requests.org/zh_CN/latest/)

```python
import requests

resp = requests.get('http://api.tianapi.com/guonei/?key=APIKey&num=10')
if resp.status_code == 200:
    data_model = resp.json()
    for news in data_model['newslist']:
        print(news['title'])
        print(news['url'])
        print('-' * 60)
```

