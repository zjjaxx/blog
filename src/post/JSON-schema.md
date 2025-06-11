
## 什么是JSON schema

[官网]()

JSON模式是一种声明性语言，用于注释和验证JSON文档的结构、约束和数据类型。它可以帮助您规范和定义对JSON数据的期望。

![](https://json-schema.org/img/json_schema.svg)

## JSON schema/json有哪些不足

由于 JSON 模式不能包含任意代码，对于数据元素之间某些无法表达的关系存在一定的限制。因此，对于足够复杂的数据格式的任何“验证工具”，可能会有两个验证阶段：一个是模式（或结构）层面，另一个是语义层面。后者的检查可能需要使用更通用的编程语言来实现。

## JSON schema 关键字

### type 

表示类型

### $schema

表明使用的是哪版的JSON schema规范

### $id

$id属性作为每个JSON schema唯一标识符，比如作为版本的概念

```json
{ "$id": "http://yourdomain.com/schemas/myschema.json" }
```

### title和description 

陈述模式（schema）的意图。这些关键字不会对正在验证的数据添加任何约束条件

### properties

当您定义属性时，会创建一个对象，其中每个属性都表示正在验证的JSON数据中的一个键

### exclusiveMinimum

 用于指定一个数值必须**严格大于**某个最小值（即不包含边界值）**Draft 6+ 版本**：需配合 `minimum` 使用，且 `exclusiveMinimum` 为布尔值

### required

将所需的验证关键字添加到模式末尾，即属性对象之后

```json
{
  "properties": {
       ...
       "price": {
         "description": "The price of the product",
         "type": "number",
         "exclusiveMinimum": 0
       },
     },
  "required": [ "productId", "productName", "price" ]
}
```

### items

定义数组中的内容

```json
{
   "tags": {
       "description": "Tags for the product",
       "type": "array",
       "items": {
         "type": "string"
       }
     }
}
```

### minItems

数组最小项

```json
{
	  "tags": {
       "description": "Tags for the product",
       "type": "array",
       "items": {
         "type": "string"
       },
       "minItems": 1
     }
}
```

### uniqueItems

表示数组中每一项都是唯一的

```json
{
  "tags": {
       "description": "Tags for the product",
       "type": "array",
       "items": {
         "type": "string"
       },
       "minItems": 1,
       "uniqueItems": true
     }
}
```

### $ref

引用模式之外的资源

```json
{
  "$id": "https://example.com/geographical-location.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Longitude and Latitude",
  "description": "A geographical coordinate on a planet (most commonly Earth).",
  "required": [ "latitude", "longitude" ],
  "type": "object",
  "properties": {
    "latitude": {
      "type": "number",
      "minimum": -90,
      "maximum": 90
    },
    "longitude": {
      "type": "number",
      "minimum": -180,
      "maximum": 180
    }
  }
}
```

```json
{
  "warehouseLocation": {
      "description": "Coordinates of the warehouse where the product is located.",
      "$ref": "https://example.com/geographical-location.schema.json"
    }
}
```

### `$defs`

将重复使用的模式片段定义在 `$defs` 中，通过 `$ref` 引用，避免多处重复定义。

```json
{
  "$id": "https://example.com/arrays.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Arrays of strings and objects",
  "title": "Arrays",
  "type": "object",
  "properties": {
    "fruits": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "vegetables": {
      "type": "array",
      "items": { "$ref": "#/$defs/veggie" }
    }
  },
  "$defs": {
    "veggie": {
      "type": "object",
      "required": [ "veggieName", "veggieLike" ],
      "properties": {
        "veggieName": {
          "type": "string",
          "description": "The name of the vegetable."
        },
        "veggieLike": {
          "type": "boolean",
          "description": "Do I like this vegetable?"
        }
      }
    }
  }
}


```

### enum

指定一组不同类型的允许值。

```json
{
  "$id": "https://example.com/enumerated-values.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Enumerated Values",
  "type": "object",
  "properties": {
    "data": {
      "enum": [42, true, "hello", null, [1, 2, 3]]
    }
  }
}


```

```json
{
  "data": [1, 2, 3]
}

```

### [pattern](https://json-schema.org/draft/2020-12/json-schema-core.html#name-regular-expressions) 

正则

```json
{
  "$id": "https://example.com/regex-pattern.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Regular Expression Pattern",
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "pattern": "^[A-Z]{3}-\\d{3}$"
    }
  }
}


```

### dependentRequired

依赖关系

```json
{
  "$id": "https://example.com/conditional-validation-dependentRequired.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Conditional Validation with dependentRequired",
  "type": "object",
  "properties": {
    "foo": {
      "type": "boolean"
    },
    "bar": {
      "type": "string"
    }
  },
  "dependentRequired": {
    "foo": ["bar"]
  }
}


```

在此示例中，dependentRequired 关键字用于指定当属性 foo 存在时，属性 bar 是必需的。该模式强制执行这样一种条件：如果存在 foo，那么 bar 也必须存在。

### dependentSchemas

它允许定义一个子模式，如果存在某个特定属性，则必须满足该子模式。

```json
{
  "$id": "https://example.com/conditional-validation-dependentSchemas.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Conditional Validation with dependentSchemas",
  "type": "object",
  "properties": {
    "foo": {
      "type": "boolean"
    },
    "propertiesCount": {
      "type": "integer",
      "minimum": 0
    }
  },
  "dependentSchemas": {
    "foo": {
      "required": ["propertiesCount"],
      "properties": {
        "propertiesCount": {
          "minimum": 7
        }
      }
    }
  }
}


```

 根据子模式，当存在 foo 属性时，propertiesCount 属性变为必需，并且必须是整数，最小值为 7。

```json
{
  "propertiesCount": 5
}


```

在上述数据中，propertiesCount（属性计数）为 5，但由于缺少 foo（此处 foo 可能是特定的某个元素或属性等，需结合上下文明确），所以 propertiesCount 不需要是 7 或者大于 7，它只需要大于或等于 0 即可。因此，这个实例是有效的 。

### [if](https://json-schema.org/draft/2020-12/json-schema-core.html#section-10.2.2.1), [then](https://json-schema.org/draft/2020-12/json-schema-core.html#name-then), and [else](https://json-schema.org/draft/2020-12/json-schema-core.html#name-else).

```json
{
  "$id": "https://example.com/conditional-validation-if-else.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Conditional Validation with If-Else",
  "type": "object",
  "properties": {
    "isMember": {
      "type": "boolean"
    },
    "membershipNumber": {
      "type": "string"
    }
  },
  "required": ["isMember"],
  "if": {
    "properties": {
      "isMember": {
        "const": true
      }
    }
  },
  "then": {
    "properties": {
      "membershipNumber": {
        "type": "string",
        "minLength": 10,
        "maxLength": 10
      }
    }
  },
  "else": {
    "properties": {
      "membershipNumber": {
        "type": "string",
        "minLength": 15
      }
    }
  }
}



```

如果isMember的值为真：
• 则应用then块，该块指定membershipNumber属性应该是一个长度最短为10且最长为10的字符串。
如果isMember的值不是真：
• 则应用else块，该块指定membershipNumber属性可以是任何字符串。

### multipleOf

使用multipleOf关键字可以将数字限制为给定数字的倍数。它可以设置为任何正数。

```json
{
  "type": "number",
  "multipleOf" : 10
}


```



### allOf

给定的数据必须符合所有给定的子模式。

```json
{
  "allOf": [
    { "type": "string" },
    { "maxLength": 5 }
  ]
}


```

### anyOf

给定的数据必须针对给定的子模式中的任何一个（一个或多个）有效。

```json
{
  "anyOf": [
    { "type": "string", "maxLength": 5 },
    { "type": "number", "minimum": 0 }
  ]
}


```

### oneOf

给定的数据必须恰好针对给定的子模式中的一个有效。

```josn
{
  "oneOf": [
    { "type": "number", "multipleOf": 5 },
    { "type": "number", "multipleOf": 3 }
  ]
}


```

5和3的公倍数将被拒绝。

### not

“not”关键字声明一个实例如果不符合给定的子模式，则进行验证

```json
{ "not": { "type": "string" } }

```

### Factoring Schemas

可以“提取”出子模式中的公共部分。以下两个模式是等效的

```json
{
  "oneOf": [
    { "type": "number", "multipleOf": 5 },
    { "type": "number", "multipleOf": 3 }
  ]
}


```

```json
{
  "type": "number",
  "oneOf": [
    { "multipleOf": 5 },
    { "multipleOf": 3 }
  ]
}


```

### additionalProperties

“additionalProperties”关键字用于控制额外内容的处理，即属性名称未列在“properties”关键字中或与“patternProperties”关键字中的任何正则表达式不匹配的属性。默认情况下，允许任何额外属性。

```json
{
  "type": "object",
  "properties": {
    "number": { "type": "number" },
    "street_name": { "type": "string" },
    "street_type": { "enum": ["Street", "Avenue", "Boulevard"] }
  },
  "additionalProperties": { "type": "string" }
}


```

你可以使用非布尔模式对实例的附加属性设置更复杂的约束条件。例如，可以允许存在附加属性，但前提是它们的值必须均为字符串