## Django

## 配置PyCharm

- 配置PyCharm的Python环境为anaconda
- 设置字体大小

## 新建项目

- 在anaconda环境中安装Django

- 初始化项目

  ```bash
  django-admin startproject mysite djangotutorial
  ```

- 新建应用模块

  ::: tip

  Python项目里可以有多个应用模块管理不同功能

  :::

  ```bash
  python manage.py startapp polls
  ```

- 配置应用URL和编写view视图

  ::: tip

  每个应用模块管理自己的URL

  :::

  ```python
  # polls/urls.py
  from django.urls import path
  
  from . import views
  
  urlpatterns = [
      path("", views.index, name="index"),
  ]
  ```

- 在根项目的URL中配置应用的URL

  ::: tip

  每个应用有自己不同的URL，根应用URL管理全部应用的URL

  :::

  ```python
  from django.contrib import admin
  from django.urls import include, path
  
  urlpatterns = [
      path("polls/", include("polls.urls")),
      path("admin/", admin.site.urls),
  ]
  ```

  [`path()`](https://docs.djangoproject.com/zh-hans/6.0/ref/urls/#django.urls.path) 函数至少需要两个参数：`route` 和 `view`。[`include()`](https://docs.djangoproject.com/zh-hans/6.0/ref/urls/#django.urls.include) 函数允许引用其他 URLconfs。每当 Django 遇到 [`include()`](https://docs.djangoproject.com/zh-hans/6.0/ref/urls/#django.urls.include) 时，它会截断 URL 中匹配到该点的部分，并将剩余的字符串发送到包含的 URLconf 以进行进一步处理

## 数据库配置

在根项目的setting文件中配置数据库，默认情况下，[`DATABASES`](https://docs.djangoproject.com/zh-hans/6.0/ref/settings/#std-setting-DATABASES) 配置使用 SQLite。

### 设置时区

```python
TIME_ZONE = "Asia/Shanghai"
```

## 应用管理

[`INSTALLED_APPS`](https://docs.djangoproject.com/zh-hans/6.0/ref/settings/#std-setting-INSTALLED_APPS) 设置项。这里包括了会在你项目中启用的所有 Django 应用。应用能在多个项目中使用，你也可以打包并且发布应用，让别人使用它们。

通常， [`INSTALLED_APPS`](https://docs.djangoproject.com/zh-hans/6.0/ref/settings/#std-setting-INSTALLED_APPS) 默认包括了以下 Django 的自带应用：

- [`django.contrib.admin`](https://docs.djangoproject.com/zh-hans/6.0/ref/contrib/admin/#module-django.contrib.admin) -- 管理员站点， 你很快就会使用它。
- [`django.contrib.auth`](https://docs.djangoproject.com/zh-hans/6.0/topics/auth/#module-django.contrib.auth) -- 认证授权系统。
- [`django.contrib.contenttypes`](https://docs.djangoproject.com/zh-hans/6.0/ref/contrib/contenttypes/#module-django.contrib.contenttypes) -- 内容类型框架。
- [`django.contrib.sessions`](https://docs.djangoproject.com/zh-hans/6.0/topics/http/sessions/#module-django.contrib.sessions) -- 会话框架。
- [`django.contrib.messages`](https://docs.djangoproject.com/zh-hans/6.0/ref/contrib/messages/#module-django.contrib.messages) -- 消息框架。
- [`django.contrib.staticfiles`](https://docs.djangoproject.com/zh-hans/6.0/ref/contrib/staticfiles/#module-django.contrib.staticfiles) -- 管理静态文件的框架。

## 创建模型

在这个投票应用中，需要创建两个模型：问题 `Question` 和选项 `Choice`。`Question` 模型包括问题描述和发布时间。`Choice` 模型有两个字段，选项描述和当前得票数。每个选项属于一个问题。

这些概念可以通过一个 Python 类来描述。按照下面的例子来编辑 `polls/models.py` 文件：

模型准确且唯一的描述了数据。它包含您储存的数据的重要字段和行为。一般来说，每一个模型都映射一张数据库表。

```python
# polls/models.py
from django.db import models


class Question(models.Model):
    question_text = models.CharField(max_length=200)
    pub_date = models.DateTimeField("date published")


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    choice_text = models.CharField(max_length=200)
    votes = models.IntegerField(default=0)
```

注意在最后，我们使用 [`ForeignKey`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/fields/#django.db.models.ForeignKey) 定义了一个关系。这将告诉 Django，每个 `Choice` 对象都关联到一个 `Question` 对象。Django 支持所有常用的数据库关系：多对一、多对多和一对一。

## 激活模型

上面的一小段用于创建模型的代码给了 Django 很多信息，通过这些信息，Django 可以：

- 为这个应用创建数据库 schema（生成 `CREATE TABLE` 语句）。
- 创建可以与 `Question` 和 `Choice` 对象进行交互的 Python 数据库 API。

但是首先得把 `polls` 应用安装到我们的项目里。一旦你定义了你的模型，你需要告诉 Django 你准备 *使用* 这些模型。这是为了能够做数据库生成和迁移

::: tip

Django 应用是“可插拔”的。你可以在多个项目中使用同一个应用。除此之外，你还可以发布自己的应用，因为它们并不会被绑定到当前安装的 Django 上。

:::

为了在我们的工程中包含这个应用，我们需要在配置类 [`INSTALLED_APPS`](https://docs.djangoproject.com/zh-hans/6.0/ref/settings/#std-setting-INSTALLED_APPS) 中添加设置。因为 `PollsConfig` 类写在文件 `polls/apps.py` 中，所以它的点式路径是 `'polls.apps.PollsConfig'`。在文件 `mysite/settings.py` 中 [`INSTALLED_APPS`](https://docs.djangoproject.com/zh-hans/6.0/ref/settings/#std-setting-INSTALLED_APPS) 子项添加点式路径后，它看起来像这样：

```python
# mysite/settings.py¶
INSTALLED_APPS = [
    "polls.apps.PollsConfig",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]
```

现在你的 Django 项目会包含 `polls` 应用。接着运行下面的命令：

```bash
python manage.py makemigrations polls
```

通过运行 `makemigrations` 命令，Django 会检测你对模型文件的修改（在这种情况下，你已经取得了新的），并且把修改的部分储存为一次 *迁移*。

现在，再次运行 [`migrate`](https://docs.djangoproject.com/zh-hans/6.0/ref/django-admin/#django-admin-migrate) 命令，在数据库里创建新定义的模型的数据表：

```python
python manage.py migrate
```

这个 [`migrate`](https://docs.djangoproject.com/zh-hans/6.0/ref/django-admin/#django-admin-migrate) 命令选中所有还没有执行过的迁移（Django 通过在数据库中创建一个特殊的表 `django_migrations` 来跟踪执行过哪些迁移）并应用在数据库上 - 也就是将你对模型的更改同步到数据库结构上。

## 模型字段

#### 字段类型

模型中每一个字段都应该是某个 [`Field`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field) 类的实例， Django 利用这些字段类来实现以下功能：

你可以在 [模型字段参考](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#model-field-types) 中看到完整列表

##### 常用的字段列表

######  `AutoField`

一个 [`IntegerField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.IntegerField)，根据可用的 ID 自动递增。你通常不需要直接使用它；如果你没有指定，主键字段会自动添加到你的模型中。

###### `BooleanField`

一个 true／false 字段。

###### `CharField`

一个字符串字段，适用于小到大的字符串。

对于大量的文本，使用 [`TextField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.TextField)。

[`CharField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.CharField) 具有以下额外参数：CharField.max_length

###### `DateField`

- DateField.auto_now

  每次保存对象时，自动将该字段设置为现在。对于“最后修改”的时间戳很有用。请注意，当前日期 *总是* 被使用，而不仅仅是一个你可以覆盖的默认值。只有在调用 [`Model.save()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/instances/#django.db.models.Model.save) 时，该字段才会自动更新。当以其他方式对其他字段进行更新时，如 [`QuerySet.update()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.update)，该字段不会被更新，尽管你可以在这样的更新中为该字段指定一个自定义值。

- DateField.auto_now_add

  当第一次创建对象时，自动将该字段设置为现在。对创建时间戳很有用。请注意，当前日期是 *始终* 使用的；它不是一个你可以覆盖的默认值。因此，即使你在创建对象时为该字段设置了一个值，它也会被忽略。

###### `DateTimeField`

一个日期和时间，在 Python 中用一个 `datetime.datetime` 实例表示。与 [`DateField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.DateField) 一样，使用相同的额外参数。

###### `EmailField`

一个 [`CharField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.CharField)，使用 [`EmailValidator`](https://docs.djangoproject.com/zh-hans/5.2/ref/validators/#django.core.validators.EmailValidator) 来检查该值是否为有效的电子邮件地址。

###### `FloatField`

在 Python 中用一个 `float` 实例表示的浮点数。

###### `IntegerField`

一个整数。其值仅允许在特定范围内（取决于数据库）。在Django支持的所有数据库中，-2147483648到2147483647之间的值都是兼容的

###### `JSONField`

一个用于存储 JSON 编码数据的字段。

###### `TextField`

一个大的文本字段。

###### `TimeField`

一个时间，

###### `URLField`

该字段的默认表单部件是一个 [`URLInput`](https://docs.djangoproject.com/zh-hans/5.2/ref/forms/widgets/#django.forms.URLInput)。

###### `UUIDField`

通用唯一标识符是 [`primary_key`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.primary_key) 的 [`AutoField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.AutoField) 的一个很好的替代方案。数据库不会为你生成 UUID，所以建议使用 [`default`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.default) ：

```python
import uuid
from django.db import models


class MyUUIDModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # other fields
```

##### 关系字段

###### ForeignKey

多对一关系。需要两个位置参数：模型关联的类和 [`on_delete`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ForeignKey.on_delete) 选项：

```python
from django.db import models


class Manufacturer(models.Model):
    name = models.TextField()


class Car(models.Model):
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.CASCADE)
```

第一个位置参数可以是具体模型类或对模型类的 [延迟引用](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#lazy-relationships)。还支持 [递归关系](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#recursive-relationships)，即模型与自身的关系。

第二个位置参数级联删除。Django模拟了SQL约束ON DELETE CASCADE的行为，并且还会删除包含ForeignKey的对象。

###### `ManyToManyField`

一个多对多的关系。需要一个位置参数：模型相关的类，它的工作原理与 [`ForeignKey`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ForeignKey) 完全相同，包括 [递归](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#recursive-relationships) 和 [惰性](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#lazy-relationships) 关系。

###### `OneToOneField`

一对一的关系。

#### 字段选项

下面介绍一部分经常用到的通用参数：

##### [`null`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.null)

如果设置为 `True`，当该字段为空时，Django 会将数据库中该字段设置为 `NULL`。默认为 `False` 。

##### [`blank`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.blank)

如果设置为 `True`，该字段允许为空。默认为 `False`。

请注意，这与 [`null`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.null) 不同。[`null`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.null) 完全与数据库相关联，而 [`blank`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.blank) 与验证有关。如果字段具有 [`blank=True`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.blank)，表单验证将允许输入空值。如果字段具有 [`blank=False`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.blank)，则字段为必填项。

##### [`choices`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.choices)

一个由二元组组成的序列、映射、枚举类型或可调用对象（无需参数并返回上述任意格式），用作该字段的选项。如果提供了此参数，默认的表单控件将变为选择框而非标准文本框，并将选项限制为给定的选项

```python
YEAR_IN_SCHOOL_CHOICES = [
    ("FR", "Freshman"),
    ("SO", "Sophomore"),
    ("JR", "Junior"),
    ("SR", "Senior"),
    ("GR", "Graduate"),
]
```

每个二元组的第一个值会储存在数据库中，而第二个值将只会用于在表单中显示。

对于一个模型实例，要获取该字段二元组中相对应的第二个值，使用 [`get_FOO_display()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/instances/#django.db.models.Model.get_FOO_display) 方法。例如：

```python
from django.db import models


class Person(models.Model):
    SHIRT_SIZES = {
        "S": "Small",
        "M": "Medium",
        "L": "Large",
    }
    name = models.CharField(max_length=60)
    shirt_size = models.CharField(max_length=1, choices=SHIRT_SIZES)
```

```python
>>> p = Person(name="Fred Flintstone", shirt_size="L")
>>> p.save()
>>> p.shirt_size
'L'
>>> p.get_shirt_size_display()
'Large'
```

##### [`default`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.default)

该字段的默认值。可以是一个值或者是个可调用的对象，如果是个可调用对象，每次实例化模型时都会调用该对象。

##### [`primary_key`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.primary_key)

如果设置为 `True` ，将该字段设置为该模型的主键

##### [`unique`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.unique)

如果设置为 `True`，这个字段的值必须在整个表中保持唯一。

#### 字段备注名

除了 [`ForeignKey`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ForeignKey)， [`ManyToManyField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ManyToManyField) 和 [`OneToOneField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.OneToOneField)，任何字段类型都接收一个可选的位置参数 [`verbose_name`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.Field.verbose_name)，如果未指定该参数值， Django 会自动使用字段的属性名作为该参数值，并且把下划线转换为空格。

```python
first_name = models.CharField("person's first name", max_length=30)
```

#### `Meta` 选项

使用内部 `Meta类` 来给模型赋予元数据，就像：

```python
from django.db import models


class Ox(models.Model):
    horn_length = models.IntegerField()

    class Meta:
        ordering = ["horn_length"]
        verbose_name_plural = "oxen"

```

模型的元数据即“所有不是字段的东西”，比如排序选项（ [`ordering`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/options/#django.db.models.Options.ordering) ），数据库表名（ [`db_table`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/options/#django.db.models.Options.db_table) ），或是阅读友好的单复数名（ [`verbose_name`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/options/#django.db.models.Options.verbose_name) 和 [`verbose_name_plural`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/options/#django.db.models.Options.verbose_name_plural) ）。这些都不是必须的，并且在模型当中添加 `Meta类` 也完全是可选的

在 [模型可选参数参考](https://docs.djangoproject.com/zh-hans/5.2/ref/models/options/) 中列出了 `Meta` 可使用的全部选项。

#### 模型属性

模型当中最重要的属性是 [`Manager`](https://docs.djangoproject.com/zh-hans/5.2/topics/db/managers/#django.db.models.Manager)。它是 Django 模型和数据库查询操作之间的接口，并且它被用作从数据库当中 [获取实例](https://docs.djangoproject.com/zh-hans/5.2/topics/db/queries/#retrieving-objects)，如果没有指定自定义的 `Manager` 默认名称是 [`objects`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/class/#django.db.models.Model.objects)。Manager 只能通过模型类来访问，不能通过模型实例来访问。

在模型中添加自定义方法会给你的对象提供自定义的“行级”操作能力。与之对应的是类 [`Manager`](https://docs.djangoproject.com/zh-hans/5.2/topics/db/managers/#django.db.models.Manager) 的方法意在提供“表级”的操作，模型方法应该在某个对象实例上生效。

## 数据库操作

一旦创建 [数据模型](https://docs.djangoproject.com/zh-hans/5.2/topics/db/models/) 后，Django 自动给予你一套数据库抽象 API，允许你创建，检索，更新和删除对象。

#### 将修改保存至对象

```python
>>> from blog.models import Blog, Entry
>>> entry = Entry.objects.get(pk=1)
>>> cheese_blog = Blog.objects.get(name="Cheddar Talk")
>>> entry.blog = cheese_blog
>>> entry.save()
```

更新 [`ManyToManyField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ManyToManyField) 有一些不同之处——可以使用字段上的 [`add()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/relations/#django.db.models.fields.related.RelatedManager.add) 方法来添加一个记录到关系中。这个示例将 `Author` 实例 `joe` 添加到 `entry` 对象中：

```python
>>> from blog.models import Author
>>> joe = Author.objects.create(name="Joe")
>>> entry.authors.add(joe)
```

要一次性添加多个记录到 [`ManyToManyField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ManyToManyField)，在调用 [`add()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/relations/#django.db.models.fields.related.RelatedManager.add) 时包括多个参数，如下所示：

```python
>>> john = Author.objects.create(name="John")
>>> paul = Author.objects.create(name="Paul")
>>> george = Author.objects.create(name="George")
>>> ringo = Author.objects.create(name="Ringo")
>>> entry.authors.add(john, paul, george, ringo)
```

#### 检索对象

::: tip

| **方法**   | **返回类型**       | **查询条件**       | **结果数量** | **异常处理**              |
| ---------- | ------------------ | ------------------ | ------------ | ------------------------- |
| `get()`    | 单个模型实例       | 必须唯一匹配       | 1 条         | 无结果或多余结果时抛异常  |
| `all()`    | QuerySet（查询集） | 无条件（默认全表） | 所有记录     | 不抛异常，返回空 QuerySet |
| `filter()` | QuerySet（查询集） | 指定过滤条件       | 0 或多条     | 不抛异常，返回空 QuerySe  |

:::

要从数据库检索对象，要通过模型类的 [`Manager`](https://docs.djangoproject.com/zh-hans/5.2/topics/db/managers/#django.db.models.Manager) 构建一个 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)。

一个 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 代表来自数据库中对象的一个集合。它可以有 0 个，1 个或者多个 *filters*. Filters，可以根据给定参数缩小查询结果量。在 SQL 的层面上， [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 对应 `SELECT` 语句，而*filters*对应类似 `WHERE` 或 `LIMIT` 的限制子句。

通过使用你的模型的 [`Manager`](https://docs.djangoproject.com/zh-hans/5.2/topics/db/managers/#django.db.models.Manager)，你可以获得一个 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)。每个模型至少有一个 [`Manager`](https://docs.djangoproject.com/zh-hans/5.2/topics/db/managers/#django.db.models.Manager)，默认情况下称为 [`objects`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/class/#django.db.models.Model.objects)。可以直接通过模型类来访问它，如下所示：

```python
>>> Blog.objects
<django.db.models.manager.Manager object at ...>
>>> b = Blog(name="Foo", tagline="Bar")
>>> b.objects
Traceback:
    ...
AttributeError: "Manager isn't accessible via Blog instances."
```

##### 检索全部对象

从表中检索对象的最简单方法是获取所有对象。要做到这一点，可以在 [`Manager`](https://docs.djangoproject.com/zh-hans/5.2/topics/db/managers/#django.db.models.Manager) 上使用 [`all()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.all) 方法：

```python
>>> all_entries = Entry.objects.all()
```

##### 通过过滤器检索指定对象

- `filter(**kwargs)`

  返回一个新的 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)，包含的对象满足给定查询参数。

- `exclude(**kwargs)`

  返回一个新的 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)，包含的对象 *不* 满足给定查询参数。

查询参数（`**kwargs`）应该符合下面的 [Field lookups](https://docs.djangoproject.com/zh-hans/5.2/topics/db/queries/#field-lookups) 的要求。

例如，要包含获取 2006 年的博客条目（entries blog）的 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)，像这样使用 [`filter()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.filter):

```python
Entry.objects.filter(pub_date__year=2006)
```

通过默认管理器类也一样:

```python
Entry.objects.all().filter(pub_date__year=2006)
```

##### 链式过滤器

对 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 进行细化的结果本身也是一个 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)，因此可以将细化操作链接在一起。例如：

```python
>>> Entry.objects.filter(headline__startswith="What").exclude(
...     pub_date__gte=datetime.date.today()
... ).filter(pub_date__gte=datetime.date(2005, 1, 30))

```

这个先获取包含数据库所有条目（entry）的 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)，然后排除一些，再进入另一个过滤器。最终的 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 包含标题以 "What" 开头的，发布日期介于 2005 年 1 月 30 日与今天之间的所有条目。

##### 每个 `QuerySet` 都是唯一的

每次你细化一个 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)，都会得到一个新的、完全不受之前 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 影响的 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)。每一次细化都创建了一个独立且不同的 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)，它可以被存储、使用和重复利用。

```python
>>> q1 = Entry.objects.filter(headline__startswith="What")
>>> q2 = q1.exclude(pub_date__gte=datetime.date.today())
>>> q3 = q1.filter(pub_date__gte=datetime.date.today())
```

##### `QuerySet` 是惰性的[¶](https://docs.djangoproject.com/zh-hans/5.2/topics/db/queries/#querysets-are-lazy)

QuerySet对象是惰性的——创建QuerySet并不会立即执行任何数据库操作。你可以整天叠加各种过滤器，但Django实际上要等到QuerySet被求值时才会运行查询。看看这个例子

```python
>>> q = Entry.objects.filter(headline__startswith="What")
>>> q = q.filter(pub_date__lte=datetime.date.today())
>>> q = q.exclude(body_text__icontains="food")
>>> print(q)
```

虽然这看起来像是三次数据库操作，实际上只在最后一行 (`print(q)`) 做了一次。一般来说， [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 的结果直到你 “要使用” 时才会从数据库中拿出。当你要用时，才通过数据库 *计算* 出 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)。关于何时才真的执行计算的更多细节，参考 [什么时候 QuerySet 被执行](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#when-querysets-are-evaluated)。

##### 用 `get()` 检索单个对象[¶](https://docs.djangoproject.com/zh-hans/5.2/topics/db/queries/#retrieving-a-single-object-with-get)

[`filter()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.filter) 总是返回一个 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet)，即便只有一个对象满足查询条件 —— 这种情况下， [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 只包含了一个元素。

如果你知道只有一个对象符合你的查询条件，你可以在 [`Manager`](https://docs.djangoproject.com/zh-hans/5.2/topics/db/managers/#django.db.models.Manager) 上使用 [`get()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.get) 方法，它会直接返回该对象

```python
>>> one_entry = Entry.objects.get(pk=1)
```

你可以对 [`get()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.get) 使用与 [`filter()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.filter) 类似的所有查询表达式 —— 同样的，参考下面的 [Field lookups](https://docs.djangoproject.com/zh-hans/5.2/topics/db/queries/#field-lookups)。

##### 其它 `QuerySet` 方法

###### 限制 `QuerySet` 条目数

利用 Python 的数组切片语法将 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 切成指定长度。这等价于 SQL 的 `LIMIT` 和 `OFFSET` 子句。

例如，这返回前5个对象（`LIMIT 5`）

```python
>>> Entry.objects.all()[:5]
```

这返回第六到第十个对象（`OFFSET 5 LIMIT 5`）：

```python
>>> Entry.objects.all()[5:10]
```

###### 字段查询

字段查询即你如何制定 SQL `WHERE` 子句。它们以关键字参数的形式传递给 [`QuerySet`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet) 方法 [`filter()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.filter)， [`exclude()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.exclude) 和 [`get()`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#django.db.models.query.QuerySet.get)。

基本的查找关键字参数采用形式 `field__lookuptype=value` （使用双下划线）。例如：

```python
>>> Entry.objects.filter(pub_date__lte="2006-01-01")
```

转换为 SQL 语句大致如下：

```python
SELECT * FROM blog_entry WHERE pub_date <= '2006-01-01';
```

查询子句中指定的字段必须是模型的一个字段名。不过也有个例外，在 [`ForeignKey`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ForeignKey) 中，你可以指定以 `_id` 为后缀的字段名。这种情况下，value 参数需要包含 foreign 模型的主键的原始值。例子：

```python
>>> Entry.objects.filter(blog_id=4)
```

以下是一些常见的查询：

- [`exact`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#std-fieldlookup-exact)

  一个 "exact" 匹配。例如

  ```python
  >>> Entry.objects.get(headline__exact="Cat bites dog")
  ```

  会生成这些 SQL：

  ```python
  SELECT ... WHERE headline = 'Cat bites dog';
  ```

  若你未提供查询类型 —— 也就说，若关键字参数未包含双下划线 —— 查询类型会被指定为 `exact`。

  例如，以下两个语句是等价的：

  ```python
  >>> Blog.objects.get(id__exact=14)  # Explicit form
  >>> Blog.objects.get(id=14)  # __exact is implied
  ```

- [`iexact`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#std-fieldlookup-iexact)

  不区分大小写的匹配

- [`contains`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#std-fieldlookup-contains)

  大小写敏感的包含测试。例子:

  `Entry.objects.get(headline__contains="Lennon")`

- [`startswith`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#std-fieldlookup-startswith), [`endswith`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#std-fieldlookup-endswith)

  以……开头和以……结尾的查找。当然也有大小写不敏感的版本，名为 [`istartswith`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#std-fieldlookup-istartswith) 和 [`iendswith`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#std-fieldlookup-iendswith)。

##### 跨关系查询[¶](https://docs.djangoproject.com/zh-hans/5.2/topics/db/queries/#lookups-that-span-relationships)

Django 提供了一种强大而直观的方式来“追踪”查询中的关系，在幕后自动为你处理 SQL `JOIN` 关系。为了跨越关系，跨模型使用关联字段名，字段名由双下划线分割，直到拿到想要的字段。

这个示例检索所有具有 `name` 为 `'Beatles Blog'` 的 `Blog` 的 `Entry` 对象：

```python
>>> Entry.objects.filter(blog__name="Beatles Blog")
```

它也可以反向工作。虽然它 [`可以自定义`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ForeignKey.related_query_name)，默认情况下，你在查找中使用模型的小写名称来引用一个 “反向” 关系。

这个示例检索所有至少有一个 `headline` 包含 `'Lennon'` 的 `Entry` 的 `Blog` 对象：

```python
>>> Blog.objects.filter(entry__headline__contains="Lennon")
```

如果你在跨多个关系进行筛选，而某个中间模型的没有满足筛选条件的值，Django 会将它当做一个空的（所有值都是 `NULL`）但是有效的对象。这样就意味着不会抛出错误。例如，在这个过滤器中:

```python
Blog.objects.filter(entry__authors__name="Lennon")
```

（假设有个关联的 `Author` 模型），若某项条目没有任何关联的 `author`，它会被视作没有关联的 `name`，而不是因为缺失 `author` 而抛出错误。大多数情况下，这就是你期望的。唯一可能使你迷惑的场景是在使用 [`isnull`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/querysets/#std-fieldlookup-isnull) 时。因此:

```python
Blog.objects.filter(entry__authors__name__isnull=True)
```

将会返回 `Blog` 对象，包含 `author` 的 `name` 为空的对象，以及那些 `entry` 的 `author` 为空的对象。若你不想要后面的对象，你可以这样写:

```python
Blog.objects.filter(entry__authors__isnull=False, entry__authors__name__isnull=True)
```

##### 跨多值关联[¶](https://docs.djangoproject.com/zh-hans/5.2/topics/db/queries/#spanning-multi-valued-relationships)

当跨越 [`ManyToManyField`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ManyToManyField) 或反查 [`ForeignKey`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/fields/#django.db.models.ForeignKey) （例如从 `Blog` 到 `Entry` ）时，对多个属性进行过滤会产生这样的问题：是否要求每个属性都在同一个相关对象中重合。我们可能会寻找那些在标题中含有 *“Lennon”* 的 2008 年的博客，或者我们可能会寻找那些仅有 2008 年的任何条目以及一些在标题中含有 *“Lennon”* 的较新或较早的条目。

要选择所有包含 2008 年至少一个标题中有 *"Lennon"* 的条目的博客（满足两个条件的同一条目），我们要写：

```python
Blog.objects.filter(entry__headline__contains="Lennon", entry__pub_date__year=2008)
```

##### 过滤器可以为模型指定字段

在之前的例子中，我们已经构建过的 `filter` 都是将模型字段值与常量做比较。但是，要怎么做才能将模型字段值与同一模型中的另一字段做比较呢？

Django 提供了 [`F 表达式`](https://docs.djangoproject.com/zh-hans/5.2/ref/models/expressions/#django.db.models.F) 实现这种比较。 `F()` 的实例充当查询中的模型字段的引用。这些引用可在查询过滤器中用于在同一模型实例中比较两个不同的字段。

例如，要找到所有具有比 pingback 更多评论的博客条目的列表，我们构建一个引用 pingback 计数的 `F()` 对象，并在查询中使用该 `F()` 对象：

```python
>>> from django.db.models import F
>>> Entry.objects.filter(number_of_comments__gt=F("number_of_pingbacks"))
```

## 视图

::: tip

每个视图必须要做的只有两件事：返回一个包含被请求页面内容的 [`HttpResponse`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpResponse) 对象，或者抛出一个异常，比如 [`Http404`](https://docs.djangoproject.com/zh-hans/6.0/topics/http/views/#django.http.Http404) 。至于你还想干些什么，随便你。

你的视图可以从数据库里读取记录，可以使用一个模板引擎（比如 Django 自带的，或者其他第三方的），可以生成一个 PDF 文件，可以输出一个 XML，创建一个 ZIP 文件，你可以做任何你想做的事，使用任何你想用的 Python 库。

Django 只要求返回的是一个 [`HttpResponse`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpResponse) ，或者抛出一个异常。

:::

现在让我们向 `polls/views.py` 里添加更多视图。这些视图有一些不同，因为他们接收参数：

```python
# polls/views.py
def detail(request, question_id):
    return HttpResponse("You're looking at question %s." % question_id)


def results(request, question_id):
    response = "You're looking at the results of question %s."
    return HttpResponse(response % question_id)


def vote(request, question_id):
    return HttpResponse("You're voting on question %s." % question_id)
```

把这些新视图添加进 `polls.urls` 模块里，只要添加几个 `url()` 函数调用就行：

```python
# polls/urls.py
from django.urls import path

from . import views

urlpatterns = [
    # ex: /polls/
    path("", views.index, name="index"),
    # ex: /polls/5/
    path("<int:question_id>/", views.detail, name="detail"),
    # ex: /polls/5/results/
    path("<int:question_id>/results/", views.results, name="results"),
    # ex: /polls/5/vote/
    path("<int:question_id>/vote/", views.vote, name="vote"),
]
```

问题 `question_id=34` 来自 `<int:question_id>`。使用尖括号 "获得" 网址部分后发送给视图函数作为一个关键字参数。字符串的 `question_id` 部分定义了要使用的名字，用来识别相匹配的模式，而 `int` 部分是一种转换形式，用来确定应该匹配网址路径的什么模式。冒号 (`:`) 用来分隔转换形式和模式名。

## 请求和响应对象

当一个页面被请求时，Django 会创建一个 [`HttpRequest`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpRequest) 对象，这个对象包含了请求的元数据。然后，Django 加载相应的视图，将 [`HttpRequest`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpRequest) 作为视图函数的第一个参数。每个视图负责返回一个 [`HttpResponse`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpResponse) 对象。

### `HttpRequest` 对象

- HttpRequest.method

  代表请求中使用的 HTTP 方法的字符串。保证是大写字母。例如：

  ```python
  if request.method == "GET":
      do_something()
  elif request.method == "POST":
      do_something_else()
  ```

- HttpRequest.GET

  一个类似字典的对象，包含所有给定的 HTTP GET 参数

- HttpRequest.POST

  一个类似字典的对象，包含所有给定的 HTTP POST 参数，前提是请求包含表单数据。

- HttpRequest.headers

​		一个不区分大小写的类似字典的对象，提供对请求中所有 HTTP 前缀头的访问

### `QueryDict` 对象

::: tip

[`QueryDict`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.QueryDict) 实现了所有标准的字典方法，因为它是字典的一个子类。

:::

在一个 [`HttpRequest`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpRequest) 对象中， [`GET`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpRequest.GET) 和 [`POST`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpRequest.POST) 属性是 `django.http.QueryDict` 的实例，这是一个类似字典的类，用来处理同一个键的多个值。这是很有必要的，因为一些 HTML 表单元素，尤其是 `<select multiple>`，会传递同一个键的多个值。

### `HttpResponse` 对象

#### 用法

##### 传入字符串

典型的用法是将页面的内容作为字符串、字节串或 [`memoryview`](https://docs.python.org/3/library/stdtypes.html#memoryview) 传递给 [`HttpResponse`](https://docs.djangoproject.com/zh-hans/6.0/ref/request-response/#django.http.HttpResponse) 构造函数：

```python
>>> from django.http import HttpResponse
>>> response = HttpResponse("Here's the text of the web page.")
>>> response = HttpResponse("Text only, please.", content_type="text/plain")
>>> response = HttpResponse(b"Bytestrings are also accepted.")
>>> response = HttpResponse(memoryview(b"Memoryview as well."))
```

但如果你想逐步添加内容，你可以将 `response` 当作类似文件的对象来使用：

```python
>>> response = HttpResponse()
>>> response.write("<p>Here's the text of the web page.</p>")
>>> response.write("<p>Here's another paragraph.</p>")
```

#### `JsonResponse` 对象

##### 用法

```python
>>> from django.http import JsonResponse
>>> response = JsonResponse({"foo": "bar"})
>>> response.content
b'{"foo": "bar"}'
```

序列化非字典对象

为了序列化除了 `dict` 之外的对象，你必须将 `safe` 参数设置为 `False`：

```python
>>> response = JsonResponse([1, 2, 3], safe=False)
```

