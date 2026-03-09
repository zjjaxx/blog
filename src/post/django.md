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

对于多对多关联关系的两个模型，可以在任何一个模型中添加 [`ManyToManyField`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/fields/#django.db.models.ManyToManyField) 字段，但只能选择一个模型设置该字段，即不能同时在两模型中添加该字段。

一般来讲，应该把 [`ManyToManyField`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/fields/#django.db.models.ManyToManyField) 实例放到需要在表单中被编辑的对象中。

[`manyToManyField`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/fields/#django.db.models.ManyToManyField) 的时候使用 [`through`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/fields/#django.db.models.ManyToManyField.through) 参数指定多对多关系使用哪个中间模型。

```python
from django.db import models


class Person(models.Model):
    name = models.CharField(max_length=128)

    def __str__(self):
        return self.name


class Group(models.Model):
    name = models.CharField(max_length=128)
    members = models.ManyToManyField(Person, through="Membership")

    def __str__(self):
        return self.name


class Membership(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    date_joined = models.DateField()
    invite_reason = models.CharField(max_length=64)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["person", "group"], name="unique_person_group"
            )
        ]
```

- class Meta是模型的元数据容器，用于定义与数据库结构、查询行为、权限控制等相关的非字段属性。在用户代码中，Membership模型通过 Meta定义了唯一约束：**作用**：禁止 `person`和 `group`的重复组合（即一个人不能多次加入同一组）

- `__str__`是 Python 的魔术方法，用于定义对象的人类可读字符串表示。**调试与日志**：打印对象时显示有意义的信息。

###### `OneToOneField`

一对一的关系。例如，当你要建立一个有关“位置”信息的数据库时，你可能会包含通常的地址，电话等字段。接着，如果你想接着建立一个关于关于餐厅的数据库，除了将位置数据库当中的字段复制到 `Restaurant` 模型，你也可以将一个指向 `Place` [`OneToOneField`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/fields/#django.db.models.OneToOneField) 放到 `Restaurant` 当中（因为餐厅“是一个”地点）；事实上，在处理这样的情况时最好使用 [模型继承](https://docs.djangoproject.com/zh-hans/6.0/topics/db/models/#model-inheritance) ，它隐含的包括了一个一对一关系。

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

#### 定义模型

```python
from datetime import date

from django.db import models


class Blog(models.Model):
    name = models.CharField(max_length=100)
    tagline = models.TextField()

    def __str__(self):
        return self.name


class Author(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()

    def __str__(self):
        return self.name


class Entry(models.Model):
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE)
    headline = models.CharField(max_length=255)
    body_text = models.TextField()
    pub_date = models.DateField()
    mod_date = models.DateField(default=date.today)
    authors = models.ManyToManyField(Author)
    number_of_comments = models.IntegerField(default=0)
    number_of_pingbacks = models.IntegerField(default=0)
    rating = models.IntegerField(default=5)

    def __str__(self):
        return self.headline
```

一旦创建 [数据模型](https://docs.djangoproject.com/zh-hans/5.2/topics/db/models/) 后，Django 自动给予你一套数据库抽象 API，允许你创建，检索，更新和删除对象。

#### 创建对象[¶](https://docs.djangoproject.com/zh-hans/6.0/topics/db/queries/#creating-objects)

要创建一个对象，用关键字参数初始化它，然后调用 [`save()`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/instances/#django.db.models.Model.save) 将其存入数据库。

```python
>>> from blog.models import Blog
>>> b = Blog(name="Beatles Blog", tagline="All the latest Beatles news.")
>>> b.save()
```

这在幕后执行了 `INSERT` SQL 语句。Django 在你显式调用 [`save()`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/instances/#django.db.models.Model.save) 才操作数据库。

#### 将修改保存至对象

```python
>>> b5.name = "New name"
>>> b5.save()
```

要将修改保存至数据库中已有的某个对象，使用 [`save()`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/instances/#django.db.models.Model.save)。

#### 保存 `ForeignKey` 和 `ManyToManyField` 字段

更新 [`ForeignKey`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/fields/#django.db.models.ForeignKey) 字段的方法与保存普通字段完全相同——将正确类型的对象分配给相应的字段。这个示例更新了 `Entry` 实例 `entry` 的 `blog` 属性，假设已经保存了适当的 `Entry` 和 `Blog` 实例到数据库中（因此我们可以在下面检索到它们）：

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

这三个查询集是独立的。第一个是基础查询集，包含所有标题以"What"开头的条目。第二个是第一个的子集，附加了排除发布日期为今天或未来的记录的条件。第三个也是第一个的子集，附加了只选择发布日期为今天或未来的记录的条件。初始查询集（q1）不受细化过程的影响。

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

###### 排序

由于对 queryset 切片工作方式的模糊性，禁止对其进行进一步的排序或过滤。

要检索 *单个* 对象而不是列表（例如，`SELECT foo FROM bar LIMIT 1`），请使用索引而不是切片。例如，这会按标题的字母顺序返回数据库中的第一个 `Entry`：

```python
>>> Entry.objects.order_by("headline")[0]
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

- in

  在一个给定的可迭代对象中；通常是一个列表、元组或查询集。

  ```python
  Entry.objects.filter(id__in=[1, 3, 4])
  Entry.objects.filter(headline__in="abc")
  ```

- gt

  大于

  ```python
  Entry.objects.filter(id__gt=4)
  ```

- gte

  大于等于

- lt

  小于

- lte

  小于等于

- range

  范围测试（含）

  ```python
  import datetime
  
  start_date = datetime.date(2005, 1, 1)
  end_date = datetime.date(2005, 3, 31)
  Entry.objects.filter(pub_date__range=(start_date, end_date))
  ```

- date

  对于日期时间字段，将值投射为日期。允许链接其他字段的查找。取一个日期值。

  ```python
  Entry.objects.filter(pub_date__date=datetime.date(2005, 1, 1))
  Entry.objects.filter(pub_date__date__gt=datetime.date(2005, 1, 1))
  ```

- year

  对于日期和日期时间字段，精确匹配年份。允许链接其他字段的查询。取整数年。

  ```python
  Entry.objects.filter(pub_date__year=2005)
  Entry.objects.filter(pub_date__year__gte=2005)
  ```

- month

  对于日期和日期时间字段，精确的月份匹配。允许链接其他字段的查询。取整数 1（1 月）到 12（12 月）。

  ```python
  Entry.objects.filter(pub_date__month=12)
  Entry.objects.filter(pub_date__month__gte=6)
  ```

- day

  对于日期和日期时间字段，精确匹配日期。允许链接其他字段的查询。取整数日

  ```python
  Entry.objects.filter(pub_date__day=3)
  Entry.objects.filter(pub_date__day__gte=3)
  ```

- week

  对于日期和日期时间字段，根据 [ISO-8601](https://en.wikipedia.org/wiki/ISO-8601) ，返回星期号（1-52 或 53），即星期从星期一开始，第一周包含一年的第一个星期四。

  ```python
  Entry.objects.filter(pub_date__week=52)
  Entry.objects.filter(pub_date__week__gte=32, pub_date__week__lte=38)
  ```

- week_day

  对于日期和日期时间字段，“星期几”匹配。允许链接其他字段的查询。

  从 1（星期日）到 7（星期六）取一个整数值，代表一周的一天。

  ```python
  Entry.objects.filter(pub_date__week_day=2)
  Entry.objects.filter(pub_date__week_day__gte=2)
  ```

- time

  对于日期时间字段，将其值强制转换为时间。允许链式附加字段查找。取一个 [`datetime.time`](https://docs.python.org/3/library/datetime.html#datetime.time) 的值。

  ```python
  Entry.objects.filter(pub_date__time=datetime.time(14, 30))
  Entry.objects.filter(pub_date__time__range=(datetime.time(8), datetime.time(17)))
  ```

- hour

  对于日期时间和时间字段，精确的小时匹配。允许链式查找其他字段。取 0 到 23 之间的整数。

  ```python
  Event.objects.filter(timestamp__hour=23)
  Event.objects.filter(time__hour=5)
  Event.objects.filter(timestamp__hour__gte=12)
  ```

- minute

  对于日期时间和时间字段，精确的分钟匹配。允许链式查找其他字段。取 0 到 59 之间的整数。

  ```python
  Event.objects.filter(timestamp__minute=29)
  Event.objects.filter(time__minute=46)
  Event.objects.filter(timestamp__minute__gte=29)
  ```

- second

  对于日期时间和时间字段，完全秒配。允许链式查找其他字段。取 0 到 59 之间的整数。

  ```python
  Event.objects.filter(timestamp__second=31)
  Event.objects.filter(time__second=2)
  Event.objects.filter(timestamp__second__gte=31)
  ```

- isnull

  取 `True` 或 `False`，分别对应 `IS NULL` 和 `IS NOT NULL` 的 SQL 查询。

  ```python
  Entry.objects.filter(pub_date__isnull=True)
  ```

- regex

  区分大小写的正则表达式匹配。

  正则表达式语法是使用中的数据库后端的语法。对于没有内置正则表达式支持的 SQLite 来说，这个功能是由（Python）用户定义的 REGEXP 函数提供的，因此正则表达式语法是 Python 的 `re` 模块的语法。

  ```python
  Entry.objects.get(title__regex=r"^(An?|The) +")
  ```

###### 聚合

下面是根据以上模型执行常见的聚合查询：

```python
# Total number of books.
>>> Book.objects.count()
2452

# Total number of books with publisher=BaloneyPress
>>> Book.objects.filter(publisher__name="BaloneyPress").count()
73

# Average price across all books, provide default to be returned instead
# of None if no books exist.
>>> from django.db.models import Avg
>>> Book.objects.aggregate(Avg("price", default=0))
{'price__avg': 34.35}

# Max price across all books, provide default to be returned instead of
# None if no books exist.
>>> from django.db.models import Max
>>> Book.objects.aggregate(Max("price", default=0))
{'price__max': Decimal('81.20')}

# Difference between the highest priced book and the average price of all books.
>>> from django.db.models import FloatField
>>> Book.objects.aggregate(
...     price_diff=Max("price", output_field=FloatField()) - Avg("price")
... )
{'price_diff': 46.85}

# All the following queries involve traversing the Book<->Publisher
# foreign key relationship backwards.

# Each publisher, each with a count of books as a "num_books" attribute.
>>> from django.db.models import Count
>>> pubs = Publisher.objects.annotate(num_books=Count("book"))
>>> pubs
<QuerySet [<Publisher: BaloneyPress>, <Publisher: SalamiPress>, ...]>
>>> pubs[0].num_books
73

# Each publisher, with a separate count of books with a rating above and below 5
>>> from django.db.models import Q
>>> above_5 = Count("book", filter=Q(book__rating__gt=5))
>>> below_5 = Count("book", filter=Q(book__rating__lte=5))
>>> pubs = Publisher.objects.annotate(below_5=below_5).annotate(above_5=above_5)
>>> pubs[0].above_5
23
>>> pubs[0].below_5
12

# The top 5 publishers, in order by number of books.
>>> pubs = Publisher.objects.annotate(num_books=Count("book")).order_by("-num_books")[:5]
>>> pubs[0].num_books
1323
```

###### 在 `QuerySet` 上生成聚合[¶](https://docs.djangoproject.com/zh-hans/6.0/topics/db/aggregation/#generating-aggregates-over-a-queryset)

Django 提供两种生成聚合值的方法。第一种方法是在整个 `QuerySet` 上生成摘要值。例如，假设您想计算所有可售书籍的平均价格。Django 的查询语法提供了一种描述所有书籍集合的方法

```python
>>> Book.objects.all()
```

我们需要的是一种方法来计算属于这个 `QuerySet` 的对象的摘要值。这可以通过在 `QuerySet` 上附加一个 `aggregate()` 子句来实现

```python
>>> from django.db.models import Avg
>>> Book.objects.all().aggregate(Avg("price"))
{'price__avg': 34.35}

```

在这个示例中，`all()` 是多余的，所以可以简化为：

```python
>>> Book.objects.aggregate(Avg("price"))
{'price__avg': 34.35}
```

传递给 `aggregate()` 的参数描述了我们想要计算的聚合值。在这个例子里，要计算的就是 `Book` 模型上的 `price` 字段的平均值。可用的聚合函数列表可以在 [QuerySet reference](https://docs.djangoproject.com/zh-hans/6.0/ref/models/querysets/#aggregation-functions) 中找到。

`aggregate()` 是一个 `QuerySet` 的终端子句，当调用时，它返回一个名值对的字典。名称是聚合值的标识符；值是计算得到的聚合值。名称是从字段名称和聚合函数自动生成的。如果您想手动指定聚合值的名称，可以在指定聚合子句时提供该名称：

````python
>>> Book.objects.aggregate(average_price=Avg("price"))
{'average_price': 34.35}
````

如果您想生成多个聚合值，可以向 `aggregate()` 子句添加另一个参数。因此，如果我们还想知道所有书的最高价和最低价，可以发出以下查询：

```python
>>> from django.db.models import Avg, Max, Min
>>> Book.objects.aggregate(Avg("price"), Max("price"), Min("price"))
{'price__avg': 34.35, 'price__max': Decimal('81.20'), 'price__min': Decimal('12.99')}
```

###### 为 `QuerySet` 中的每一个条目生成聚合

生成值的汇总的另一个办法是为 [`QuerySet`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/querysets/#django.db.models.query.QuerySet) 的每一个对象生成独立汇总。比如，如果你想检索书籍列表，你可能想知道每一本书有多少作者。每一本书与作者有多对多的关系；我们想在 `QuerySet` 中为每一本书总结这个关系。

使用 [`annotate()`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/querysets/#django.db.models.query.QuerySet.annotate) 子句可以生成每一个对象的汇总。当指定 `annotate()` 子句，`QuerySet` 中的每一个对象将对指定值进行汇总。

这些汇总语法规则与 [`aggregate()`](https://docs.djangoproject.com/zh-hans/6.0/ref/models/querysets/#django.db.models.query.QuerySet.aggregate) 子句的规则相同。`annotate()` 的每一个参数描述了一个要计算的聚合。比如，注解（annotate）所有书的所有作者：

```python
# Build an annotated queryset
>>> from django.db.models import Count
>>> q = Book.objects.annotate(Count("authors"))
# Interrogate the first object in the queryset
>>> q[0]
<Book: The Definitive Guide to Django>
>>> q[0].authors__count
2
# Interrogate the second object in the queryset
>>> q[1]
<Book: Practical Django Projects>
>>> q[1].authors__count
1
```

与 `aggregate()` 一样，注释的名称是从聚合函数的名称和被聚合字段的名称自动派生的。您可以通过在指定注释时提供别名来覆盖这个默认名称：

```python
>>> q = Book.objects.annotate(num_authors=Count("authors"))
>>> q[0].num_authors
2
>>> q[1].num_authors
1
```



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

