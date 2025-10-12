## 初始化

目录和文件的用处是：

- `manage.py`: 一个让你用各种方式管理 Django 项目的命令行工具。你可以阅读 [django-admin 和 manage.py](https://docs.djangoproject.com/zh-hans/5.2/ref/django-admin/) 获取所有 `manage.py` 的细节。
- `mysite/`: 一个目录，它是你项目的实际 Python 包。它的名称是你需要用来导入其中任何内容的 Python 包名称（例如 `mysite.urls`）。
- `mysite/__init__.py`：一个空文件，告诉 Python 这个目录应该被认为是一个 Python 包。如果你是 Python 初学者，阅读官方文档中的 [更多关于包的知识](https://docs.python.org/3/tutorial/modules.html#tut-packages)。
- `mysite/settings.py`：Django 项目的配置文件。如果你想知道这个文件是如何工作的，请查看 [Django 配置](https://docs.djangoproject.com/zh-hans/5.2/topics/settings/) 了解细节。
- `mysite/urls.py`：Django 项目的 URL 声明，就像你网站的“目录”。阅读 [URL调度器](https://docs.djangoproject.com/zh-hans/5.2/topics/http/urls/) 文档来获取更多关于 URL 的内容。
- `mysite/asgi.py`：作为你的项目的运行在 ASGI 兼容的 Web 服务器上的入口。阅读 [如何使用 ASGI 来部署](https://docs.djangoproject.com/zh-hans/5.2/howto/deployment/asgi/) 了解更多细节。
- `mysite/wsgi.py`：作为你的项目的运行在 WSGI 兼容的Web服务器上的入口。阅读 [如何使用 WSGI 进行部署](https://docs.djangoproject.com/zh-hans/5.2/howto/deployment/wsgi/) 了解更多细节。

## 开发服务器启动

```bash
python3 manage.py runserver --noreload
```

## 路由

在**urls.py**文件里配置路由

```python
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
]
```

并且在根应用的路由配置中添加

::: tip

每当 Django 遇到 [`include()`](https://docs.djangoproject.com/zh-hans/5.2/ref/urls/#django.urls.include) 时，它会截断 URL 中匹配到该点的部分，并将剩余的字符串发送到包含的 URLconf（视图view部分） 以进行进一步处理。

:::

```python
from django.contrib import admin
from django.urls import path,include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("bot_server/", include('bot_server.urls')),
]
```

## 数据库配置

在settings.py文件中配置数据库配置

### 设置时区

```python
TIME_ZONE = "Asia/Shanghai"
```

### app应用

[`INSTALLED_APPS`](https://docs.djangoproject.com/zh-hans/5.2/ref/settings/#std-setting-INSTALLED_APPS) 注册了项目中启用的所有 Django 应用。应用能在多个项目中使用，

默认开启的某些应用需要至少一个数据表，所以，在使用他们之前需要在数据库中创建一些表。请执行以下命令：

```bash
python manage.py migrate
```

这个 [`migrate`](https://docs.djangoproject.com/zh-hans/5.2/ref/django-admin/#django-admin-migrate) 命令查看 [`INSTALLED_APPS`](https://docs.djangoproject.com/zh-hans/5.2/ref/settings/#std-setting-INSTALLED_APPS) 配置，并根据 `settings.py` 文件中的数据库配置和随应用提供的数据库迁移文件，创建任何必要的数据库表。

### 创建模型和激活模型

在创建完模型和在[`INSTALLED_APPS`](https://docs.djangoproject.com/zh-hans/5.2/ref/settings/#std-setting-INSTALLED_APPS) 注册应用之后，执行以下命令激活模型

```bash
python manage.py makemigrations 应用名
```

通过运行 `makemigrations` 命令，Django 会检测你对模型文件的修改（在这种情况下，你已经取得了新的），并且把修改的部分储存为一次 *迁移*。该命令会对比数据库和代码里的定义的模型找出不同步的部分自动生成SQL命令

最后可以再次运行migrate命令执行数据库的同步

## 本地运行

```bash
python manage.py runserver --noreload
```

## 部署

### 安装git

```bash
sudo yum install git -y
```

### TA-Lib centos 部署

```bash
wget https://github.com/ta-lib/ta-lib/releases/download/v0.6.4/ta-lib-0.6.4-src.tar.gz
tar -xzf ta-lib-0.6.4-src.tar.gz
cd ta-lib-0.6.4/
./configure --prefix=/usr
make
sudo make install
pip3 install TA-Lib
```

若Python包安装失败，确保/usr/lib在库路径中，可尝试：
```bash
export LD_LIBRARY_PATH=/usr/lib:$LD_LIBRARY_PATH
sudo ldconfig
```

### sqlite3升级

```bash
# 安装依赖
sudo apt-get update
sudo apt-get install -y build-essential

# 下载 SQLite 最新源码（以 3.44.2 为例）
wget https://www.sqlite.org/2023/sqlite-autoconf-3440200.tar.gz
tar xzf sqlite-autoconf-3440200.tar.gz
cd sqlite-autoconf-3440200

# 编译安装
./configure
make && sudo make install

# 创建符号链接（覆盖旧版本）
sudo mv /usr/bin/sqlite3 /usr/bin/sqlite3_old
sudo ln -s /usr/local/bin/sqlite3 /usr/bin/sqlite3

# 更新动态库缓存
sudo ldconfig
```

### 依赖安装

```bash
pip install -r requirements.txt
```

### 生成requirements.txt依赖声明文件

```bash
pigar generate     
```

### 安装corsheaders

```bash
pip install django-cors-headers 
```

### 迁移命令

比如添加一个字段或删除一个模型，然后运行 makemigrations：
```bash
python manage.py makemigrations yourapp
```
一旦您有了新的迁移文件，您应该将它们应用到您的数据库，以确保它们按预期工作：
```bash
python manage.py migrate
```