## 网络数据采集概述

在理想的状态下，所有 ICP（Internet Content Provider）都应该为自己的网站提供 API 接口来共享它们允许其他程序获取的数据，在这种情况下就根本不需要爬虫程序。国内比较有名的电商平台（如淘宝、京东等）、社交平台（如微博、微信等）等都提供了自己的 API 接口，但是这类 API 接口通常会对可以抓取的数据以及抓取数据的频率进行限制。对于大多数的公司而言，及时的获取行业数据和竞对数据是企业生存的重要环节之一，然而对大部分企业来说，数据都是其与生俱来的短板。在这种情况下，合理的利用爬虫来获取数据并从中提取出有商业价值的信息对这些企业来说就显得至关重要的。

## 爬虫合法性探讨

经常听人说起“爬虫写得好，牢饭吃到饱”，那么编程爬虫程序是否违法呢？关于这个问题，我们可以从以下几个角度进行解读。

1. 网络爬虫这个领域目前还属于拓荒阶段，虽然互联网世界已经通过自己的游戏规则建立起了一定的道德规范，即 Robots 协议（全称是“网络爬虫排除标准”），但法律部分还在建立和完善中，也就是说，现在这个领域暂时还是灰色地带。
2. “法不禁止即为许可”，如果爬虫就像浏览器一样获取的是前端显示的数据（网页上的公开信息）而不是网站后台的私密敏感信息，就不太担心法律法规的约束，因为目前大数据产业链的发展速度远远超过了法律的完善程度。
3. 在爬取网站的时候，需要限制自己的爬虫遵守 Robots 协议，同时控制网络爬虫程序的抓取数据的速度；在使用数据的时候，必须要尊重网站的知识产权（从Web 2.0时代开始，虽然Web上的数据很多都是由用户提供的，但是网站平台是投入了运营成本的，当用户在注册和发布内容时，平台通常就已经获得了对数据的所有权、使用权和分发权）。如果违反了这些规定，在打官司的时候败诉几率相当高。
4. 适当的隐匿自己的身份在编写爬虫程序时必要的，而且最好不要被对方举证你的爬虫有破坏别人动产（例如服务器）的行为。
5. 不要在公网（如代码托管平台）上去开源或者展示你的爬虫代码，这些行为通常会给自己带来不必要的麻烦。

## Robots协议

