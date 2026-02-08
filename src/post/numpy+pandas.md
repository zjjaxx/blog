## jupyter的基本使用
### 启动

在终端中录入：`jupyter notebook`的指令，按下回车

### cell有两种模式

code：编写代码
markdown：编写笔记

### 快捷键：

- 添加cell：a或者b
- 删除：x
- 执行cell：command+enter
- tab：自动补全
- 代开帮助文档：shift+tab

## numpy模块

NumPy 包的核心是[`ndarray`](https://numpy.org/doc/stable/reference/generated/numpy.ndarray.html#numpy.ndarray)对象。它封装了*n*维同质数据类型数组

NumPy 数组和标准 Python 序列之间存在几个重要的区别：

- 与可以动态增长的 Python 列表不同，NumPy 数组在创建时大小是固定的。更改数组大小[`ndarray`](https://numpy.org/doc/stable/reference/generated/numpy.ndarray.html#numpy.ndarray)会创建一个新数组并删除原数组。
- NumPy 数组中的所有元素必须是相同的数据类型，因此它们在内存中占用的空间大小也相同。例外情况是：数组可以包含对象（Python，包括 NumPy 对象），从而允许数组元素的大小不同。
- NumPy 数组便于对大量数据进行高级数学运算和其他类型的运算。通常情况下，与使用 Python 内置序列相比，这类运算的执行效率更高，代码量也更少。
- 越来越多的基于 Python 的科学和数学软件包开始使用 NumPy 数组；虽然这些软件包通常支持 Python 序列输入，但它们会在处理之前将此类输入转换为 NumPy 数组，并且通常输出 NumPy 数组。换句话说，为了高效地使用当今大部分（甚至可能是绝大多数）基于 Python 的科学/数学软件，仅仅了解如何使用 Python 的内置序列类型是不够的——还需要了解如何使用 NumPy 数组。

#### numpy的创建
- 使用np.array()创建

  ```python
  import numpy as np
  arr = np.array([[1,2,3],[4,5,6]])
  arr
  ```

  ::: tip

  数组是特殊的列表，数组中存储的数据类型必须是统一的类型，Python基础中没有数组的概念,只有list

  :::

- 使用plt创建

  ```python
  import matplotlib.pyplot as plt
  img_arr = plt.imread('./1.jpg')#返回的数组，数组中装载的就是图片内容
  plt.imshow(img_arr)#将numpy数组进行可视化展示
  ```

- 使用np函数创建

  - linespace()

    一维的等差数列 ，个数固定

  - arange()

    一维的等差数列，差值固定

  - random.randint()

    随机数组

#### numpy常用的属性

```python
arr.shape #返回的是数组的形状 （5,6）5行6列 
arr.ndim #返回的是数组的维度 返回2表示二维数组
arr.size #返回数组元素的个数
arr.dtype #返回的是数组元素的类型 通过设置该属性可以改变数组内元素的数据类型，减少内存占用
type(arr) #数组的数据类型 numpy.ndarray
```

#### 索引和切片

和列表的索引一致

```python
arr=np.random.randint(1,100,size=(4,5))
arr[1] # 单行数据
arr[[1,2,3]] # 多行数据
arr[0:2]# 切出arr前2行数据
arr[:,0:2]# 切出arr前2列
arr[::-1]# 将数组的行倒置
arr[:,::-1]#将数组的列倒置
arr[::-1,::-1]# 将数组所有元素都倒置
```

#### 变形reshape

```python
arr.reshape((20))#二维变为一维数组
arr.reshape((2,2,5))#二维变为三维数组
```

#### 级联

将多个numpy数组进行横向或则纵向的拼接

::: tip

必须是同一维度进行级联

:::

```python
np.concatenate((arr,arr),axis=1)# axis=0表示行拼接，axis=1表示列的拼接
```

#### 常用的聚合操作

默认计算所有元素，如何设置了axis，则计算对应的行或列的值

::: tip

axis 0表示每一列，1表示每一行

:::

- sum
- max
- min
- mean

#### 常用的数学函数

- sin
- cos
- tan
- around 四舍五入

#### 常用的统计函数

- median 

  中位数

- std

​		标准差 表示一组数据平均值离散程度的度量

​		公式: std=sqrt(mean((x-x.mean())**2))

- var

  方差 

  公式: var=mean((x-x.mean())**2)

#### 矩阵相关

##### 创建矩阵

```python
np.eye(6) # 返回一个标准的单位矩阵，行列相同，对角线都是1，其余是0
```

##### 转置矩阵

行和列互换

```python 
np.eye(6).T
```

##### 相乘

```python
import numpy as np

a=np.array([
  [2,1],
  [4,3]
])
b=np.array([
  [1,2],
  [1,0]
])
c=np.dot(a,b)

# 结果是
array([[3, 4],
       [7, 8]])
[
  [第一行*第一列，第一行*第二列]
	[第二行*第一列，第二行*第二列]
]

```



numpy.dot(a, b, out=None)

- a : ndarray 数组
- b : ndarray 数组

::: tip

**矩阵的本质就是线性方程式，两者是一一对应关系。**

:::

## pandas

numpy能够帮助我们处理的是数值型的数据，当然在数据分析中除了数值型的数据还有好多其他类型的数据（字符串，时间序列），那么pandas就可以帮我们很好的处理除了数值型的其他数据！

### Series

Series是一种类似与一维数组的对象，由下面两个部分组成：

- values：一组数据（ndarray类型）
- index：相关的数据索引标签

#### Series的创建

```python
from pandas import Series

# data是列表 index用来指定显示索引，不设置默认是数字序号
s = Series(data=[1,2,3,'four'],index=['a','b','c','d'])
# data是numpy数组
s = Series(data=np.random.randint(0,100,size=(3,)))
# data是字典
dic = {
    '语文':100,
    '数学':99,
    '理综':250
}
s = Series(data=dic)
```

#### Series的索引和切片

```python
s[0]
s.语文
s[0:2]
```

#### Series的常用属性

```python
s.shape
s.size
s.index #返回索引
s.values #返回值
s.dtype #元素的类型
```

#### Series的常用方法

- head(3) 

  默认5个

- tail(3)

- unique() 

  去重

- isnull()

  用于判断每一个元素是否为空，为空返回True，否则返回False

- notnull()

::: tip

Series的算术运算

法则：索引一致的元素进行算数运算否则补空

:::

### DataFrame

DataFrame是一个【表格型】的数据结构。DataFrame由按一定顺序排列的多列数据组成。设计初衷是将Series的使用场景从一维拓展到多维。DataFrame既有行索引，也有列索引。

- 行索引：index
- 列索引：columns
- 值：values

#### DataFrame的创建

```python
from pandas import DataFrame
# data是列表 
df = DataFrame(data=[[1,2,3],[4,5,6]])
# data是numpy数组
df = DataFrame(data=np.random.randint(0,100,size=(6,4)))
# data是字典 字典的key作为列索引
dic = {
    'name':['zhangsan','lisi','wanglaowu'],
    'salary':[1000,2000,3000]
}
df = DataFrame(data=dic,index=['a','b','c'])
```

#### DataFrame的属性

```python
df.values
df.columns
df.index
df.shape
```

#### DataFrame索引操作

```python
from pandas import DataFrame

df = DataFrame(data=np.random.randint(60,100,size=(8,4)),columns=['a','b','c','d'])
df['a'] # 取单列，如果df有显示的索引，通过索引机制去行或者列的时候只可以使用显示索引
df[['a','c']] # 取多列
df.loc[0] # 通过显示索引取行
df.loc[[0,1,2]] # 通过显示索引取多行
df.iloc[[0,3,5]] # 通过隐式索引取多行
df.loc[0,'a'] # 通过显示索引取第一行第一列
df.iloc[0,0] # 通过隐式索引取第一行第一列
```

::: tip

尽量用显示索引取，可读性好

:::

#### DataFrame的切片操作

::: tip

索引操作中括号里的是列索引，切片操作中括号里的是行索引

df索引和切片操作

- 索引：
  - df[col]:取列
  - df.loc[index]:取行
  - df.iloc[index,col]:取元素
- 切片：
  - df[index1:index3]:切行
  - df.iloc[:,col1:col3]:切列

:::

```python
# 切行
df[0:2]
#切列
df.iloc[:,0:2]
```

#### DataFrame的运算

- 同Series

#### 时间数据类型的转换

```python
import pandas as pd
dic = {
    'time':['2010-10-10','2011-11-20','2020-01-10'],
    'temp':[33,31,30]
}
df = DataFrame(data=dic)
#将time列的数据类型转换成时间序列类型
df['time'] = pd.to_datetime(df['time'])
df

#将time列作为源数据的行索引
df.set_index('time',inplace=True)
```

