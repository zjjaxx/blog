## jupyter的基本使用
### 启动

在终端中录入：`jupyter notebook`的指令，按下回车

### cell有两种模式

code：编写代码
markdown：编写笔记

### 快捷键：

- 添加cell：a或者b
- 删除：x
- 修改cell的模式：
- m：修改成markdown模式
- y：修改成code模式
- 执行cell：shift+enter
- tab：自动补全
- 代开帮助文档：shift+tab

## numpy模块

NumPy(Numerical Python) 是 Python 语言中做科学计算的基础库。重在于数值计算，也是大部分Python科学计算库的基础，多用于在大型、多维数组上执行的数值运算。

#### numpy的创建
- 使用np.array()创建

  ```python
  import numpy as np
  arr = np.array([[1,2,3],[4,5,6]])
  arr
  ```

  ::: tip

  数组是特殊的列表，数组中存储的数据类型必须是统一的类型，Python基础中没有数组的概念

  :::

- 使用plt创建

  ```python
  import matplotlib.pyplot as plt
  img_arr = plt.imread('./1.jpg')#返回的数组，数组中装载的就是图片内容
  plt.imshow(img_arr)#将numpy数组进行可视化展示
  ```

- 使用np的routines函数创建

#### numpy常用的属性

```python
arr.shape #返回的是数组的形状
arr.ndim #返回的是数组的维度
arr.size #返回数组元素的个数
arr.dtype #返回的是数组元素的类型
type(arr) #数组的数据类型
```

#### 索引和切片

和列表的索引一致

```python
arr=np.random.randint(1,100,size=(4,5))
arr[[1,2,3]] # 多行数据
arr[0:2]# 切出arr前2行数据
arr[:,0:2]# 切出arr前2列
arr[::-1]# 将数组的行倒置
arr[:,::-1]#将数组的列倒置
arr[::-1,::-1]# 将数组所有元素都倒置
```

#### 变形reshape

```python
arr.reshape((20))#变为一维数组
arr.reshape((2,2,5))#变为三维数组
```

#### 级联

将多个numpy数组进行横向或则纵向的拼接

::: tip

必须是同一维度进行级联

:::

```python
np.concatenate((arr,arr),axis=1)# axis=0表示纵向拼接，axis=1表示横向的拼接
```