大多数网站都会定义`robots.txt`文件，这是一个君子协议，并不是所有爬虫都必须遵守的游戏规则。下面以淘宝的[`robots.txt`](http://www.taobao.com/robots.txt)文件为例，看看淘宝网对爬虫有哪些限制。

## 相关工具

下面我们先介绍一些开发爬虫程序的辅助工具，这些工具相信能帮助你事半功倍。

- Chrome Developer Tools：谷歌浏览器内置的开发者工具。

- Postman：功能强大的网页调试与 RESTful 请求工具。Postman可以帮助我们模拟请求，非常方便的定制我们的请求以及查看服务器的响应。

- HTTPie：命令行HTTP客户端。

  安装。

  ```bash
  pip install httpie
  ```

  使用。

  ```bash
  http --header http --header https://movie.douban.com/
  
  HTTP/1.1 200 OK
  Connection: keep-alive
  Content-Encoding: gzip
  Content-Type: text/html; charset=utf-8
  Date: Tue, 24 Aug 2021 16:48:00 GMT
  Keep-Alive: timeout=30
  Server: dae
  Set-Cookie: bid=58h4BdKC9lM; Expires=Wed, 24-Aug-22 16:48:00 GMT; Domain=.douban.com; Path=/
  Strict-Transport-Security: max-age=15552000
  Transfer-Encoding: chunked
  X-Content-Type-Options: nosniff
  X-DOUBAN-NEWBID: 58h4BdKC9lM
  ```

- `builtwith`库：识别网站所用技术的工具。

  ```bash
  pip install builtwith
  ```

  ```python
  import ssl
  
  import builtwith
  
  ssl._create_default_https_context = ssl._create_unverified_context
  print(builtwith.parse('http://www.bootcss.com/'))
  ```

- `python-whois`库：查询网站所有者的工具。

  ```bash
  pip3 install python-whois
  ```

  ```python
  import whois
  
  print(whois.whois('https://www.bootcss.com'))
  ```

  

## 爬虫的基本工作流程

一个基本的爬虫通常分为数据采集（网页下载）、数据处理（网页解析）和数据存储（将有用的信息持久化）三个部分的内容，当然更为高级的爬虫在数据采集和处理时会使用并发编程或分布式技术，这就需要有调度器（安排线程或进程执行对应的任务）、后台管理程序（监控爬虫的工作状态以及检查数据抓取的结果）等的参与。

[![img](https://github.com/jackfrued/Python-100-Days/raw/master/Day61-65/res/20210824004107.png)](https://github.com/jackfrued/Python-100-Days/blob/master/Day61-65/res/20210824004107.png)

一般来说，爬虫的工作流程包括以下几个步骤：

1. 设定抓取目标（种子页面/起始页面）并获取网页。
2. 当服务器无法访问时，按照指定的重试次数尝试重新下载页面。
3. 在需要的时候设置用户代理或隐藏真实IP，否则可能无法访问页面。
4. 对获取的页面进行必要的解码操作然后抓取出需要的信息。
5. 在获取的页面中通过某种方式（如正则表达式）抽取出页面中的链接信息。
6. 对链接进行进一步的处理（获取页面并重复上面的动作）。
7. 将有用的信息进行持久化以备后续的处理。

## requests库

要使用 Python 获取网络数据，家推荐使用名为`requests` 的三方库

通过`requests`库，我们可以让 Python 程序向浏览器一样向 Web 服务器发起请求，并接收服务器返回的响应，从响应中我们就可以提取出想要的数据。浏览器呈现给我们的网页是用 [HTML](https://developer.mozilla.org/zh-CN/docs/Web/HTML) 编写的，浏览器相当于是 HTML 的解释器环境，我们看到的网页中的内容都包含在 HTML 的标签中。在获取到 HTML 代码后，就可以从标签的属性或标签体中提取内容。

```python
import requests

resp = requests.get('https://www.sohu.com/')
if resp.status_code == 200:
    print(resp.text)
```

由于`Response`对象的`text`是一个字符串，所以我们可以利用之前讲过的正则表达式的知识，从页面的 HTML 代码中提取新闻的标题和链接，代码如下所示。

```python
import re

import requests

pattern = re.compile(r'<a.*?href="(.*?)".*?title="(.*?)".*?>')
resp = requests.get('https://www.sohu.com/')
if resp.status_code == 200:
    all_matches = pattern.findall(resp.text)
    for href, title in all_matches:
        print(href)
        print(title)
```

除了文本内容，我们也可以使用`requests`库通过 URL 获取二进制资源。下面的例子演示了如何获取百度 Logo 并保存到名为`baidu.png`的本地文件中。可以在百度的首页上右键点击百度Logo，并通过“复制图片地址”菜单项获取图片的 URL。

```python
import requests

resp = requests.get('https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png')
with open('baidu.png', 'wb') as file:
    file.write(resp.content)
```

### 编写爬虫代码

下面的代码演示了如何从[豆瓣电影](https://movie.douban.com/)获取排前250名的电影的名称。[豆瓣电影Top250](https://movie.douban.com/top250)的页面结构和对应代码如下图所示，可以看出，每页共展示了25部电影，如果要获取到 Top250 数据，我们共需要访问10个页面，对应的地址是https://movie.douban.com/top250?start=xxx，这里的`xxx`如果为`0`就是第一页，如果`xxx`的值是`100`，那么我们可以访问到第五页。为了代码简单易读，我们只获取电影的标题和评分。

```python
import random
import re
import time

import requests

for page in range(1, 11):
    resp = requests.get(
        url=f'https://movie.douban.com/top250?start={(page - 1) * 25}',
        # 如果不设置HTTP请求头中的User-Agent，豆瓣会检测出不是浏览器而阻止我们的请求。
        # 通过get函数的headers参数设置User-Agent的值，具体的值可以在浏览器的开发者工具查看到。
        # 用爬虫访问大部分网站时，将爬虫伪装成来自浏览器的请求都是非常重要的一步。
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36'}
    )
    # 通过正则表达式获取class属性为title且标签体不以&开头的span标签并用捕获组提取标签内容
    pattern1 = re.compile(r'<span class="title">([^&]*?)</span>')
    titles = pattern1.findall(resp.text)
    # 通过正则表达式获取class属性为rating_num的span标签并用捕获组提取标签内容
    pattern2 = re.compile(r'<span class="rating_num".*?>(.*?)</span>')
    ranks = pattern2.findall(resp.text)
    # 使用zip压缩两个列表，循环遍历所有的电影标题和评分
    for title, rank in zip(titles, ranks):
        print(title, rank)
    # 随机休眠1-5秒，避免爬取页面过于频繁
    time.sleep(random.random() * 4 + 1)
```

## aiohttp库

我们之前使用的`requests`三方库并不支持异步 I/O，如果希望使用异步 I/O 的方式来加速爬虫代码的执行，我们可以安装和使用名为`aiohttp`的三方库。

安装`aiohttp`

```bash
pip install aiohttp
```

下面的代码使用`aiohttp`抓取了`10`个网站的首页并解析出它们的标题。

```python
import asyncio
import re

import aiohttp
from aiohttp import ClientSession

TITLE_PATTERN = re.compile(r'<title.*?>(.*?)</title>', re.DOTALL)


async def fetch_page_title(url):
    async with aiohttp.ClientSession(headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
    }) as session:  # type: ClientSession
        async with session.get(url, ssl=False) as resp:
            if resp.status == 200:
                html_code = await resp.text()
                matcher = TITLE_PATTERN.search(html_code)
                title = matcher.group(1).strip()
                print(title)


def main():
    urls = [
        'https://www.python.org/',
        'https://www.jd.com/',
        'https://www.baidu.com/',
        'https://www.taobao.com/',
        'https://git-scm.com/',
        'https://www.sohu.com/',
        'https://gitee.com/',
        'https://www.amazon.com/',
        'https://www.usa.gov/',
        'https://www.nasa.gov/'
    ]
    objs = [fetch_page_title(url) for url in urls]
    loop = asyncio.get_event_loop()
    loop.run_until_complete(asyncio.wait(objs))
    loop.close()


if __name__ == '__main__':
    main()
```

## 并发编程在爬虫中的应用

之前的课程，我们已经为大家介绍了 Python 中的多线程、多进程和异步编程，通过这三种手段，我们可以实现并发或并行编程，这一方面可以加速代码的执行，另一方面也可以带来更好的用户体验。爬虫程序是典型的 I/O 密集型任务，对于 I/O 密集型任务来说，多线程和异步 I/O 都是很好的选择，因为当程序的某个部分因 I/O 操作阻塞时，程序的其他部分仍然可以运转，这样我们不用在等待和阻塞中浪费大量的时间。下面我们以爬取“[360图片](https://image.so.com/)”网站的图片并保存到本地为例，为大家分别展示使用单线程、多线程和异步 I/O 编程的爬虫程序有什么区别，同时也对它们的执行效率进行简单的对比。

“360图片”网站的页面使用了 [Ajax](https://developer.mozilla.org/zh-CN/docs/Web/Guide/AJAX) 技术，这是很多网站都会使用的一种异步加载数据和局部刷新页面的技术。简单的说，页面上的图片都是通过 JavaScript 代码异步获取 JSON 数据并动态渲染生成的，而且整个页面还使用了瀑布式加载（一边向下滚动，一边加载更多的图片）。我们在浏览器的“开发者工具”中可以找到提供动态内容的数据接口，如下图所示，我们需要的图片信息就在服务器返回的 JSON 数据中。

[![img](https://github.com/jackfrued/Python-100-Days/raw/master/Day61-65/res/20211205221352.png)](https://github.com/jackfrued/Python-100-Days/blob/master/Day61-65/res/20211205221352.png)

例如，要获取“美女”频道的图片，我们可以请求如下所示的URL，其中参数`ch`表示请求的频道，`=`后面的参数值`beauty`就代表了“美女”频道，参数`sn`相当于是页码，`0`表示第一页（共`30`张图片），`30`表示第二页，`60`表示第三页，以此类推。

```python
https://image.so.com/zjl?ch=beauty&sn=0
```

### 单线程版本

通过上面的 URL 下载“美女”频道共`90`张图片。

```python
"""
example04.py - 单线程版本爬虫
"""
import os

import requests


def download_picture(url):
    filename = url[url.rfind('/') + 1:]
    resp = requests.get(url)
    if resp.status_code == 200:
        with open(f'images/beauty/{filename}', 'wb') as file:
            file.write(resp.content)


def main():
    if not os.path.exists('images/beauty'):
        os.makedirs('images/beauty')
    for page in range(3):
        resp = requests.get(f'https://image.so.com/zjl?ch=beauty&sn={page * 30}')
        if resp.status_code == 200:
            pic_dict_list = resp.json()['list']
            for pic_dict in pic_dict_list:
                download_picture(pic_dict['qhimg_url'])

if __name__ == '__main__':
    main()
```

在 macOS 或 Linux 系统上，我们可以使用`time`命令来了解上面代码的执行时间以及 CPU 的利用率，如下所示。

```bash
time python3 example04.py 
```

下面是单线程爬虫代码在我的电脑上执行的结果。

```bash
python3 example04.py  2.36s user 0.39s system 12% cpu 21.578 total
```

这里我们只需要关注代码的总耗时为`21.578`秒，CPU 利用率为`12%`。

### 多线程版本

我们使用之前讲到过的线程池技术，将上面的代码修改为多线程版本

```python
"""
example05.py - 多线程版本爬虫
"""
import os
from concurrent.futures import ThreadPoolExecutor

import requests


def download_picture(url):
    filename = url[url.rfind('/') + 1:]
    resp = requests.get(url)
    if resp.status_code == 200:
        with open(f'images/beauty/{filename}', 'wb') as file:
            file.write(resp.content)


def main():
    if not os.path.exists('images/beauty'):
        os.makedirs('images/beauty')
    with ThreadPoolExecutor(max_workers=16) as pool:
        for page in range(3):
            resp = requests.get(f'https://image.so.com/zjl?ch=beauty&sn={page * 30}')
            if resp.status_code == 200:
                pic_dict_list = resp.json()['list']
                for pic_dict in pic_dict_list:
                    pool.submit(download_picture, pic_dict['qhimg_url'])


if __name__ == '__main__':
    main()
```

执行如下所示的命令。

```bash
time python3 example05.py
```

代码的执行结果如下所示：

```bash
python3 example05.py  2.65s user 0.40s system 95% cpu 3.193 total
```

### 异步I/O版本

我们使用`aiohttp`将上面的代码修改为异步 I/O 的版本。为了以异步 I/O 的方式实现网络资源的获取和写文件操作，我们首先得安装三方库`aiohttp`和`aiofile`，命令如下所示。

```bash
pip install aiohttp aiofile
```

`aiohttp` 的用法在之前的课程中已经做过简要介绍，`aiofile`模块中的`async_open`函数跟 Python 内置函数`open`的用法大致相同，只不过它支持异步操作。下面是异步 I/O 版本的爬虫代码。

```python
"""
example06.py - 异步I/O版本爬虫
"""
import asyncio
import json
import os

import aiofile
import aiohttp


async def download_picture(session, url):
    filename = url[url.rfind('/') + 1:]
    async with session.get(url, ssl=False) as resp:
        if resp.status == 200:
            data = await resp.read()
            async with aiofile.async_open(f'images/beauty/{filename}', 'wb') as file:
                await file.write(data)


async def fetch_json():
    async with aiohttp.ClientSession() as session:
        for page in range(3):
            async with session.get(
                url=f'https://image.so.com/zjl?ch=beauty&sn={page * 30}',
                ssl=False
            ) as resp:
                if resp.status == 200:
                    json_str = await resp.text()
                    result = json.loads(json_str)
                    for pic_dict in result['list']:
                        await download_picture(session, pic_dict['qhimg_url'])


def main():
    if not os.path.exists('images/beauty'):
        os.makedirs('images/beauty')
    loop = asyncio.get_event_loop()
    loop.run_until_complete(fetch_json())
    loop.close()


if __name__ == '__main__':
    main()
```

执行如下所示的命令。

```bash
time python3 example06.py
```

代码的执行结果如下所示：

```bash
python3 example06.py  0.82s user 0.21s system 27% cpu 3.782 total
```

### 总结

通过上面三段代码执行结果的比较，我们可以得出一个结论，使用多线程和异步 I/O 都可以改善爬虫程序的性能，因为我们不用将时间浪费在因 I/O 操作造成的等待和阻塞上，而`time`命令的执行结果也告诉我们，单线程的代码 CPU 利用率仅仅只有`12%`，而多线程版本的 CPU 利用率则高达`95%`；单线程版本的爬虫执行时间约`21`秒，而多线程和异步 I/O 的版本仅执行了`3`秒钟。另外，在运行时间差别不大的情况下，多线程的代码比异步 I/O 的代码耗费了更多的 CPU 资源，这是因为多线程的调度和切换也需要花费 CPU 时间。至此，三种方式在 I/O 密集型任务上的优劣已经一目了然，当然这只是在我的电脑上跑出来的结果。如果网络状况不是很理想或者目标网站响应很慢，那么使用多线程和异步 I/O 的优势将更为明显，有兴趣的读者可以自行试验。

## 使用Selenium抓取网页动态内容

根据权威机构发布的全球互联网可访问性审计报告，全球约有四分之三的网站其内容或部分内容是通过JavaScript动态生成的，这就意味着在浏览器窗口中“查看网页源代码”时无法在HTML代码中找到这些内容，也就是说我们之前用的抓取数据的方式无法正常运转了。解决这样的问题基本上有两种方案，一是获取提供动态内容的数据接口，这种方式也适用于抓取手机 App 的数据；另一种是通过自动化测试工具 Selenium 运行浏览器获取渲染后的动态内容。对于第一种方案，我们可以使用浏览器的“开发者工具”或者更为专业的抓包工具（如：Charles、Fiddler、Wireshark等）来获取到数据接口，后续的操作跟上一个章节中讲解的获取“360图片”网站的数据是一样的，这里我们不再进行赘述。这一章我们重点讲解如何使用自动化测试工具 Selenium 来获取网站的动态内容。

### 安装使用Selenium

我们可以先通过`pip`来安装 Selenium，命令如下所示。

```bash
pip install selenium
```

### 加载页面

接下来，我们通过下面的代码驱动 Chrome 浏览器打开百度。

```python
from selenium import webdriver

# 创建Chrome浏览器对象
browser = webdriver.Chrome()
# 加载指定的页面
browser.get('https://www.baidu.com/')
```

如果不愿意使用 Chrome 浏览器，也可以修改上面的代码操控其他浏览器，只需创建对应的浏览器对象（如 Firefox、Safari 等）即可。运行上面的程序，如果看到如下所示的错误提示，那是说明我们还没有将 Chrome 浏览器的驱动添加到 PATH 环境变量中，也没有在程序中指定 Chrome 浏览器驱动所在的位置。

```bash
selenium.common.exceptions.WebDriverException: Message: 'chromedriver' executable needs to be in PATH. Please see https://sites.google.com/a/chromium.org/chromedriver/home
```

解决这个问题的办法有三种：

1. 将下载的 ChromeDriver 放到已有的 PATH 环境变量下，建议直接跟 Python 解释器放在同一个目录，因为之前安装 Python 的时候我们已经将 Python 解释器的路径放到 PATH 环境变量中了。

2. 将 ChromeDriver 放到项目虚拟环境下的 `bin` 文件夹中（Windows 系统对应的目录是 `Scripts`），这样 ChromeDriver 就跟虚拟环境下的 Python 解释器在同一个位置，肯定是能够找到的。

3. 修改上面的代码，在创建 Chrome 对象时，通过`service`参数配置`Service`对象，并通过创建`Service`对象的`executable_path`参数指定 ChromeDriver 所在的位置，如下所示：

   ```python
   from selenium import webdriver
   from selenium.webdriver.chrome.service import Service
   
   browser = webdriver.Chrome(service=Service(executable_path='venv/bin/chromedriver'))
   browser.get('https://www.baidu.com/')
   ```

### 查找元素和模拟用户行为

接下来，我们可以尝试模拟用户在百度首页的文本框输入搜索关键字并点击“百度一下”按钮。在完成页面加载后，可以通过`Chrome`对象的`find_element`和`find_elements`方法来获取页面元素，Selenium 支持多种获取元素的方式，包括：CSS 选择器、XPath、元素名字（标签名）、元素 ID、类名等，前者可以获取单个页面元素（`WebElement`对象），后者可以获取多个页面元素构成的列表。获取到`WebElement`对象以后，可以通过`send_keys`来模拟用户输入行为，可以通过`click`来模拟用户点击操作，代码如下所示。

```python
from selenium import webdriver
from selenium.webdriver.common.by import By

browser = webdriver.Chrome()
browser.get('https://www.baidu.com/')
# 通过元素ID获取元素
kw_input = browser.find_element(By.ID, 'kw')
# 模拟用户输入行为
kw_input.send_keys('Python')
# 通过CSS选择器获取元素
su_button = browser.find_element(By.CSS_SELECTOR, '#su')
# 模拟用户点击行为
su_button.click()
```

如果要执行一个系列动作，例如模拟拖拽操作，可以创建`ActionChains`对象，有兴趣的读者可以自行研究。

### 隐式等待和显式等待

这里还有一个细节需要大家知道，网页上的元素可能是动态生成的，在我们使用`find_element`或`find_elements`方法获取的时候，可能还没有完成渲染，这时会引发`NoSuchElementException`错误。为了解决这个问题，我们可以使用隐式等待的方式，通过设置等待时间让浏览器完成对页面元素的渲染。除此之外，我们还可以使用显示等待，通过创建`WebDriverWait`对象，并设置等待时间和条件，当条件没有满足时，我们可以先等待再尝试进行后续的操作，具体的代码如下所示。

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait

browser = webdriver.Chrome()
# 设置浏览器窗口大小
browser.set_window_size(1200, 800)
browser.get('https://www.baidu.com/')
# 设置隐式等待时间为10秒
browser.implicitly_wait(10)
kw_input = browser.find_element(By.ID, 'kw')
kw_input.send_keys('Python')
su_button = browser.find_element(By.CSS_SELECTOR, '#su')
su_button.click()
# 创建显示等待对象
wait_obj = WebDriverWait(browser, 10)
# 设置等待条件（等搜索结果的div出现）
wait_obj.until(
    expected_conditions.presence_of_element_located(
        (By.CSS_SELECTOR, '#content_left')
    )
)
# 截屏
browser.get_screenshot_as_file('python_result.png')
```

上面设置的等待条件`presence_of_element_located`表示等待指定元素出现，下面的表格列出了常用的等待条件及其含义。

| 等待条件                                 | 具体含义                              |
| ---------------------------------------- | ------------------------------------- |
| `title_is / title_contains`              | 标题是指定的内容 / 标题包含指定的内容 |
| `visibility_of`                          | 元素可见                              |
| `presence_of_element_located`            | 定位的元素加载完成                    |
| `visibility_of_element_located`          | 定位的元素变得可见                    |
| `invisibility_of_element_located`        | 定位的元素变得不可见                  |
| `presence_of_all_elements_located`       | 定位的所有元素加载完成                |
| `text_to_be_present_in_element`          | 元素包含指定的内容                    |
| `text_to_be_present_in_element_value`    | 元素的`value`属性包含指定的内容       |
| `frame_to_be_available_and_switch_to_it` | 载入并切换到指定的内部窗口            |
| `element_to_be_clickable`                | 元素可点击                            |
| `element_to_be_selected`                 | 元素被选中                            |
| `element_located_to_be_selected`         | 定位的元素被选中                      |
| `alert_is_present`                       | 出现 Alert 弹窗                       |

### 执行JavaScript代码

对于使用瀑布式加载的页面，如果希望在浏览器窗口中加载更多的内容，可以通过浏览器对象的`execute_scripts`方法执行 JavaScript 代码来实现。对于一些高级的爬取操作，也很有可能会用到类似的操作，如果你的爬虫代码需要 JavaScript 的支持，建议先对 JavaScript 进行适当的了解，尤其是 JavaScript 中的 BOM 和 DOM 操作。我们在上面的代码中截屏之前加入下面的代码，这样就可以利用 JavaScript 将网页滚到最下方。

```python
# 执行JavaScript代码
browser.execute_script('document.documentElement.scrollTop = document.documentElement.scrollHeight')
```

### Selenium反爬的破解

有一些网站专门针对 Selenium 设置了反爬措施，因为使用 Selenium 驱动的浏览器，在控制台中可以看到如下所示的`webdriver`属性值为`true`，如果要绕过这项检查，可以在加载页面之前，先通过执行 JavaScript 代码将其修改为`undefined`。

[![img](https://github.com/jackfrued/Python-100-Days/raw/master/Day61-65/res/20220310154246.png)](https://github.com/jackfrued/Python-100-Days/blob/master/Day61-65/res/20220310154246.png)

另一方面，我们还可以将浏览器窗口上的“Chrome正受到自动测试软件的控制”隐藏掉，完整的代码如下所示。

```python
# 创建Chrome参数对象
options = webdriver.ChromeOptions()
# 添加试验性参数
options.add_experimental_option('excludeSwitches', ['enable-automation'])
options.add_experimental_option('useAutomationExtension', False)
# 创建Chrome浏览器对象并传入参数
browser = webdriver.Chrome(options=options)
# 执行Chrome开发者协议命令（在加载页面时执行指定的JavaScript代码）
browser.execute_cdp_cmd(
    'Page.addScriptToEvaluateOnNewDocument',
    {'source': 'Object.defineProperty(navigator, "webdriver", {get: () => undefined})'}
)
browser.set_window_size(1200, 800)
browser.get('https://www.baidu.com/')
```

### 无头浏览器

很多时候，我们在爬取数据时并不需要看到浏览器窗口，只要有 Chrome 浏览器以及对应的驱动程序，我们的爬虫就能够运转起来。如果不想看到浏览器窗口，我们可以通过下面的方式设置使用无头浏览器。

```
options = webdriver.ChromeOptions()
options.add_argument('--headless')
browser = webdriver.Chrome(options=options)
```

### API参考

Selenium 相关的知识还有很多，我们在此就不一一赘述了，下面为大家罗列一些浏览器对象和`WebElement`对象常用的属性和方法。具体的内容大家还可以参考 Selenium [官方文档的中文翻译](https://selenium-python-zh.readthedocs.io/en/latest/index.html)。

#### 浏览器对象

表1. 常用属性

| 属性名                  | 描述                             |
| ----------------------- | -------------------------------- |
| `current_url`           | 当前页面的URL                    |
| `current_window_handle` | 当前窗口的句柄（引用）           |
| `name`                  | 浏览器的名称                     |
| `orientation`           | 当前设备的方向（横屏、竖屏）     |
| `page_source`           | 当前页面的源代码（包括动态内容） |
| `title`                 | 当前页面的标题                   |
| `window_handles`        | 浏览器打开的所有窗口的句柄       |

表2. 常用方法

| 方法名                                 | 描述                                |
| -------------------------------------- | ----------------------------------- |
| `back` / `forward`                     | 在浏览历史记录中后退/前进           |
| `close` / `quit`                       | 关闭当前浏览器窗口 / 退出浏览器实例 |
| `get`                                  | 加载指定 URL 的页面到浏览器中       |
| `maximize_window`                      | 将浏览器窗口最大化                  |
| `refresh`                              | 刷新当前页面                        |
| `set_page_load_timeout`                | 设置页面加载超时时间                |
| `set_script_timeout`                   | 设置 JavaScript 执行超时时间        |
| `implicit_wait`                        | 设置等待元素被找到或目标指令完成    |
| `get_cookie` / `get_cookies`           | 获取指定的Cookie / 获取所有Cookie   |
| `add_cookie`                           | 添加 Cookie 信息                    |
| `delete_cookie` / `delete_all_cookies` | 删除指定的 Cookie / 删除所有 Cookie |
| `find_element` / `find_elements`       | 查找单个元素 / 查找一系列元素       |

#### WebElement对象

表1. WebElement常用属性

| 属性名     | 描述           |
| ---------- | -------------- |
| `location` | 元素的位置     |
| `size`     | 元素的尺寸     |
| `text`     | 元素的文本内容 |
| `id`       | 元素的 ID      |
| `tag_name` | 元素的标签名   |

表2. 常用方法

| 方法名                           | 描述                                 |
| -------------------------------- | ------------------------------------ |
| `clear`                          | 清空文本框或文本域中的内容           |
| `click`                          | 点击元素                             |
| `get_attribute`                  | 获取元素的属性值                     |
| `is_displayed`                   | 判断元素对于用户是否可见             |
| `is_enabled`                     | 判断元素是否处于可用状态             |
| `is_selected`                    | 判断元素（单选框和复选框）是否被选中 |
| `send_keys`                      | 模拟输入文本                         |
| `submit`                         | 提交表单                             |
| `value_of_css_property`          | 获取指定的CSS属性值                  |
| `find_element` / `find_elements` | 获取单个子元素 / 获取一系列子元素    |
| `screenshot`                     | 为元素生成快照                       |

### 简单案例

下面的例子演示了如何使用 Selenium 从“360图片”网站搜索和下载图片。

```python
import os
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

DOWNLOAD_PATH = 'images/'


def download_picture(picture_url: str):
    """
    下载保存图片
    :param picture_url: 图片的URL
    """
    filename = picture_url[picture_url.rfind('/') + 1:]
    resp = requests.get(picture_url)
    with open(os.path.join(DOWNLOAD_PATH, filename), 'wb') as file:
        file.write(resp.content)


if not os.path.exists(DOWNLOAD_PATH):
    os.makedirs(DOWNLOAD_PATH)
browser = webdriver.Chrome()
browser.get('https://image.so.com/z?ch=beauty')
browser.implicitly_wait(10)
kw_input = browser.find_element(By.CSS_SELECTOR, 'input[name=q]')
kw_input.send_keys('苍老师')
kw_input.send_keys(Keys.ENTER)
for _ in range(10):
    browser.execute_script(
        'document.documentElement.scrollTop = document.documentElement.scrollHeight'
    )
    time.sleep(1)
imgs = browser.find_elements(By.CSS_SELECTOR, 'div.waterfall img')
with ThreadPoolExecutor(max_workers=32) as pool:
    for img in imgs:
        pic_url = img.get_attribute('src')
        pool.submit(download_picture, pic_url)
```

## playwright 

### 安装 Playwright 

```bash
pip install pytest-playwright
```

安装所需的浏览器：

```bash
playwright install
```

::: tip

关于Windows上为什么不需要显式运行 playwright install 就能运行的问题，这主要与Playwright在不同操作系统上的行为差异有关，可能有以下几个原因：

1. 微软优化 ：由于Playwright是由微软开发的，它对Windows系统进行了特别优化，可能默认会优先查找系统中已安装的浏览器。
2. 自动查找系统浏览器 ：在Windows上，Playwright可能会自动搜索常见位置（如Program Files目录）中已安装的Chrome/Edge浏览器，并在找不到内置浏览器时尝试使用这些系统浏览器。
3. 标准安装路径 ：Windows系统上的浏览器通常安装在标准位置，使得Playwright可以更容易地找到并使用它们。
4. 环境变量和配置 ：Windows环境下可能存在特定的环境变量或注册表配置，帮助Playwright定位浏览器。
5. 打包行为差异 ：在Windows上使用PyInstaller打包时，可能会包含更多的系统路径信息，使得打包后的应用仍能找到系统浏览器。

:::

### 启动

::: warning

Playwright 的 API 不是线程安全的。如果您在多线程环境中使用 Playwright，则应为每个线程创建一个 Playwright 实例

:::

安装完成后，您可以`import`在 Python 脚本中使用 Playwright，并启动 3 个浏览器（`chromium`、`firefox`和`webkit`）中的任何一个。

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://playwright.dev")
    print(page.title())
    browser.close()
```

Playwright 支持两种 API 版本：同步和异步。如果您的现代项目使用[asyncio](https://docs.python.org/3/library/asyncio.html)，则应使用异步 API：

```python
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("https://playwright.dev")
        print(await page.title())
        await browser.close()

asyncio.run(main())
```

::: tip

默认情况下，Playwright 以无头模式运行浏览器。要查看浏览器用户界面，请将[headless](https://playwright.dev/python/docs/api/class-browsertype#browser-type-launch-option-headless)选项设置为 true `False`。

```python
firefox.launch(headless=False, slow_mo=50)
```

:::

### 交互

Playwright 可以与 HTML 输入元素（例如文本输入框、复选框、单选按钮、选择选项、鼠标点击、键入字符、按键和快捷键）进行交互，还可以上传文件和聚焦元素。

#### 文本输入

使用[`locator.fill()`](https://playwright.dev/python/docs/api/class-locator#locator-fill)是填充表单字段最简单的方法。它会聚焦元素并触发一个`input`事件，并将输入的文本传递给该元素。它适用于 `<div>`、`<span>``<input>`和`<textarea>`` `[contenteditable]`<span>` 元素。

::: tip

大多数情况下，你应该使用[`locator.fill()`](https://playwright.dev/python/docs/api/class-locator#locator-fill)方法。只有当页面有特殊的键盘处理功能时，才需要逐个按键。

```python
locator.press_sequentially("hello") # types instantly
locator.press_sequentially("world", delay=100) # types slower, like a user
```

:::

#### 复选框和单选

[使用`locator.select_option()`](https://playwright.dev/python/docs/api/class-locator#locator-select-option)`<select>`选择元素中的一个或多个选项。您可以指定要选择的选项名称。可以选择多个选项。`value``label`

#### 鼠标

::: tip

大多数情况下，Playwright 会在执行任何操作之前自动滚动页面。因此，您无需手动滚动。

:::

执行简单的人眼点击操作。`click()`

```python
# Generic click
page.get_by_role("button").click()

# Double click
page.get_by_text("Item").dblclick()

# Right click
page.get_by_text("Item").click(button="right")

# Shift + click
page.get_by_text("Item").click(modifiers=["Shift"])

# Hover over element
page.get_by_text("Item").hover()

# Click the top left corner
page.get_by_text("Item").click(position={ "x": 0, "y": 0})
```

##### 程序化

如果您不想在真实环境下测试您的应用程序，而想尽可能地模拟点击操作，您可以通过使用[locator.dispatch_event()](https://playwright.dev/python/docs/api/class-locator#locator-dispatch-event)[`HTMLElement.click()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click)在元素上分发点击事件来触发该行为：

```python
page.get_by_role("button").dispatch_event('click')
```

#### 快捷键

```python
# Hit Enter
page.get_by_text("Submit").press("Enter")

# Dispatch Control+Right
page.get_by_role("textbox").press("Control+ArrowRight")

# Press $ sign on keyboard
page.get_by_role("textbox").press("$")
```

locator.press [()](https://playwright.dev/python/docs/api/class-locator#locator-press)方法会使选中的元素获得焦点，并触发一次按键。它接受键盘事件的[keyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)属性中定义的逻辑键名：

```txt
Backquote, Minus, Equal, Backslash, Backspace, Tab, Delete, Escape,
ArrowDown, End, Enter, Home, Insert, PageDown, PageUp, ArrowRight,
ArrowUp, F1 - F12, Digit0 - Digit9, KeyA - KeyZ, etc.
```

- 您也可以指定要生成的单个字符，例如`"a"`或`"#"`。
- 同时支持以下修改快捷键：`Shift, Control, Alt, Meta`。

#### 焦点和拖拽

[对于处理焦点事件的动态页面，您可以使用locator.focus()](https://playwright.dev/python/docs/api/class-locator#locator-focus)使给定元素获得焦点。

```python
page.get_by_label('password').focus()
```

[您可以使用locator.drag_to()](https://playwright.dev/python/docs/api/class-locator#locator-drag-to)执行拖放操作。此方法将：

- 将鼠标悬停在要拖动的元素上。
- 按下鼠标左键。
- 将鼠标移至将接收拖放物的元素上。
- 松开鼠标左键。

```python
page.locator("#item-to-be-dragged").drag_to(page.locator("#item-to-drop-at"))
```

#### 滚动屏幕

然而，在极少数情况下，您可能需要手动滚动页面。例如，您可能需要强制“无限列表”加载更多元素，或者为了截取特定屏幕截图而调整页面位置。在这种情况下，最可靠的方法是找到您想要显示在底部的元素，然后将其滚动到可视区域

```python
# Scroll the footer into view, forcing an "infinite list" to load more content
page.get_by_text("Footer text").scroll_into_view_if_needed()
```

### 自动等待

Playwright 在执行操作之前会对元素进行一系列可操作性检查，以确保这些操作按预期运行。它会自动等待所有相关检查通过，然后才执行请求的操作。如果在给定的时间内所需的检查未通过`timeout`，则操作失败并显示错误信息`TimeoutError`。

例如，对于[locator.click()](https://playwright.dev/python/docs/api/class-locator#locator-click)，Playwright 将确保：

- 定位器解析为恰好一个元素
- 元素[可见](https://playwright.dev/python/docs/actionability#visible)
- 元素状态[稳定](https://playwright.dev/python/docs/actionability#stable)，即未进行动画或动画已完成。
- 元素[接收事件](https://playwright.dev/python/docs/actionability#receives-events)，即未被其他元素遮挡
- 元素已[启用](https://playwright.dev/python/docs/actionability#enabled)

- 