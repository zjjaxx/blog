## 介绍

假设你有一些源代码。你想对它进行一些***轻微的***修改——替换一些字符，用页眉和页脚包装它等等——理想情况下，你希望在最后生成一个源映射。基于以上场景，magic-string 它是一个小巧、快速的工具，用于操作字符串和生成源映射。

## 使用示例

```js
import MagicString from 'magic-string';
import fs from 'fs';

const s = new MagicString('myName = lumozx');

s.update(0, 6, 'thisIsMyName');
console.log(s.toString()); // 'thisIsMyName = lumozx'

s.update(9, 15, 'lin');
console.log(s.toString()); // 'thisIsMyName = lin'

s.prepend('const ').append(';');
console.log(s.toString()); // 'const thisIsMyName = lin;'

s.update(9, 15, 'alice');
console.log(s.toString()); // 'const thisIsMyName = alice;'

const map = s.generateMap({
	source: 'source.js',
	file: 'converted.js.map',
	includeContent: true,
}); // generates a v3 sourcemap

fs.writeFileSync('converted.js', s.toString());
fs.writeFileSync('converted.js.map', map.toString());

```

::: tip

- 区间选择遵循"左闭右开"的概念，也就是选择范围包含左边的值，但不包括右边的值。

- 支持链式调用。

- 区间会自动加入`offset`计算，比如已经使用了`prepend`和`append`给**开头**和**结尾**加入了多个字符，之后使用`update`变更字符串，依然可以使用原始区间，这样省略了自己去计算`offset`的步骤。

可以生成v3版本的`sourcemap`。

:::

## 常用方法

### s.update( start, end, content[, options] )

将字符从开始到结束替换为指定内容。

### s.overwrite( start, end, content[, options] )

`overwrite`实际上是`update`的封装。

所以`overwrite`与`update`不同点在于调用`chunk.edit`，默认情况下，`overwrite`会自动清除`chunk`的前缀和后缀。

### s.append( content )

将指定内容追加到字符串末尾。返回此对象。

### s.prepend( content )

在字符串前添加指定内容。返回此对象。

### appendRight、appendLeft、prependLeft、prependRight区别

[动机](https://github.com/Rich-Harris/magic-string/issues/109)

::: tip

这里理解起来有点费脑

其实每次添加都会把字符串按传入的索引(slice分割，左闭右开 )分成2个chunk,上面的4个api的left和right都是针对于这2个chunk来说的

每个Chunk返回的结构

```js
	toString() {
		return this.intro + this.content + this.outro;
	}
```

- prependLeft 指的是对左边chunk的outro添加内容，规则为:

  ```js
  prependLeft(content) {
  	this.outro = content + this.outro;
  }
  ```

- appendLeft指的是对左边chunk的outro添加内容，规则为:

  ```js
  appendLeft(content) {
    this.outro += content;
  }
  ```

- prependRight指的是对右边chunk的intro添加内容，规则为:

  ```js
  prependRight(content) {
  		this.intro = content + this.intro;
  }
  ```

- appendRight指的是对右边chunk的intro添加内容，规则为:

  ```js
  appendRight(content) {
  		this.intro = this.intro + content;
  }
  ```

:::

### s.clone()

克隆

### s.replace( regexpOrString, substitution )

使用正则表达式或字符串进行替换。使用正则表达式时，还支持替换函数。返回此对象。

与String.replace的区别：

-  它总是匹配原始字符串

- 它会改变magic string的状态（使用.clone()可实现不可变）

### s.replaceAll( regexpOrString, substitution )

与 s.replace 类似，但会替换所有匹配的字符串，而不仅是一个。如果 regexpOrString 是一个正则表达式，则必须设置全局 (g) 标志，否则会抛出 TypeError。匹配内置 String.property.replaceAll 的行为。返回 this。

### s.remove( start, end )

从开始到结束（针对原始字符串，而非生成的字符串）移除字符。同时也会清空chunk.intro、chunk.outro值

### s.slice( start, end )

返回生成的字符串中与原始字符串起始和结束位置对应的切片内容,会先定位哪个chunk，然后返回该chunk 的`this.intro + this.content + this.outro;`内容

### snip( start, end )

返回原字符串s的一个克隆版本，其中移除了原字符串起始和结束字符之前的所有内容。

```js
	snip(start, end) {
		const clone = this.clone();
		clone.remove(0, start);
		clone.remove(end, clone.original.length);

		return clone;
	}
```

