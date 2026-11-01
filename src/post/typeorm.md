## TypeORM：Active Record vs Data Mapper，以及 Nest 里怎么用

> 参考：
>
> - [TypeORM：Active Record vs Data Mapper](https://typeorm.io/docs/guides/active-record-data-mapper#what-is-the-data-mapper-pattern)
> - [NestJS：Database / TypeORM](https://docs.nestjs.com/data/typeorm)（含 [Async configuration](https://docs.nestjs.com/data/typeorm#async-configuration)）

### 一句话结论

**Data Mapper = 实体只管「长什么样」，查库 / 存库交给 Repository（仓库）。**

Nest 官方 `@nestjs/typeorm` 集成默认就是这套，而不是 Active Record。

---

### 两种模式在争什么

争论点只有一个：**访问数据库的代码写在哪。**

| | Active Record（活动记录） | Data Mapper（数据映射器） |
| --- | --- | --- |
| 实体类 | 会自己 `save()` / `find()` | 基本只定义字段，很「笨」 |
| 谁负责 DB | 模型自己 | 独立的 Repository |
| 生活类比 | 人自己去银行办业务 | 人只是信息；柜员（Repository）帮你办 |
| 适合场景 | 小项目、脚本、Demo | 中大型应用、Nest 正式服务 |

TypeORM 文档的建议：Data Mapper 更利于可维护性（大应用）；Active Record 更简单（小应用）。

---

### Active Record：对象自己管数据库

实体继承 `BaseEntity`，CRUD 方法挂在实体上。

```ts
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  isActive: boolean;

  // 自定义查询也可以写成静态方法
  static findByName(firstName: string, lastName: string) {
    return this.createQueryBuilder('user')
      .where('user.firstName = :firstName', { firstName })
      .andWhere('user.lastName = :lastName', { lastName })
      .getMany();
  }
}
```

用法：

```ts
const user = new User();
user.firstName = 'Timber';
user.lastName = 'Saw';
user.isActive = true;
await user.save(); // 对象自己存

const timber = await User.findOneBy({ firstName: 'Timber', lastName: 'Saw' });
const list = await User.findByName('Timber', 'Saw');
await user.remove();
```

**优点**：写法短、上手快。  
**缺点**：查询逻辑堆进实体，大项目难测、难拆、难复用。

---

### Data Mapper：实体哑、仓库聪明

实体不继承 `BaseEntity`，只描述表结构；所有数据库访问走 Repository。

```ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  isActive: boolean;
}
```

用法：

```ts
const userRepository = dataSource.getRepository(User);

const user = new User();
user.firstName = 'Timber';
user.lastName = 'Saw';
user.isActive = true;
await userRepository.save(user); // 仓库存

const users = await userRepository.find({ skip: 2, take: 5 });
const timber = await userRepository.findOneBy({
  firstName: 'Timber',
  lastName: 'Saw',
});
await userRepository.remove(user);
```

核心分工：

1. **Entity** = 数据结构（映射到表的一行）
2. **Repository** = 数据访问层（CRUD、查询）
3. **Service / 业务代码** 调用 Repository，不让实体直接碰数据库

这也是文档说的：entities are very dumb — they just define their properties。

---

### 同一需求：按姓名查用户

#### Active Record

```ts
await User.findByName('Timber', 'Saw');
```

查询写在 `User` 类里。

#### Data Mapper（Nest 常见写法）

```ts
// user.entity.ts —— 只定义字段
@Entity()
export class User {
  /* id, firstName, lastName, isActive */
}

// users.service.ts —— 通过注入的 Repository 查
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findByName(firstName: string, lastName: string) {
    return this.usersRepository.findBy({ firstName, lastName });
  }
}
```

业务层依赖的是 `Repository<User>`，不是 `User.save()`。单测可以 mock Repository，不必真连库。

---

### Nest 官方集成默认就是 Data Mapper

[NestJS TypeORM 文档](https://docs.nestjs.com/data/typeorm) 整章默认走 **Data Mapper + Repository**，几乎不推 Active Record。

#### 调用链

```
Controller → Service → Repository → DB
               ↑            ↑
            业务逻辑     数据访问（TypeORM）
```

#### 三步拼法

1. **`TypeOrmModule.forRoot(...)`**：建立连接（DataSource）
2. **`TypeOrmModule.forFeature([User])`**：在本模块注册 `User` 的 Repository
3. **`@InjectRepository(User)`**：把仓库注入 Service

```ts
// app.module.ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true, // 生产环境不要开，可能丢数据
    }),
  ],
})
export class AppModule {}

// users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async create(dto: CreateUserDto) {
    const user = this.usersRepository.create(dto); // 只拼对象，不写库
    return this.usersRepository.save(user); // 仓库负责落库
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
```

注意：`repository.create()` 不会写库，只是组装实体对象；真正落库的是 `save()`——都挂在 Repository 上，符合 Data Mapper。

#### 为什么 Nest 更偏 Data Mapper

1. **契合依赖注入**：注入 `Repository<User>`，测试可用 `getRepositoryToken(User)` mock
2. **职责清晰**：Entity 不堆查询；Service 不直接碰连接细节
3. **模块边界清楚**：`forFeature([User])` 明确哪些模块能碰哪些表

---

### 记忆口诀

- **Active Record**：`user.save()` —— 对象自己干活
- **Data Mapper**：`userRepository.save(user)` —— 仓库干活，对象只是数据
- **Nest**：`forRoot` / `forRootAsync` 管连接；`forFeature` + `@InjectRepository` 管仓库；实体保持「哑」

小脚本可以用 Active Record；做 Nest 正式服务，默认走 Data Mapper。

## 列类型

> 参考：[TypeORM：Column types](https://typeorm.io/docs/entity/entities#column-types)

### 一句话结论

**列类型跟数据库绑定**——你写什么类型，库里就建什么类型；TypeORM 再额外提供几类「跨库友好」的特殊类型（`simple-*`、`vector` 等）。

---

### 怎么写类型

两种等价写法：

```ts
@Column("int")
@Column({ type: "int" })
```

需要额外参数时走 options：

```ts
@Column("varchar", { length: 200 })
// 或
@Column({ type: "varchar", length: 200 })
```

#### 不写 `type` 会怎样？

**会按 TypeScript 属性类型推断**（文档对 `@PrimaryColumn` 明确写了；普通 `@Column()` 同样适用）。前提是开了装饰器元数据：

- `import "reflect-metadata"`
- `tsconfig`：`emitDecoratorMetadata: true`、`experimentalDecorators: true`

常见映射（文档示例）：

| TS 类型 | 推断出的列类型（约） |
| --- | --- |
| `string` | `varchar(255)` |
| `number` | `int` |
| `boolean` | `boolean` |
| `Date` | `datetime` / `timestamp`（因库而异） |

```ts
@Column()          // ← 没写 type
firstName: string; // → varchar(255)

@Column()
isActive: boolean; // → boolean
```

推断只覆盖这些「反射能拿到」的基础类型。`enum`、`simple-json`、`vector`、定长 `varchar(200)`、`decimal(10,2)` 等仍需显式写 `type` / options。

**`bigint` 注意**：SQL 里的 `bigint` 超出 JS `number` 安全范围，TypeORM 会把属性映射成 **`string`**，不是 `number`。

---

### 常用特殊类型

#### 1. `enum`（原生枚举）

仅 **Postgres / MySQL** 支持。可用 TS enum，也可用字符串数组：

```ts
export enum UserRole {
  ADMIN = "admin",
  EDITOR = "editor",
  GHOST = "ghost",
}

@Column({
  type: "enum",
  enum: UserRole,
  default: UserRole.GHOST,
})
role: UserRole;

// 或
@Column({
  type: "enum",
  enum: ["admin", "editor", "ghost"],
  default: "ghost",
})
role: "admin" | "editor" | "ghost";
```

字符串 / 数字 / 异构 enum 都支持。

#### 2. `simple-enum`（跨库枚举）

实体要跑在「有的库有原生 enum、有的没有」时用它。TypeORM 会按驱动适配：

| 数据库 | 实际存储 |
| --- | --- |
| MySQL / MariaDB | 原生 `enum` |
| Postgres / CockroachDB | 原生 enum 类型 |
| SQLite / SQL Server | 字符串列 + `CHECK` |
| SAP HANA | `nvarchar`（无 CHECK） |
| Oracle / Spanner | **不支持** |

用法和 `enum` 几乎一样，只是 `type: "simple-enum"`。Postgres / Cockroach / SQLite 还可 `array: true` 存枚举数组（SQLite 用逗号拼接，值里不能有逗号）。

#### 3. `simple-array`（逗号拼数组）

一个字符串列，存逗号分隔的原始值：

```ts
@Column("simple-array")
names: string[];

// 写入 ["Alexander", "Alex"] → 库里 "Alexander,Alex"
```

**值里不能有逗号**，否则拆不开。

#### 4. `simple-json`（JSON 字符串）

没有原生 JSON 类型、又想随便存对象时用。走 `JSON.stringify` / `JSON.parse`：

```ts
@Column("simple-json")
profile: { name: string; nickname: string };

// → 库里 {"name":"John","nickname":"Malkovich"}
```

---

### 生成值：`@Generated`

主键以外的列也可以让库/ORM 自动生成：

```ts
@Column()
@Generated("uuid")
uuid: string;
```

可选策略：`"uuid"` | `"increment"` | `"identity"`（仅 Postgres 10+）| `"rowid"`（仅 CockroachDB）。部分库对自增列数量、是否必须是主键有限制。

---

### Vector 列（向量 / embedding）

用于相似度搜索、ML embedding。支持：

| 类型 | 精度 | 支持库 |
| --- | --- | --- |
| `vector` | 4 字节 float | MariaDB/MySQL、SQL Server、Postgres（pgvector）、SAP HANA Cloud |
| `halfvec` | 2 字节 float | Postgres（pgvector）、SAP HANA Cloud |

```ts
@Column("vector")
embedding: number[] | Buffer;

@Column("vector", { length: 3 }) // vector(3)
embedding_3d: number[] | Buffer;

@Column("halfvec", { length: 4 })
halfvec_embedding: number[] | Buffer;
```

版本门槛：MariaDB 11.7+ / MySQL 9+；SQL Server 2025+；Postgres 需装 `pgvector`。

---

### Spatial 列（空间几何）

MS SQL、MySQL/MariaDB、Postgres/Cockroach、SAP HANA 都支持，列名因库而异。

**MS SQL / MySQL / SAP HANA**：用 WKT 字符串：

```ts
@Column("point")
point: string; // "POINT(1 1)"

@Column("linestring")
linestring: string; // "LINESTRING(0 0,1 1,2 2)"
```

Postgres/Cockroach 另见 PostGIS 相关类型。

---

### 列选项速查（`ColumnOptions`）

写在 `@Column({ ... })` 里，常用这些：

| 选项 | 作用 |
| --- | --- |
| `type` / `length` / `precision` / `scale` | 类型与精度 |
| `name` | 库里的列名（默认用属性名） |
| `nullable` | 默认 `false`（`NOT NULL`） |
| `unique` / `primary` | 唯一 / 主键 |
| `default` | 库级默认值 |
| `select: false` | 普通查询默认不查出（适合密码哈希） |
| `insert` / `update` | 是否参与首次插入 / 后续 save 更新 |
| `enum` / `enumName` | 枚举值与枚举类型名 |
| `array: true` | Postgres/Cockroach 数组列 |
| `transformer` | 读写时做自定义转换（可数组串联） |
| `asExpression` + `generatedType` | 生成列（VIRTUAL / STORED） |
| `unsigned` | 仅 MySQL 无符号数 |
| `onUpdate` | 仅 MySQL 的 `ON UPDATE` |
| `utc` | 仅 `date`：是否按 UTC 存取（默认本地时区） |

多数选项是 RDBMS 专用，MongoDB 基本用不上。

---

### 记忆口诀

- **写法**：`@Column("int")` ≡ `@Column({ type: "int" })`
- **bigint → string**，别当成 number
- **原生 enum**：Postgres/MySQL；**跨库**用 `simple-enum`
- **simple-array / simple-json**：没有原生类型时的「字符串兜底」
- **vector / halfvec**：存 embedding；**spatial**：存几何（WKT 或 PostGIS）
- **敏感列**：`select: false`；**只写一次**：`update: false`

## 树状实体

> 参考：[TypeORM：Tree entities](https://typeorm.io/docs/entity/tree-entities)

### 一句话结论

存树常用两种约定：

| | 邻接表 | 闭包表 |
| --- | --- | --- |
| 记什么 | 每行只记**直属父**（`parent_id`） | 另表记下**所有祖先–后代**对 |
| 像什么 | 每人只知道直属老板 | 通讯录把所有汇报线都写好 |
| 读整棵子树 | 慢（递归 / 多次查） | 快（一条 SQL） |
| 改父节点 | 简单（改一行） | 要维护多行关系 |
| TypeORM | 自己 `@ManyToOne` 自关联 | `@Tree("closure-table")` + `TreeRepository` |

---

### 邻接表是啥（用人话说）

每个人只知道自己的直属老板：

```
张三（根，没有上级）
 ├── 李四
 │    └── 王五
 └── 赵六
```

| 名字 | parent_id（我的老板） |
| --- | --- |
| 张三 | null |
| 李四 | 张三 |
| 王五 | 李四 |
| 赵六 | 张三 |

查下一级、改上级都简单；要一次拉超深整树就费劲（要递归 / 多次查）。

---

### 场景 1：电商商品分类（最常见）

**需求**：左侧分类树；点「手机」列子类；面包屑：首页 > 电子 > 手机。

```
电子
├── 手机
│   ├── 苹果
│   └── 安卓
└── 电脑
```

| id | name | parent_id |
| --- | --- | --- |
| 1 | 电子 | null |
| 2 | 手机 | 1 |
| 3 | 电脑 | 1 |
| 4 | 苹果 | 2 |
| 5 | 安卓 | 2 |

```ts
// 打开「手机」：查直接子分类
await repo.find({ where: { parent: { id: 2 } } }); // → 苹果、安卓

// 面包屑：从当前节点一路找 parent
let cur = await repo.findOne({ where: { id: 4 }, relations: ["parent"] });
// 苹果 → 手机 → 电子 → null

// 新增「华为」挂在手机下（只改一行 parent_id）
await repo.save({ name: "华为", parent: { id: 2 } });
```

**适合**：分类常增删、挪位置；层级不深（一般 2～4 层）。

---

### 场景 2：公司组织 / 汇报线

**需求**：查直属下级；人事调整改汇报对象。

| id | name | parent_id |
| --- | --- | --- |
| 1 | 张总 | null |
| 2 | 李经理 | 1 |
| 3 | 王员工 | 2 |

```ts
// 李经理的直接下属
await repo.find({ where: { parent: { id: 2 } } });

// 王员工改挂张总：只改 parent_id
await repo.update(3, { parent: { id: 1 } });
```

**适合**：变动频繁、多数只关心上下一级，很少一次拉全公司万人树。

---

### 场景 3：评论楼中楼

**需求**：帖子下评论，可回复某条评论。

| id | content | parent_id |
| --- | --- | --- |
| 1 | 写得真好 | null（顶层） |
| 2 | +1 | 1 |
| 3 | 不同意 | 1 |
| 4 | 你说得对 | 2 |

```ts
// 顶层评论
await repo.find({ where: { postId, parent: IsNull() } });

// 某条的直接回复
await repo.find({ where: { parent: { id: 1 } } });
```

**适合**：UI 本来就是「点开再加载下一级」，和邻接表查询方式一致。

---

### 场景 4：后台菜单 / 权限树

**需求**：侧边栏多级菜单；角色勾选菜单。

| id | title | parent_id |
| --- | --- | --- |
| 1 | 系统管理 | null |
| 2 | 用户管理 | 1 |
| 3 | 角色管理 | 1 |

登录后：查根 → 按 `parent_id` 挂 children → 拼成前端树。菜单通常只有几十～一两百项，邻接表够用。

---

### 什么时候邻接表会难受

| 需求 | 邻接表 |
| --- | --- |
| 只要直接子 / 直接父 | 很好（一条 SQL） |
| 改父节点、加叶子 | 很好（改一行） |
| 「电子」下**所有后代**（含孙子） | 差：要递归或多次查 |
| 一次渲染**超深大树**（几千节点） | 差 |

这时再考虑闭包表（下一节）。

---

### TypeORM 写法：邻接表

```ts
@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 单向：只写这一边就够，库里会有 parentId
  @ManyToOne(() => Category, { nullable: true })
  parent: Category | null;

  // 下面可选：想从父节点读 children、或双向级联时再加
  // @ManyToOne(() => Category, (c) => c.children, { nullable: true })
  // parent: Category | null;
  // @OneToMany(() => Category, (c) => c.parent)
  // children: Category[];
}
```

库表本质：`category(id, name, parentId)`——**外键只由 `@ManyToOne` 产生**。  
`@OneToMany children` **不是必须**：不写也能 `find({ where: { parent: { id: 2 } } })` 查子节点；写了才能 `relations: ['children']` 从父对象上拿数组。  

注意：文档写明 **`TreeRepository` 不支持邻接表**，只能自己用 Repository / QueryBuilder 查。

---

### 闭包表是啥（用人话说）

邻接表只记「直属老板」；**闭包表额外建一张关系表，把每一对「祖先 → 后代」都存下来**（含自己到自己）。

还是这棵树：

```
电子(1)
├── 手机(2)
│   ├── 苹果(4)
│   └── 安卓(5)
└── 电脑(3)
```

**节点表**还在（有的实现仍带 `parent`，方便改结构）：

| id | name |
| --- | --- |
| 1 | 电子 |
| 2 | 手机 |
| 3 | 电脑 |
| 4 | 苹果 |
| 5 | 安卓 |

**闭包关系表**（核心，TypeORM 会自动建，大致叫 `category_closure`）：

| ancestor_id（祖先） | descendant_id（后代） | 含义 |
| --- | --- | --- |
| 1 | 1 | 电子 → 自己 |
| 1 | 2 | 电子 → 手机 |
| 1 | 3 | 电子 → 电脑 |
| 1 | 4 | 电子 → 苹果 |
| 1 | 5 | 电子 → 安卓 |
| 2 | 2 | 手机 → 自己 |
| 2 | 4 | 手机 → 苹果 |
| 2 | 5 | 手机 → 安卓 |
| 3 | 3 | 电脑 → 自己 |
| 4 | 4 | 苹果 → 自己 |
| 5 | 5 | 安卓 → 自己 |

问「电子下面所有分类（含孙子）」→ `WHERE ancestor_id = 1` 一次搞定。  
问「苹果的所有上级」→ `WHERE descendant_id = 4` 一次搞定。

自己到自己那一行必须有，方便统一用同一套 SQL。

---

### 闭包表适合哪些场景

#### 1. 分类下「所有商品 / 所有子类」

点「电子」要搜出手机、苹果、安卓、电脑下的**全部**商品，不是只看直接子类。

```ts
const treeRepo = dataSource.getTreeRepository(Category);
const allUnderElectronics = await treeRepo.findDescendants(electronics);
// 手机、电脑、苹果、安卓……一条链路查完
```

邻接表要递归；闭包表扫关系表即可。

#### 2. 权限：勾了父菜单 = 子孙菜单都算有权

角色勾了「系统管理」，要算出用户管理、角色管理等**整棵子树**的 menuId 列表做鉴权。

```ts
const allowed = await treeRepo.findDescendants(systemMenu);
// 一次拿到所有子孙 menu id
```

#### 3. 组织：算某人的全部下属（含隔级）

发公告 / 算 KPI：「李经理名下所有人」（含王员工的下属的下属）。

```ts
await treeRepo.findDescendants(liManager); // 扁平全部后代
await treeRepo.findDescendantsTree(liManager); // 嵌套成树
await treeRepo.findAncestors(wang); // 王员工一路上级到根
```

#### 4. 后台要一次渲染整棵深树

菜单或分类很深、节点多，前端树组件要整棵 JSON。

```ts
await treeRepo.findTrees(); // 所有根 + 全部子孙嵌套
await treeRepo.findTrees({ depth: 2 }); // 限深度
```

---

### 闭包表的代价（写比邻接表贵）

新增「苹果」挂在「手机」下，关系表至少要插：

- `(4, 4)` 自己  
- `(2, 4)` 手机 → 苹果  
- `(1, 4)` 电子 → 苹果（手机的所有祖先都要加）

把「安卓」从「手机」挪到「电脑」下：要删掉旧祖先关系，再按新路径补一批——**读快、搬节点时写多**。

| 操作 | 邻接表 | 闭包表 |
| --- | --- | --- |
| 查直接子 / 父 | 快 | 快 |
| 查全部子孙 / 祖先 | 慢 | **快** |
| 新增叶子 | 改 1 行 | 插多行关系 |
| 挪整棵子树 | 改 1 个 parent | 要批量改关系表 |

文档评价闭包表：**读写都相对高效**（比 nested-set 更均衡）；真正极简、只关心上下一级时，邻接表仍更省事。

---

### TypeORM 写法：闭包表

```ts
@Entity()
@Tree("closure-table")
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;

  // 可选：层级列
  // @TreeLevelColumn()
  // level: number;
}
```

可自定义闭包表名 / 列名：

```ts
@Tree("closure-table", {
  closureTableName: "category",
  ancestorColumnName: (col) => "ancestor_" + col.propertyName,
  descendantColumnName: (col) => "descendant_" + col.propertyName,
})
```

绑定关系：**在子节点上设 `parent`，再 save**（TypeORM 会维护闭包表）：

```ts
const phone = new Category();
phone.name = "手机";
phone.parent = electronics;
await manager.save(phone);
```

查树用 **`TreeRepository`**（不是普通 Repository）：

```ts
const repo = dataSource.manager.getTreeRepository(Category);

await repo.findTrees(); // 整森林
await repo.findRoots(); // 只有根，不带子孙
await repo.findDescendants(node); // 全部后代（扁平）
await repo.findDescendantsTree(node); // 后代嵌套成树
await repo.findAncestors(node); // 全部祖先（扁平）
await repo.findAncestorsTree(node); // 祖先嵌套成树
await repo.countDescendants(node);
await repo.countAncestors(node);
```

---

### 嵌套集（Nested Set）是啥

还是这棵树，给每个节点两个数：**左值 lft、右值 rgt**（深度优先走一圈：进去记左，出来记右）：

```
电子 (1 ────────────── 10)
 ├── 手机 (2 ──── 7)
 │    ├── 苹果 (3,4)
 │    └── 安卓 (5,6)
 └── 电脑 (8,9)
```

| id | name | lft | rgt |
| --- | --- | --- | --- |
| 1 | 电子 | 1 | 10 |
| 2 | 手机 | 2 | 7 |
| 4 | 苹果 | 3 | 4 |
| 5 | 安卓 | 5 | 6 |
| 3 | 电脑 | 8 | 9 |

**怎么读**：某个节点的全部子孙 = `lft` 落在「父的 lft～rgt」之间。

```sql
-- 手机(2,7) 下所有：苹果、安卓
SELECT * FROM category WHERE lft BETWEEN 2 AND 7;
```

一条区间查询就能拿整棵子树，**读非常快**。

**怎么写（贵）**：在中间插一个新节点，后面一串节点的 lft/rgt 都要 `+2` 挪位置——像在密麻麻的编号里塞进两个号。  
文档也写了：[嵌套集读高效、写差，且不能有多个根](https://typeorm.io/docs/entity/tree-entities)。

**适合**：分类树几乎不怎么改结构，但经常「一次查出某类下全部」。  
**不适合**：组织架构天天调岗、菜单经常拖拽改层级。

```ts
@Entity()
@Tree("nested-set")
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;
}
```

TypeORM 自己维护 lft/rgt，你仍用 `TreeRepository` 查。

---

### 物化路径（Materialized Path）是啥

给每个节点存一条**从根到自己的路径字符串**（也叫 Path Enumeration）：

```
电子
├── 手机
│   ├── 苹果
│   └── 安卓
└── 电脑
```

| id | name | path（示意） |
| --- | --- | --- |
| 1 | 电子 | `1/` 或 `/1/` |
| 2 | 手机 | `1/2/` |
| 3 | 电脑 | `1/3/` |
| 4 | 苹果 | `1/2/4/` |
| 5 | 安卓 | `1/2/5/` |

（TypeORM 会用自己的 `mpath` 列存，格式由实现决定，思想一样。）

**怎么读**：

```sql
-- 手机下所有子孙（含自己或不含，看你 LIKE 怎么写）
SELECT * FROM category WHERE path LIKE '1/2/%';
```

**祖先**：把 path 拆开 `1` → `2` → `4` 就能还原面包屑。

**怎么写**：新增叶子 = 父 path + 自己 id，通常只改一行；  
**挪子树** = 该节点及其子孙的 path 都要改前缀（字符串替换），比邻接表麻烦，比嵌套集往往好懂。

文档评价：[简单有效](https://typeorm.io/docs/entity/tree-entities)。

```ts
@Entity()
@Tree("materialized-path")
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;
}
```

同样走 `TreeRepository`；绑关系仍是 **子节点设 `parent` 再 save**。

---

### 四种树存法对照（同一需求）

还是「查手机下所有分类」+「把安卓挪到电脑下」：

| | 邻接表 | 闭包表 | 嵌套集 | 物化路径 |
| --- | --- | --- | --- | --- |
| 多存什么 | `parent_id` | 祖先–后代关系表 | `lft` / `rgt` | 路径字符串 |
| 查整棵子树 | 递归 / 多次 | 快（扫关系表） | **最快之一**（区间） | 快（`LIKE` 前缀） |
| 改父 / 挪节点 | **最简单** | 要改多行关系 | **最痛苦**（重算编号） | 中等（改子孙 path） |
| 多根（多棵树） | 可以 | 可以 | **文档：不行** | 可以 |
| TypeORM | 自关联，无 TreeRepository | `@Tree("closure-table")` | `@Tree("nested-set")` | `@Tree("materialized-path")` |

人话类比：

- **邻接表**：每人只记直属老板  
- **闭包表**：通讯录写全所有汇报线  
- **嵌套集**：给整棵树编「括号区间号」，查区间很快，改号很烦  
- **物化路径**：每人胸口写「祖宗/爷爷/爸爸/我」完整门牌  

---

### 怎么选（结合场景）

| 场景 | 更合适 |
| --- | --- |
| 评论楼中楼、一层层点开加载 | 邻接表 |
| 组织常调岗、多数只查直属 | 邻接表 |
| 分类 / 菜单浅、节点少 | 邻接表往往够 |
| 「该节点下所有子孙」是高频 + 结构也常改 | **闭包表**（读写较均衡） |
| 结构几乎不动，疯狂按子树查询 | **嵌套集** |
| 想实现简单、用 path 前缀查子孙 | **物化路径** |
| 权限按子树批量算、一次渲染深树 | 闭包表或物化路径 |

带 `@Tree(...)` 的三种（嵌套集 / 物化路径 / 闭包表）都能用同一套 `TreeRepository` API；**邻接表不行**，要自己查。

---

### 记忆口诀

- **邻接表**：只记 `parent_id` → 写易读难  
- **闭包表**：另表存所有祖先–后代 → 读写较均衡  
- **嵌套集**：左右编号包住子树 → 读最快、写最痛、单根  
- **物化路径**：存 `1/2/4/` 这种门牌 → 好懂，`LIKE` 查子孙  
- 只要上下一级 → 邻接表；要整子树且常改 → 闭包表；只读为主 → 嵌套集  

## 嵌入实体（Embedded）vs 继承

> 参考：
>
> - [Embedded Entities](https://typeorm.io/docs/entity/embedded-entities)
> - [Entity Inheritance](https://typeorm.io/docs/entity/entity-inheritance)

### 一句话结论

先别纠结「是一种」。用大白话：

- **嵌入**：好几张表都要「姓名、地址」这种**零件** → 把零件抽出来，**塞进**各自的表里  
- **继承**：好几种业务对象**本身很像**（都有标题、正文），只是各自多几个字段 → 把相同字段写在**父类**里，子类 `extends`，少复制粘贴  

| | 嵌入 | 继承 |
| --- | --- | --- |
| 你在干嘛 | 复用**一坨字段零件** | 复用**一整类对象的公共部分** |
| 父/嵌入类是表吗 | 不是，只是字段组 | 具体表继承：父类通常不单独成业务表；每个**子类一张表** |
| 库里 | 列摊进**当前这张表** | `photo` / `question` / `post` 各一张，公共列每张都有一份 |
| 访问 | `user.name.first` | `photo.title`（直接写在子类感觉上） |
| 例子 | 地址、姓名 | 图片 / 问答 / 文章 都当「内容」 |

文档说嵌入是 composition over inheritance，意思是：**能当零件塞进去的，就别硬做成父子类。**

---

### 嵌入是啥（举例）

`User`、`Employee`、`Student` 都有名、姓 → 抽成 `Name`，嵌进各实体：

```ts
// Name 不是实体，没有 @Entity，不会单独建表
export class Name {
  @Column()
  first: string;

  @Column()
  last: string;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(() => Name) // ← 嵌入写法
  name: Name;

  @Column()
  isActive: boolean;
}
```

**库里只有一张 `user` 表**，列被摊平（默认前缀用属性名）：

| 列 | 说明 |
| --- | --- |
| id | |
| nameFirst | ← `name.first` |
| nameLast | ← `name.last` |
| isActive | |

```ts
user.name = new Name();
user.name.first = "Timber";
user.name.last = "Saw";
// 落库：nameFirst='Timber', nameLast='Saw'，没有 name 表
```

嵌套也可以：`Address` 里再嵌 `Coordinate`，列继续摊进同一张表。

---

### 继承是啥（别想抽象词，看重复字段）

假设社区有三种内容，你本来会写成三份几乎一样的类：

```ts
@Entity()
export class Photo {
  id: number;
  title: string;      // 重复
  description: string; // 重复
  size: string;        // 只有图片有
}

@Entity()
export class Question {
  id: number;
  title: string;       // 重复
  description: string; // 重复
  answersCount: number; // 只有问答有
}

@Entity()
export class Post {
  id: number;
  title: string;       // 重复
  description: string; // 重复
  viewCount: number;   // 只有文章有
}
```

你会想：**相同的 `id / title / description` 别复制三遍** → 抽到父类，子类只写自己多出来的：

```ts
// 父类：公共字段写一次（通常 abstract，不单独当业务表）
export abstract class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;
}

@Entity()
export class Photo extends Content {
  @Column()
  size: string; // 只写差异
}

@Entity()
export class Question extends Content {
  @Column()
  answersCount: number;
}

@Entity()
export class Post extends Content {
  @Column()
  viewCount: number;
}
```

**库里会发生什么（具体表继承）**：仍然是 **3 张表** `photo` / `question` / `post`，每张都带上父类那些列：

| photo | question | post |
| --- | --- | --- |
| id, title, description, **size** | id, title, description, **answersCount** | id, title, description, **viewCount** |

所以继承在 TypeORM 里首先是：**少在代码里复制公共列**；表还是按「每种业务一张表」建。

口语里说「Photo 是一种 Content」，只是说：图片、问答、文章**都属于「内容」这个大家族，公共信息一样，个性字段不同**——不是玄学。

还有一种 **单表继承（STI）**：三家伙进**一张** `content` 表，多一列 `type` 标明这行是 photo 还是 post。公共列一份，子类特有列很多是空的。适合类型多但字段差不太大时。

---

### 和嵌入差在哪（同一个「地址」别用错）

订单要收货地址，用户要家庭地址。

**该用嵌入**：订单、用户**本身不是地址**，只是**身上带着地址这几列**。

```ts
export class Address {
  @Column() province: string;
  @Column() city: string;
  @Column() detail: string;
}

@Entity()
export class Order {
  @Column(() => Address)
  shipping: Address; // 订单表多几列 shippingXxx
}
```

**不该写成** `class Order extends Address`——订单去「继承地址」听起来就别扭：订单不是地址的一种。

反过来，图片/问答/文章 → 继承 `Content` 很自然：三者**同类业务对象**，只是细分不同。

一句话自测：

- 「A **带着** B 的几列」→ 嵌入（Order 带着 Address）  
- 「A 和 C **同类**，只是多几个字段」→ 继承（Photo / Post 都算 Content）  

---

### 怎么选

| 你在想什么 | 用 |
| --- | --- |
| 好多**不同业务表**都要姓名/地址这种零件 | **嵌入** |
| 好几种**同类对象**，公共字段一堆、各自多几个字段 | **继承** |
| 只想少写重复 `@Column`，不要多一张「零件表」 | **嵌入** |
| 地址要独立成表、能单独查 | 普通 `@Entity` + 关系，不是嵌入也不是继承 |

---

### 实战：创建时间 / 更新时间 / 软删除 → 用继承

几乎每个业务表都要这几列时，用**抽象基类继承**（业界最常见），不要嵌成 `user.audit.createdAt`。

```ts
export abstract class AppBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date; // 插入时自动写

  @UpdateDateColumn()
  updatedAt: Date; // 每次 save 自动更新

  @DeleteDateColumn()
  deletedAt: Date | null; // 软删时间；有值=已删
}

@Entity()
export class User extends AppBaseEntity {
  @Column()
  name: string;
}
```

库表仍是各自一张（`user` 上直接有 `createdAt / updatedAt / deletedAt`）。

**为什么不用嵌入**

| | 继承基类 | 嵌成 Audit 零件 |
| --- | --- | --- |
| 访问 | `user.createdAt` | `user.audit.createdAt`（别扭） |
| 软删 | `@DeleteDateColumn` 挂在实体上，`softRemove` / 默认过滤未删行都好用 | 特殊列塞进嵌入里，和 TypeORM 软删约定别扭 |
| 语义 | 「每个业务实体都有同一套生命周期字段」= 同类公共部分 | 更像「带着一块零件」，这里不贴切 |

**软删别用 `isDeleted: boolean`**：优先 `@DeleteDateColumn`。  
有它之后：`repository.softRemove(user)` 写删除时间；普通 `find` 默认不查已删行；要查已删用 `withDeleted: true`。

自测回扣：创建/更新/软删不是「订单带着的地址零件」，而是**每个实体都该有的公共字段** → 继承。

---

### 记忆口诀

- **嵌入** = 塞零件：`@Column(() => Address)` → 列进当前表  
- **继承** = 少复制：同类对象公共字段放父类，`extends`，子类各成一张表（或 STI 共表）  
- **createdAt / updatedAt / deletedAt** → 抽象基类继承，别嵌入  
- 自测：是「带着几列」还是「本来就是一类东西」  

## 关联关系

> 参考：[TypeORM：Relations](https://typeorm.io/docs/relations/relations)

### 四种关系（先认脸）

| 装饰器 | 含义 | 生活类比 |
| --- | --- | --- |
| `@OneToOne` | 一对一 | 一人一份档案 |
| `@ManyToOne` | 多对一 | 多篇文章 → 一个作者（外键多在「多」这边） |
| `@OneToMany` | 一对多 | 一个作者 → 多篇文章（常是 ManyToOne 的反向） |
| `@ManyToMany` | 多对多 | 文章 ↔ 标签（中间多一张关系表） |

入门案例见：[Creating a one-to-one relation](https://typeorm.io/docs/getting-started#creating-a-one-to-one-relation)。

---

### 关系配置项速查

写在关系装饰器的第二个参数（options）里，例如：

```ts
@ManyToOne(() => Category, (c) => c.posts, {
  eager: false,
  cascade: ["insert"],
  onDelete: "SET NULL",
  nullable: true,
})
category: Category;
```

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `eager` | `false` | `true` 时：用 `find*` / 针对该实体的 QueryBuilder 会**总是带上**这个关联 |
| `cascade` | `false` | 保存当前实体时，要不要顺带 insert/update/remove 关联对象 |
| `onDelete` | `RESTRICT` | 被引用行被删时，外键怎么处理：`RESTRICT` / `CASCADE` / `SET NULL` |
| `nullable` | `true` | 外键列能否为 NULL；`ManyToOne` / 拥有方 `OneToOne` 设 `false` 时加载用 **INNER JOIN**（保证一定有关联） |
| `orphanedRowAction` | `nullify` | 父级 cascade save 时，**数组里消失的子行**怎么处理（见下） |
| `deferrable` | — | 外键可延迟校验（提交时再查）。多对多会作用在中间表两边 FK。支持 Postgres / better-sqlite3 / SAP HANA |

---

### `eager`：要不要自动带出关联

```ts
@ManyToOne(() => User, { eager: true })
author: User;
```

之后 `repo.find()` 每次都会把 `author` 查出来，不用写 `relations`。

**慎用**：关联一多，每次查询都变重；多数情况保持默认 `false`，需要时显式 `relations: ['author']`。

---

### `cascade`：保存父对象时顺带保存子对象

```ts
@ManyToMany(() => Category, (c) => c.questions, { cascade: true })
@JoinTable()
categories: Category[];

// 只 save question，category1/2 也会被插入
question.categories = [category1, category2];
await manager.save(question);
```

#### 可选粒度

`cascade` 可以是 `true`（全开），或数组：

`"insert" | "update" | "remove" | "soft-remove" | "recover"`

| 值 | 含义 |
| --- | --- |
| `insert` | 关联上**新对象** → 自动插入 |
| `update` | 关联上**已有对象**有改动 → 自动更新 |
| `remove` | `remove(父)` 时，顺带删掉**已加载**的关联实体 |
| `soft-remove` / `recover` | 软删 / 恢复也级联 |

```ts
cascade: ["insert"]              // 只级联新建
cascade: ["insert", "update"]    // 新建+更新
cascade: true                    // 全开（含 remove 等）
```

#### cascade remove 注意

只有**已经加载到内存里**的关联才会被级联删；没 `relations` 加载过的不会动：

```ts
const post = await manager.findOne(Post, {
  where: { id: 1 },
  relations: { categories: true }, // 必须先加载
});
await manager.remove(post); // categories 才会一起删
```

文档警告：cascade 省事，也可能把**不想存的对象**一起写入，调试更不直观——**能显式 `save` 子实体就别滥用**。

#### 场景讲清：多对多「级联软删」到底删的是啥

> 文档：[Many-to-many · Soft Deleting with cascade](https://typeorm.io/docs/relations/many-to-many-relations)

先记住库里其实有 **3 张表**：

| 表 | 存什么 |
| --- | --- |
| `question` | 问题本身 |
| `category` | 分类本身 |
| `question_categories_category`（中间表） | 谁和谁有关联（只有两列 id） |

中间表**一般没有** `deletedAt`，谈不上「软删关系行」。  
所以文档说的「级联软删」= **软删 Question 时，顺带软删挂在上面的 Category 实体**，不是只拆中间表。

---

**场景 A：只想「这道题去掉某个分类」（日常最常见）**

题还在，分类还在，只是两者不再挂钩。

```ts
const question = await repo.findOne({
  where: { id: 1 },
  relations: { categories: true },
});
// 从数组里拿掉「zoo」
question.categories = question.categories.filter((c) => c.id !== zooId);
await manager.save(question);
```

结果：

| 表 | 变化 |
| --- | --- |
| 中间表 | 少了一行 question↔zoo |
| question | 还在，没 deletedAt |
| category(zoo) | 还在（别的题可能还在用） |

→ **这不叫级联软删**，叫解除关联。

---

**场景 B：整道题作废，连它「私有的」分类一起下线（级联软删）**

比如草稿题专用的临时标签，只属于这道题；题不要了，标签也该一起进回收站。

实体上要有 `@DeleteDateColumn`，且关系开 cascade（`true` 或含 `"soft-remove"`）：

```ts
@ManyToMany(() => Category, (c) => c.questions, { cascade: true })
@JoinTable()
categories: Category[];
```

```ts
const category1 = new Category(); // animals
const category2 = new Category(); // zoo
const question = new Question();
question.categories = [category1, category2];

const saved = await manager.save(question); // 级联插入两个 category
await manager.softRemove(saved);            // 只调了 question
```

结果：

| 表 / 行 | 变化 |
| --- | --- |
| question | `deletedAt` 有值（软删） |
| category animals / zoo | **也被**写上 `deletedAt`（你没单独 softRemove 它们） |
| 中间表 | 行通常还在；`softRemove` 主要改实体的删除时间，不靠清中间表表达「软删」 |

→ 这才是文档里的 **「使用级联方式软删除」**：一次 `softRemove(父)`，关联子实体跟着软删。

之后 `recover(saved)`：题恢复；中间表行本来就在，TypeORM 不会重复插入 junction。

---

**场景 C：分类是全站共享标签 → 千万别 cascade soft-remove**

「动物」「编程」被很多题共用。若 Question→Category 开了 `cascade: true`，软删一道题可能把公共标签也软删掉，别的题全挂。

这时应：

- 关系上 **不要** `cascade: ['soft-remove']` / 慎用 `cascade: true`
- 删题只用 `softRemove(question)`，分类留给别的题
- 要解绑某个标签 → 走场景 A（改数组再 save）

---

**对照一句话**

| 你想做的事 | 做法 | 动到谁 |
| --- | --- | --- |
| 题和分类取消挂钩 | 数组 filter 掉再 `save` | 只动中间表 |
| 题作废，私有分类一起进回收站 | `softRemove(question)` + cascade | 题 + 分类实体的 `deletedAt` |
| 题作废，公共分类必须留下 | `softRemove(question)`，**别**对 Category 开 soft-remove 级联 | 只软删题 |

---

### `onDelete`：数据库外键删主表时怎么办

这是**库级 FK 行为**，和 TypeORM 的 `cascade: ['remove']`（ORM 层）不是一回事。

| 值 | 被引用行删除时 |
| --- | --- |
| `RESTRICT`（默认） | 有人还引用 → **禁止删** |
| `CASCADE` | 主表删了 → **从表相关行也删** |
| `SET NULL` | 主表删了 → 从表外键改成 `NULL`（列必须可空） |

```ts
@ManyToOne(() => User, { onDelete: "CASCADE" })
author: User;
```

---

### `nullable`：外键能不能空

```ts
@ManyToOne(() => Category, { nullable: false })
category: Category; // 必须有分类；加载时走 INNER JOIN
```

默认 `true` → `LEFT JOIN`（可以没有关联）。

---

### `orphanedRowAction`：数组里「失踪」的子行

父实体 `cascade` 开启且 `save` 时：库里原来有的子行，**这次没出现在关系数组里**，怎么处理？

| 值 | 行为 |
| --- | --- |
| `nullify`（默认） | 断开关系（外键置 NULL）；若外键 `NOT NULL`，无法置空则改为删除该行 |
| `delete` | 直接删掉这些孤儿行 |
| `soft-delete` | 软删这些孤儿行 |
| `disable` | 什么都不做，要删自己用对应 Repository |

场景：帖子原来挂了 3 个标签，这次只 `save` 了 2 个 → 缺的那个就是 orphan。

---

### `@JoinColumn`：外键在哪、叫啥

- **作用**：标明哪边持有外键列，并可改列名、改引用哪一列  
- `@ManyToOne`：**可选**（不写也会生成 `属性名+Id`，如 `categoryId`）  
- `@OneToOne`：**拥有方必须写** `@JoinColumn`

```ts
@ManyToOne(() => Category)
@JoinColumn() // → 列名 categoryId，引用 Category.id
category: Category;

@ManyToOne(() => Category)
@JoinColumn({ name: "cat_id" }) // 自定义列名
category: Category;

@ManyToOne(() => Category)
@JoinColumn({ referencedColumnName: "name" }) // 引用 Category.name，列名约 categoryName
category: Category;
```

复合外键用数组（必须写清 `referencedColumnName`）：

```ts
@JoinColumn([
  { name: "category_id", referencedColumnName: "id" },
  { name: "locale_id", referencedColumnName: "locale_id" },
])
```

---

### `@JoinTable`：多对多的中间表

只加在 **ManyToMany 的拥有方（owning side）一侧**。TypeORM 自动建 junction 表。

```ts
@ManyToMany(() => Category)
@JoinTable({
  name: "question_categories", // 中间表名
  joinColumn: {
    name: "question", // 当前实体在中间表的列
    referencedColumnName: "id",
  },
  inverseJoinColumn: {
    name: "category", // 对面实体的列
    referencedColumnName: "id",
  },
})
categories: Category[];
```

对方有复合主键时，给 `@JoinTable` 传数组配置。

---

### 记忆口诀

- **四种关系**：一对一 / 多对一 / 一对多 / 多对多  
- **eager**：自动带关联，默认关，别乱开  
- **cascade**：ORM 层顺带存/改/删；**只处理已加载的关联**；能显式 save 更稳  
- **多对多解除关联**：改数组再 save → 只动中间表  
- **多对多级联软删**：`softRemove(父)` → 连带软删**关联实体**（不是软删中间表）；共享标签别开  
- **onDelete**：库级 FK；RESTRICT 拦、CASCADE 连删、SET NULL 置空  
- **orphanedRowAction**：save 时数组里消失的子行 → nullify / delete / soft-delete / disable  
- **@JoinColumn**：外键列（OneToOne 拥有方必写；ManyToOne 可省略）  
- **@JoinTable**：多对多中间表，只写拥有方一侧  


---

## 实战：Document ↔ Content 一对一（共享主键）

> 场景：知识库文档。元数据（标题、摘要、状态）和大正文拆两张表；列表不加载正文，详情再带正文。  
> 对应项目：`rag-agent` 的 `DocumentEntity` / `ContentEntity`。

### 一句话结论

**一对一共享主键**：`content.id === document.id`；外键（`@JoinColumn`）放在 Content；Document 侧开 `cascade`；软删用 `deletedAt`；基类不要加 `@Entity()`。

---

### 正确写法（完整对照）

```ts
// base-entity.ts —— 抽象基类，不加 @Entity()
export abstract class BaseEntity {
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;
}

// document.entity.ts —— 元数据（轻）
@Entity('kh_document')
export class DocumentEntity extends BaseEntity {
  @PrimaryColumn({ type: 'bigint', transformer: bigintTransformer })
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  // 反向侧：有第二个参数；cascade 在「主」这边
  @OneToOne(() => ContentEntity, (content) => content.document, {
    cascade: true,
  })
  content?: Relation<ContentEntity>;

  @Column({ type: 'varchar', nullable: true })
  summary?: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  tags?: string[] | null;

  @Column({ name: 'word_count', type: 'int', default: 0 })
  wordCount: number;
}

// content.entity.ts —— 正文（重），外键在这边
@Entity('kh_document_content')
export class ContentEntity extends BaseEntity {
  @PrimaryColumn({ type: 'bigint', transformer: bigintTransformer })
  id: string; // 与 Document.id 相同

  @OneToOne(() => DocumentEntity, (document) => document.content, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id' }) // 外键列 = 本表 id，引用 document.id
  document: Relation<DocumentEntity>;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 1 })
  version: number;
}
```

库表形态：

| kh_document | kh_document_content |
| --- | --- |
| id = 1001 | id = 1001（主键 **且** 外键 → document.id） |
| title / summary / tags… | content / version |

```ts
// 创建：一次 save，两张表都写入（Document 侧 cascade）
await docRepo.save({
  id: '1001',
  title: 'RAG 入门',
  content: { id: '1001', content: '# 第一章…', version: 1 },
});

// 列表：不 join 正文
await docRepo.find({ select: ['id', 'title', 'summary'] });

// 详情：再带正文
await docRepo.findOne({ where: { id: '1001' }, relations: ['content'] });
```

Nest 里两边都要 `forFeature`（开了 `autoLoadEntities` 时尤其重要）：

```ts
TypeOrmModule.forFeature([DocumentEntity, ContentEntity])
```

---

### 软删除：`deletedAt` 还是 `deleted` 布尔？

| | `deletedAt`（`@DeleteDateColumn`） | `deleted: boolean` |
| --- | --- | --- |
| TypeORM | 原生 `softRemove` / `recover` / `withDeleted` | 要自己到处写 `WHERE deleted = false` |
| 信息量 | 是否删 + **何时删** | 只有是否删 |
| 恢复 | 置 `NULL` | 改回 `false`，丢了删除时间 |

**优先 `deletedAt`。** 布尔只在「永远不关心删除时间、也不用 TypeORM 软删 API」时更省事。

```ts
await repo.softRemove(doc);           // 写入 deleted_at
await repo.find();                    // 默认看不到已删
await repo.find({ withDeleted: true }); // 显式查已删
await repo.recover(doc);              // deleted_at = null
```

---

### 基类：为啥不要 `@Entity()`，要用 `abstract`

```ts
// ❌ 基类加了 @Entity() → TypeORM 可能多建一张无意义的 base_entity 表
@Entity()
export class BaseEntity { ... }

// ✅ 只复用字段，子类各自加 @Entity
export abstract class BaseEntity { ... }
```

| | 有 `@Entity()` 的基类 | `abstract` 无 `@Entity()` |
| --- | --- | --- |
| 结果 | 可能多一张空表 | 只有业务表 |
| 语义 | 「可独立持久化」 | 「只能被继承」 |

`abstract` 还能防止误写 `new BaseEntity()` / `repo.save(base)`。

---

### 常见错误 1：把 `@OneToOne` 挂在主键 `id` 上

```ts
// ❌ 错：主键列和关系叠在同一属性
@PrimaryColumn(...)
@OneToOne(() => DocumentEntity, ...)
id: string;

// ✅ 对：主键是列，关系是对象引用，分开
@PrimaryColumn(...)
id: string;

@OneToOne(() => DocumentEntity, (d) => d.content)
@JoinColumn({ name: 'id' })
document: Relation<DocumentEntity>;
```

**为啥：** TypeORM 里「列」和「关系」是两件事。

```ts
content.id              // "1001"（字符串）
content.document.title  // "RAG 入门"（导航到另一张表）
```

叠在一起时，`id` 到底是字符串还是 Document？语义崩了，映射也会乱。

---

### `@OneToOne` 两个函数参数是啥意思

```ts
@OneToOne(
  () => DocumentEntity,              // ① 连谁
  (document) => document.content,    // ② 对面用哪个属性指回我
  { onDelete: 'CASCADE' },           // ③ 选项（可选）
)
```

#### ① `() => DocumentEntity`：目标实体

写成函数（而不是直接写类名）是为了**避免循环 import** 时模块还是 `undefined`：

```ts
// content → import Document
// document → import Content
```

箭头函数把取值推迟到「真正用到关系时」。

#### ② `(document) => document.content`：反向属性

告诉 TypeORM：Document 那一侧用哪个字段指回 Content。两边要配对：

```
Content.document  ←→  Document.content
```

```ts
// Content 侧
@OneToOne(() => DocumentEntity, (document) => document.content)

// Document 侧
@OneToOne(() => ContentEntity, (content) => content.document)
```

写成 `(document) => document.title` 就错了——`title` 不是关系属性。

---

### 省略第二个参数 = 单向关系（举例）

**双向（有第 2 个参数）——两边都能导航：**

```ts
const doc = await docRepo.findOne({
  where: { id: '1001' },
  relations: ['content'],
});
doc.content.content; // "# 第一章"

const content = await contentRepo.findOne({
  where: { id: '1001' },
  relations: ['document'],
});
content.document.title; // "RAG 入门"
```

**单向（省略第 2 个参数，且 Document 上没有 `content` 字段）：**

```ts
// Content 只写第一个参数
@OneToOne(() => DocumentEntity)
@JoinColumn({ name: 'id' })
document: Relation<DocumentEntity>;

// Document —— 没有 content 关系字段
```

| 操作 | 双向 | 单向 |
| --- | --- | --- |
| `content.document` | ✅ | ✅（关系在 Content 侧） |
| `document.content` | ✅ | ❌ 没有这个属性 |
| `docRepo.find({ relations: ['content'] })` | ✅ | ❌ |
| `save({ title, content: {...} })` cascade | ✅ 可配 | ❌ Document 侧没法级联正文 |

单向时想拿正文只能手动再查：

```ts
const doc = await docRepo.findOneBy({ id: '1001' });
const content = await contentRepo.findOneBy({ id: doc.id });
```

**数据库外键还在**（`JoinColumn` 决定），只是 ORM 不再帮你从 Document 导航到 Content。

知识库两边都要用（详情带正文、创建时 cascade），所以做成**双向**，第二个参数要保留。

---

### `@JoinColumn({ name: 'id' })` 参数含义

`@JoinColumn` 声明：**外键在我这边这张表的哪一列，指向对方哪一列。**

```ts
@JoinColumn({
  name: 'id',                 // 本表（content）的外键列名
  referencedColumnName: 'id', // 对方表被引用的列（默认=对方主键，可省略）
})
```

只写 `{ name: 'id' }` 时，等价于引用 Document 的主键 `id`。

**注意：`name` 指的是本表列名，不是对方表列名。**

#### 共享主键 vs 独立外键列

```ts
// 共享主键（你们现在）：一列身兼主键 + 外键
@JoinColumn({ name: 'id' })
// content.id = 1001，document.id = 1001

// 独立外键：content 自己有主键，再另加 document_id
@PrimaryColumn()
id: string; // 比如 9001

@JoinColumn({ name: 'document_id' })
document: DocumentEntity;
// content.id=9001, content.document_id=1001, document.id=1001
```

---

### 为啥 `@JoinColumn` 放在 Content，不放 Document

`@JoinColumn` 放哪一侧 = **外键物理存在哪张表**。

| 表 | JoinColumn 在 Content 时 |
| --- | --- |
| `kh_document` | 没有指向 content 的列（列表表更干净） |
| `kh_document_content` | `id` → `kh_document.id` |

**好处：**

1. **列表更轻**：列表只查 Document，不碰大正文表。  
2. **共享主键只能这样**：`content.id === document.id` 时，外键必须落在 Content 的 `id`。  
3. **删文档好级联**：`onDelete: 'CASCADE'` → 删 document 1001，自动删 content 1001，无孤儿正文。  
4. **和业务主从一致**：文档是主、正文是从；外键在从属表 = 子表引用父表。

若放到 Document（`content_id`）：

| document.id | document.content_id | content.id |
| --- | --- | --- |
| 1001 | 9001 | 9001 |

能工作，但 Document 多一列、两套 ID，适合「Content 先存在、Document 再引用」——和「先有文档再挂正文」相反。

---

### `cascade` 放哪边 / 和 `onDelete` 的区别

| | `cascade: true`（ORM） | `onDelete: 'CASCADE'`（数据库 FK） |
| --- | --- | --- |
| 发生时机 | `repository.save(父)` 时 | `DELETE` 父行时 |
| 谁执行 | TypeORM | 数据库约束 |
| 你们放哪 | **Document**（保存文档顺带存正文） | **Content**（删文档顺带删正文） |

```ts
// Document：业务入口，cascade 保存
@OneToOne(() => ContentEntity, (c) => c.document, { cascade: true })
content?: Relation<ContentEntity>;

// Content：外键侧，库级连删
@OneToOne(() => DocumentEntity, (d) => d.content, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'id' })
document: Relation<DocumentEntity>;
```

**别把 cascade 放反**：不应是「保存正文时顺便创建文档」。

---


### 记忆口诀（Document / Content）

- **拆表**：元数据轻表 + 正文重表；列表不 join 正文  
- **共享主键**：`content.id === document.id`；`@JoinColumn` 在 Content  
- **`@OneToOne` 两参数**：① 连谁 ② 对面哪个属性指回来；省略 ② = 单向  
- **别把关系挂在 `id` 上**：主键是列，关系是对象  
- **cascade 在主（Document）**；**onDelete CASCADE 在外键侧（Content）**  
- **软删用 `deletedAt`**；基类 `abstract`、**不加 `@Entity()`**  

---

## QueryBuilder：用链式 API 拼 SQL

> 参考：[Select using Query Builder](https://typeorm.io/docs/query-builder/select-query-builder)

### 一句话结论

**QueryBuilder = 用方法链式调用拼出 SQL**，执行后自动映射成实体。  
简单 CRUD 用 `find` / `save`；复杂条件、JOIN、批量写、自定义 SQL 片段时用 QueryBuilder。

文档说「有 5 种不同 QueryBuilder 类型」——中文机翻有时写成「产品」，其实就是 **5 种 Builder**，对应 5 类 SQL：

| 类型 | 对应 SQL | 典型结尾 |
| --- | --- | --- |
| `SelectQueryBuilder` | `SELECT` | `getOne()` / `getMany()` / `getRawMany()` |
| `InsertQueryBuilder` | `INSERT` | `execute()` |
| `UpdateQueryBuilder` | `UPDATE` | `execute()` |
| `DeleteQueryBuilder` | `DELETE` | `execute()` |
| `RelationQueryBuilder` | 关系操作（加/删关联、加载关联） | `loadMany()` / `add()` / `remove()` 等 |

`.select()` / `.insert()` / `.update()` / `.delete()` / `.relation()` 会**切换** Builder 类型，得到新实例。

---

### 先搞懂：它到底在干嘛

下面这段：

```ts
const firstUser = await dataSource
  .getRepository(User)
  .createQueryBuilder('user')
  .where('user.id = :id', { id: 1 })
  .getOne();
```

TypeORM 会拼出类似：

```sql
SELECT
  user.id AS user_id,
  user.firstName AS user_firstName,
  user.lastName AS user_lastName
FROM users user
WHERE user.id = 1
```

然后把行映射成：

```ts
User { id: 1, firstName: 'Timber', lastName: 'Saw' }
```

要点：

1. **`'user'`** 是表别名（alias），后面 `where` / `orderBy` 都写 `user.xxx`  
2. **`:id`** 是命名参数，第二个对象 `{ id: 1 }` 填值——防 SQL 注入，也比拼字符串清晰  
3. **同一次查询里参数名不能重复乱用**：两个条件都写 `:id` 会打架，应写成 `:sheepId` / `:cowId`

---

### 怎么创建 QueryBuilder（三种入口）

```ts
// ① DataSource：最「裸」，要自己 .select().from()
const user = await dataSource
  .createQueryBuilder()
  .select('user')
  .from(User, 'user')
  .where('user.id = :id', { id: 1 })
  .getOne();

// ② EntityManager：创建时就指定实体 + 别名
const user2 = await dataSource.manager
  .createQueryBuilder(User, 'user')
  .where('user.id = :id', { id: 1 })
  .getOne();

// ③ Repository（Nest 里最常见）：仓库已绑定实体，只传别名
const user3 = await dataSource
  .getRepository(User)
  .createQueryBuilder('user')
  .where('user.id = :id', { id: 1 })
  .getOne();
```

Nest 里通常是：

```ts
@InjectRepository(User)
private readonly userRepo: Repository<User>;

// ...
await this.userRepo.createQueryBuilder('user').where(...).getMany();
```

三种最终 SQL 一样；日常优先 **Repository**，少写 `.from(User, 'user')`。

---

### 场景 1：`SelectQueryBuilder` — 查

**什么时候用：** 条件多、要 JOIN、要分页排序、`find` 写着别扭时。

```ts
const user = await dataSource
  .createQueryBuilder()
  .select('user')              // SELECT 哪个别名对应的实体列
  .from(User, 'user')          // FROM users AS user
  .where('user.id = :id', { id: 1 })
  .getOne();                   // 执行，期望 0~1 条 → User | null
```

逐步拆开：

| 调用 | 含义 |
| --- | --- |
| `createQueryBuilder()` | 开一个 Builder |
| `.select('user')` | 选出别名 `user` 的列（映射成 `User`） |
| `.from(User, 'user')` | 从 `User` 实体对应表查，别名 `user` |
| `.where('user.id = :id', { id: 1 })` | `WHERE`，`:id` 用参数对象填充 |
| `.getOne()` | 跑查询，取一条实体 |

#### 常见取结果方式

Select 有两类结果：**实体**（映射成 `User`）和 **原始结果**（数据库原样吐出来的列/聚合）。

| 方法 | 返回 | 没数据时 | 什么时候用 |
| --- | --- | --- | --- |
| `getOne()` | `User \| null` | `null` | 查单条，允许不存在 |
| `getOneOrFail()` | `User` | 抛 `EntityNotFoundError` | 业务上「必须有这条」 |
| `getMany()` | `User[]` | `[]` | 查列表 |
| `getRawOne()` | 普通对象 \| `undefined` | 无行 | 聚合、自定义 SELECT 别名 |
| `getRawMany()` | 普通对象数组 | `[]` | 同上，多行 |

```ts
const qb = dataSource.getRepository(User).createQueryBuilder('user');

await qb.where('user.id = :id', { id: 1 }).getOne();
// → User | null

await qb.where('user.id = :id', { id: 1 }).getOneOrFail();
// → 没有就抛 EntityNotFoundError

await qb.getMany();
// → User[]（不加 where = 全表，生产慎用）

await qb
  .where('user.isActive = :a', { a: true })
  .skip(20)   // OFFSET
  .take(10)   // LIMIT
  .getMany();

const { entities, raw } = await qb.getRawAndEntities();
// entities = 映射后的实体；raw = 原始行（算聚合、额外列时有用）

// 聚合 / 自定义列 → 原始结果（SUM/COUNT 等见文末「SQL 常用语法」）
await qb.select('COUNT(user.id)', 'cnt').getRawOne();
// → { cnt: '42' }
```

`.where(...)` / `.select('SUM(...)', '别名')` 里写的是 **SQL 片段**，不是 TypeORM 发明的语法。`OR`、`AND`、`SUM`、`LIKE`、`IN` 等单独成章，见文末 **「SQL 常用语法（按场景）」**。

#### 稍复杂一点：多条件 + JOIN

```ts
const list = await dataSource
  .getRepository(User)
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.photos', 'photo') // 左连并选出 photos
  .where('user.isActive = :active', { active: true })
  .andWhere('user.lastName = :last', { last: 'Saw' })
  .orderBy('user.id', 'DESC')
  .getMany();
```

等价思路：`SELECT user.*, photo.* FROM users user LEFT JOIN photos photo ON ... WHERE ... ORDER BY ...`

**和 `find` 对比：**

```ts
// 简单 → find 够用
await userRepo.findOne({ where: { id: 1 }, relations: ['photos'] });

// 复杂动态条件 / 自定义 ON / 子查询 → QueryBuilder 更合适
```

---

### 场景 2：`InsertQueryBuilder` — 插

**什么时候用：** 批量插入、要写 `OR IGNORE` / `ON CONFLICT`、或插入后要 `returning`（Postgres）时。比循环 `save` 轻。

```ts
await dataSource
  .createQueryBuilder()
  .insert()                 // 切到 InsertQueryBuilder
  .into(User)               // INSERT INTO users
  .values([
    { firstName: 'Timber', lastName: 'Saw' },
    { firstName: 'Phantom', lastName: 'Lancer' },
  ])
  .execute();               // 执行；插入一般不用 getOne
```

逐步拆开：

| 调用 | 含义 |
| --- | --- |
| `.insert()` | 声明这是 INSERT |
| `.into(User)` | 插入哪张表（实体） |
| `.values([...])` | 一行对象 = 一行记录；数组 = 批量 |
| `.execute()` | 真正发 SQL，返回 `InsertResult`（含 `identifiers` / `raw` 等） |

等价 SQL：

```sql
INSERT INTO users (firstName, lastName) VALUES
  ('Timber', 'Saw'),
  ('Phantom', 'Lancer');
```

#### 只插一行 / 忽略部分列

```ts
await dataSource
  .createQueryBuilder()
  .insert()
  .into(User)
  .values({ firstName: 'Timber', lastName: 'Saw' }) // 单个对象也行
  .execute();
```

#### 和 `repository.save` / `insert` 对比

| 写法 | 特点 |
| --- | --- |
| `repo.save(entity)` | 会跑 listener / subscriber；有 id 可能变 UPDATE；较重 |
| `repo.insert(data)` | 偏底层插入，不加载实体 |
| `createQueryBuilder().insert()...` | 和 `repo.insert` 同类，链式可加更多 SQL 选项 |

知识库批量灌文档元数据、导入脚本，优先 `insert` QueryBuilder / `repo.insert`，别对几千行逐个 `save`。

---

### 场景 3：`UpdateQueryBuilder` — 改

**什么时候用：** 按条件批量改字段，不必先 `find` 再 `save`。

```ts
await dataSource
  .createQueryBuilder()
  .update(User)                                    // UPDATE users
  .set({ firstName: 'Timber', lastName: 'Saw' })   // SET ...
  .where('id = :id', { id: 1 })
  .execute();
```

逐步拆开：

| 调用 | 含义 |
| --- | --- |
| `.update(User)` | 更新哪张表 |
| `.set({ ... })` | 要改的列；也可写 `() => "firstName = firstName || '!'"` 这类表达式 |
| `.where(...)` | 更新范围；**没 where 会全表更新，危险** |
| `.execute()` | 返回 `UpdateResult`（含 `affected` 等） |

等价 SQL：

```sql
UPDATE users SET firstName = 'Timber', lastName = 'Saw' WHERE id = 1
```

#### 批量场景举例

```ts
// 把所有 inactive 用户标记为归档名
await dataSource
  .getRepository(User)
  .createQueryBuilder()
  .update(User)
  .set({ lastName: 'Archived' })
  .where('isActive = :active', { active: false })
  .execute();
```

**注意：** 这条路径通常**不会**自动更新 `@UpdateDateColumn`（取决于版本/写法），也不会触发实体级 listener 的完整生命周期。需要这些副作用时，仍用 `find` + `save`。

---

### 场景 4：`DeleteQueryBuilder` — 硬删

**什么时候用：** 按条件物理删除行。软删（`deletedAt`）一般用 `softDelete` / `softRemove`，不是这个。

```ts
await dataSource
  .createQueryBuilder()
  .delete()
  .from(User)
  .where('id = :id', { id: 1 })
  .execute();
```

| 调用 | 含义 |
| --- | --- |
| `.delete()` | 声明 DELETE |
| `.from(User)` | 从哪张表删 |
| `.where(...)` | 删除范围；**没 where = 删光整表** |
| `.execute()` | 返回 `DeleteResult` |

等价 SQL：

```sql
DELETE FROM users WHERE id = 1
```

#### 条件批量删举例

```ts
await dataSource
  .getRepository(User)
  .createQueryBuilder()
  .delete()
  .from(User)
  .where('isActive = :active', { active: false })
  .andWhere('updatedAt < :deadline', { deadline: new Date('2020-01-01') })
  .execute();
```

和 Document / Content 的关系：库上配了 `onDelete: 'CASCADE'` 时，硬删 Document 会由**数据库**顺带删 Content；这和 ORM 的 `cascade: true`（管 save）不是一回事。

---

### 场景 5：`RelationQueryBuilder` — 只管「谁连着谁」

> 官方专题：[Working with Relations](https://typeorm.io/docs/query-builder/relational-query-builder)

#### 先分清两件事

数据库里其实有两类数据：

| | 实体自己的字段 | 关系（连线） |
| --- | --- | --- |
| 例子 | `post.title`、`user.name` | 「这篇 post 属于哪些 category」 |
| 落在哪 | `post` / `user` 表自己的列 | **外键列**，或**多对多中间表**的一行 |
| 前四种 Builder | Select/Insert/Update/Delete 主要动实体行 | — |
| 第五种 | **不动** title / name | **只改连线** |

`RelationQueryBuilder` 的全部意义就一句话：

> **别把两边实体整包加载再 `save`，只告诉数据库：A 和 B 连上 / 断开。**

#### 生活类比

- `UpdateQueryBuilder`：改身份证上的姓名（改本人字段）  
- `RelationQueryBuilder`：改通讯录里「张三存了李四的号码」（改**联系**，人不删）

多对多时，中间表就是通讯录：

```text
post 表          post_categories_category（中间表）          category 表
---------        --------------------------------           -----------
id=1  标题A      postId=1, categoryId=10                     id=10  前端
id=2  标题B      postId=1, categoryId=20                     id=20  后端
                 postId=2, categoryId=10                     id=30  数据库
```

`.add(30)` = 往中间表再插一行 `(1, 30)`  
`.remove(20)` = 删掉中间表 `(1, 20)`  
**不会**删掉 `category` 里 id=20 那一行，只是 post 1 不再挂「后端」这个标签。

#### 为啥不用普通 `save`？（官方核心动机）

假设一篇文章已经挂了 **1 万个**分类，你还想再挂一个：

```ts
// ❌ 笨办法：先整包加载，再 push，再 save
const post = await postRepo.findOne({
  where: { id: 1 },
  relations: { categories: true }, // 一次拉 10000 条进来内存
});
post.categories.push(newCategory);
await postRepo.save(post); // 又要把整坨关联写回去 → 又慢又危险
```

```ts
// ✅ RelationQueryBuilder：只插中间表一行，两边实体都不用加载
await dataSource
  .createQueryBuilder()
  .relation(Post, 'categories') // 操作 Post 上的 categories 这段关系
  .of(1)                        // 哪篇文章（id=1，也可以传 post 对象）
  .add(3);                      // 挂上 category id=3（也可以传实体）
```

等价于数据库只做类似：

```sql
INSERT INTO post_categories_category (postId, categoryId) VALUES (1, 3);
```

这就是文档说的：*bind entities without loading* —— **不加载也能绑上**。

#### 句式怎么读

```ts
.await dataSource
  .createQueryBuilder()
  .relation(Post, 'categories') // ① 谁身上的哪段关系
  .of(postOrId)                 // ② 关系「这一侧」是谁
  .add(categoryOrId)            // ③ 对「另一侧」做什么
```

人话：**「给 Post#1 的 categories，加上 Category#3」**。

| 调用 | 含义 |
| --- | --- |
| `.relation(Post, 'categories')` | 看 `Post` 实体上叫 `categories` 的那条 `@ManyToMany` / `@OneToMany` … |
| `.of(1)` / `.of(post)` | 主体是哪一个 Post（传 id 或实体都行） |
| `.add(3)` / `.add(category)` | 多端：多挂一个（可数组 `.add([2, 3])`） |
| `.remove(3)` | 多端：摘掉关联（**删连线，不删 category 行**） |
| `.set(3)` / `.set(null)` | 单端（一对一 / 多对一）：改成指向谁，或清空 |
| `.loadMany()` / `.loadOne()` | 只把这段关系加载出来 |

#### 多对多 / 一对多：用 `add` / `remove`

```ts
// 给文章 1 挂上分类 2、3
await dataSource.createQueryBuilder()
  .relation(Post, 'categories')
  .of(1)
  .add([2, 3]);

// 从文章 1 上摘掉分类 2（中间表少一行；分类 2 本身还在）
await dataSource.createQueryBuilder()
  .relation(Post, 'categories')
  .of(1)
  .remove(2);
```

#### 一对一 / 多对一：用 `set`（不是 add）

「一篇文章只有一个作者」这种，另一侧是**单个**，不能 add 一堆：

```ts
// 把 post#1 的作者设为 user#5（改的是 post.userId 这类外键）
await dataSource.createQueryBuilder()
  .relation(Post, 'author')
  .of(1)
  .set(5);

// 清空作者（外键置 null，前提是列允许 null）
await dataSource.createQueryBuilder()
  .relation(Post, 'author')
  .of(1)
  .set(null);
```

#### 只加载某一段关系

不一定非要 `find({ relations: [...] })` 一次全带：

```ts
const post = await postRepo.findOneBy({ id: 1 });

// 单独把 categories 装上
post.categories = await dataSource.createQueryBuilder()
  .relation(Post, 'categories')
  .of(post)
  .loadMany();

// 单独把 author 装上
post.author = await dataSource.createQueryBuilder()
  .relation(Post, 'author')
  .of(post)
  .loadOne();
```

和 `SelectQueryBuilder` + `leftJoinAndSelect` 的差别：Select 是「查主表顺带 JOIN」；这里是「已知主实体，再去拉它的某一段关系」。

#### 和 Document ↔ Content 怎么对应（帮助建立直觉）

你们知识库是一对一共享主键，日常创建多用 `cascade` + `save`，**不一定非要用** RelationQueryBuilder。  
但若只想表达「把 content 绑到 document」或「解绑」，语义上就是：

```ts
// 一对一 → set / loadOne（示意）
await dataSource.createQueryBuilder()
  .relation(DocumentEntity, 'content')
  .of(documentId)
  .set(contentId); // 或 set(null) 解绑（视外键可否为空）
```

多对多标签、文章分类、用户角色 —— 才是 RelationQueryBuilder **最香**的场景。

#### 什么时候该用 / 不该用

| 场景 | 建议 |
| --- | --- |
| 给已有文章再挂几个标签；文章已有海量标签 | ✅ `relation().of().add()` |
| 从角色里摘掉某个权限 | ✅ `remove` |
| 改文章标题、正文 | ❌ 用 Update / `save`，不是 Relation |
| 新建文章并顺便带上分类（小数据） | `save` + cascade 也行，更直观 |
| Document/Content 创建整包 | 继续 `cascade: true` 的 `save` 即可 |

**一句话记住：**  
前四种改的是**表里的行/列**；第五种改的是**行与行之间的连线**（外键或中间表）。

---

### 五种对照 + 怎么选

| 你想做的事 | 用哪个 | 结尾方法 |
| --- | --- | --- |
| 按条件查列表 / 详情 / 分页 | `Select` | `getMany` / `getOne` |
| 批量插入、导入 | `Insert` | `execute` |
| 批量改某个字段 | `Update` | `execute` |
| 按条件硬删 | `Delete` | `execute` |
| 只改「谁和谁有关联」 | `Relation` | `add` / `remove` / `loadMany` |

```ts
// 切换类型会得到新 Builder（和普通 .where 链式不同）
dataSource.createQueryBuilder().select('user').from(User, 'user'); // Select
dataSource.createQueryBuilder().insert().into(User);               // Insert
dataSource.createQueryBuilder().update(User);                      // Update
dataSource.createQueryBuilder().delete().from(User);               // Delete
dataSource.createQueryBuilder().relation(User, 'photos');          // Relation
```

**选型口诀：**

- 单条读写、逻辑简单 → `repo.find*` / `save`  
- SQL 已经在脑子里成形、条件很动态 → `SelectQueryBuilder`  
- 大批量写、少副作用 → `insert` / `update` / `delete` QueryBuilder  
- 只维护关联边 → `RelationQueryBuilder`  

### 记忆口诀（QueryBuilder）

- **Builder = 拼 SQL 的积木**；五种对应查 / 插 / 改 / 删 / 关系  
- **别名**贯穿始终：`createQueryBuilder('user')` → 到处写 `user.xxx`  
- **`:参数` + 对象**，同查询里参数名别撞车  
- **读用 get\***，**写用 execute**  
- **update/delete 必写 where**，不然全表遭殃  
- Nest 里优先 `repo.createQueryBuilder('alias')`  

---

## SQL 常用语法（按场景）

> 和 QueryBuilder **分开记**：下面这些是标准 SQL；TypeORM / QueryBuilder 只是把字符串拼进语句。  
> 会 SQL，读 `.where('...')` / `.select('SUM(...)')` 才不懵。

### 一句话结论

| 你在业务里想说 | SQL 里常用 |
| --- | --- |
| 同时满足 / 满足其一 | `AND` / `OR` |
| 等于、大于、区间、一批 id | `=` `>` `BETWEEN` `IN` |
| 模糊搜名字 | `LIKE` |
| 字段为空 | `IS NULL` |
| 有多少、加总、平均、最大最小 | `COUNT` `SUM` `AVG` `MAX` `MIN` |
| 按组统计后再过滤 | `GROUP BY` + `HAVING` |
| 排序、翻页 | `ORDER BY` + `LIMIT`/`OFFSET` |

下面举例默认用 QueryBuilder 写法（和笔记其它处一致）；换成手写 SQL 也一样。

约定别名：`createQueryBuilder('user')` → 条件里写 `user.xxx`。

---

### 场景 1：多个条件要「同时成立」→ `AND`

**业务：** 活跃、且姓 Saw。

```sql
WHERE user.isActive = true AND user.lastName = 'Saw'
```

```ts
await userRepo
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .andWhere('user.lastName = :last', { last: 'Saw' })
  .getMany();
```

一条字符串里写也行：`.where('user.isActive = :a AND user.lastName = :last', { a: true, last: 'Saw' })`。

---

### 场景 2：多个条件「满足一个就行」→ `OR`

**业务：** id 是 1，**或者**名字叫 Timber（登录可用 id / 用户名任一种）。

```sql
WHERE user.id = 1 OR user.name = 'Timber'
```

```ts
const timber = await userRepo
  .createQueryBuilder('user')
  .where('user.id = :id OR user.name = :name', { id: 1, name: 'Timber' })
  .getOneOrFail(); // 没有就抛 EntityNotFoundError
```

链式写法（条件会动态加减时更清晰）：

```ts
.where('user.id = :id', { id: 1 })
.orWhere('user.name = :name', { name: 'Timber' })
```

假数据：

| id | name |
| --- | --- |
| 1 | Alice |
| 2 | Timber |

`id=1 OR name='Timber'` → 两行都命中。`getOne` 只拿其中一条——要唯一结果就收紧条件。

**优先级：** `AND` 比 `OR` 绑得紧。混用时加括号：

```ts
// 管理员，或者（活跃且成年）
.where(
  'user.role = :role OR (user.isActive = :active AND user.age > :age)',
  { role: 'admin', active: true, age: 18 },
)
```

还有 `NOT`：取反，例如 `.where('NOT user.isActive = :a', { a: true })`，更常见是直接 `user.isActive = false`。

---

### 场景 3：比较大小、不等 → `=` `<>` `>` `>=` `<` `<=`

**业务：** 积分不低于 100；排除某个状态。

```ts
// 积分 >= 100
.where('user.score >= :min', { min: 100 })

// 不等于（也有人写 !=，多数库两者都行）
.where('user.status <> :s', { s: 'banned' })

// 创建时间早于某天
.where('user.createdAt < :deadline', { deadline: new Date('2024-01-01') })
```

| 符号 | 含义 |
| --- | --- |
| `=` | 等于 |
| `<>` / `!=` | 不等于 |
| `>` `>=` `<` `<=` | 大于 / 大于等于 / 小于 / 小于等于 |

---

### 场景 4：落在区间里 → `BETWEEN`

**业务：** 年龄 18～30；订单金额 100～500。

```sql
WHERE user.age BETWEEN 18 AND 30
-- 等价于 age >= 18 AND age <= 30（一般含两端）
```

```ts
.where('user.age BETWEEN :min AND :max', { min: 18, max: 30 })

.where('order.amount BETWEEN :lo AND :hi', { lo: 100, hi: 500 })
```

---

### 场景 5：匹配一批值 → `IN` / `NOT IN`

**业务：** id 在 `[1, 2, 5]` 里；角色不是 guest/banned。

```sql
WHERE user.id IN (1, 2, 5)
WHERE user.role NOT IN ('guest', 'banned')
```

```ts
.where('user.id IN (:...ids)', { ids: [1, 2, 5] })
// TypeORM 的 :...ids 会展开成多个参数，别自己拼 "1,2,5" 字符串

.where('user.role NOT IN (:...roles)', { roles: ['guest', 'banned'] })
```

批量「按主键列表拉实体」几乎必用 `IN`。

---

### 场景 6：模糊搜索 → `LIKE`

**业务：** 名字包含 `Tim`；邮箱以 `@gmail.com` 结尾。

```sql
WHERE user.name LIKE '%Tim%'      -- 包含
WHERE user.email LIKE '%@gmail.com' -- 后缀
WHERE user.name LIKE 'Tim%'       -- 前缀（更容易走索引）
```

通配符：`%` = 任意多字符；`_` = 刚好一个字符。

```ts
.where('user.name LIKE :kw', { kw: '%Tim%' })
.where('user.email LIKE :suffix', { suffix: '%@gmail.com' })
```

Postgres 大小写不敏感可用 `ILIKE`（MySQL 通常靠校对规则 / `LOWER`）。

**别把用户输入直接拼进字符串**，用 `:kw` 参数，防注入。

---

### 场景 7：判空 → `IS NULL` / `IS NOT NULL`

**业务：** 还没填手机号；已经绑定微信。

```sql
WHERE user.phone IS NULL
WHERE user.wechatId IS NOT NULL
```

```ts
.where('user.phone IS NULL')
.where('user.wechatId IS NOT NULL')
```

**坑：** `WHERE user.phone = NULL` 在 SQL 里**不对**（结果不是你想的）；判空必须用 `IS NULL`。

软删场景也常见：`deletedAt IS NULL` 表示未删除（若没用 TypeORM 的 `@DeleteDateColumn` 自动过滤）。

---

### 场景 8：统计行数 → `COUNT`

**业务：** 活跃用户有多少人。

```sql
SELECT COUNT(user.id) AS cnt FROM users user WHERE user.isActive = true
```

```ts
const { cnt } = await userRepo
  .createQueryBuilder('user')
  .select('COUNT(user.id)', 'cnt')
  .where('user.isActive = :a', { a: true })
  .getRawOne();
// → { cnt: '42' }  （驱动常返回字符串，需要时 Number(cnt)）
```

| 写法 | 差异直觉 |
| --- | --- |
| `COUNT(*)` | 数行数 |
| `COUNT(user.phone)` | 数 phone **非 NULL** 的行 |
| `COUNT(DISTINCT user.city)` | 去重后再数 |

聚合结果不是完整实体 → 用 **`getRawOne` / `getRawMany`**，不要 `getOne`。

---

### 场景 9：加总 / 平均 / 最大最小 → `SUM` `AVG` `MAX` `MIN`

**业务：** 全站照片总数；平均分；最高分。

```sql
SELECT SUM(user.photosCount) AS total FROM users user
SELECT AVG(user.score) AS avgScore FROM users user
SELECT MAX(user.score) AS maxScore, MIN(user.score) AS minScore FROM users user
```

```ts
// SUM：求和
const { total } = await userRepo
  .createQueryBuilder('user')
  .select('SUM(user.photosCount)', 'total')
  .getRawOne();

// AVG：平均
const { avgScore } = await userRepo
  .createQueryBuilder('user')
  .select('AVG(user.score)', 'avgScore')
  .getRawOne();

// MAX / MIN
const { maxScore, minScore } = await userRepo
  .createQueryBuilder('user')
  .select('MAX(user.score)', 'maxScore')
  .addSelect('MIN(user.score)', 'minScore')
  .getRawOne();
```

| 函数 | 含义 | 典型业务 |
| --- | --- | --- |
| `SUM(x)` | 求和 | 销量、积分、照片数加总 |
| `AVG(x)` | 平均 | 均分、客单价 |
| `MAX(x)` / `MIN(x)` | 最大 / 最小 | 最高分、最早创建时间 |

TypeORM 文档经典例子：

```ts
const { sum } = await userRepo
  .createQueryBuilder('user')
  .select('SUM(user.photosCount)', 'sum') // ① 表达式  ② 结果别名
  .where('user.id = :id', { id: 1 })
  .getRawOne();
```

`.select(表达式, 别名)` → `SELECT 表达式 AS 别名`。

---

### 场景 10：分组统计 → `GROUP BY`（可加 `HAVING`）

**业务：** 按姓氏统计人数 / 照片总数；只看照片总数 > 10 的姓氏。

```sql
SELECT user.lastName AS lastName, SUM(user.photosCount) AS total
FROM users user
GROUP BY user.lastName
HAVING SUM(user.photosCount) > 10
```

```ts
const rows = await userRepo
  .createQueryBuilder('user')
  .select('user.lastName', 'lastName')
  .addSelect('SUM(user.photosCount)', 'total')
  .groupBy('user.lastName')
  .having('SUM(user.photosCount) > :min', { min: 10 })
  .getRawMany();
// → [ { lastName: 'Saw', total: '15' }, ... ]
```

| | `WHERE` | `HAVING` |
| --- | --- | --- |
| 时机 | **分组前**过滤行 | **分组后**过滤组 |
| 例子 | 只统计活跃用户 | 只保留「总和 > 10」的组 |

```ts
.where('user.isActive = :a', { a: true })      // 先丢掉 inactive
.groupBy('user.lastName')
.having('COUNT(user.id) >= :n', { n: 2 })      // 再丢掉人数不足的姓
```

---

### 场景 11：排序 → `ORDER BY`

**业务：** 最新注册的在前；同分再按名字。

```sql
ORDER BY user.createdAt DESC, user.name ASC
```

```ts
.orderBy('user.createdAt', 'DESC')
.addOrderBy('user.name', 'ASC')
```

`ASC` 升序（默认），`DESC` 降序。

---

### 场景 12：翻页 → `LIMIT` / `OFFSET`（QB 里常用 `take` / `skip`）

**业务：** 第 3 页，每页 10 条 → 跳过 20，取 10。

```sql
LIMIT 10 OFFSET 20
```

```ts
.orderBy('user.id', 'ASC')
.skip(20)  // OFFSET
.take(10)  // LIMIT
.getMany();
```

列表接口几乎总是：`WHERE`（筛）+ `ORDER BY`（排）+ `skip/take`（页）。

---

### 场景 13：去重 → `DISTINCT`

**业务：** 用户来自哪些城市（城市名不重复）。

```sql
SELECT DISTINCT user.city AS city FROM users user
```

```ts
await userRepo
  .createQueryBuilder('user')
  .select('DISTINCT user.city', 'city')
  .getRawMany();
```

或 `COUNT(DISTINCT user.city)` 数有多少个不同城市。

---

### 场景 14：空值兜底 → `COALESCE`

**业务：** 展示名优先用昵称，没有就用登录名。

```sql
SELECT COALESCE(user.nickname, user.name) AS displayName FROM users user
```

```ts
.select('COALESCE(user.nickname, user.name)', 'displayName')
.getRawMany();
```

`COALESCE(a, b, c)` = 从左到右第一个非 NULL。

---

### 和「查实体」怎么选

| 你想要 | 做法 |
| --- | --- |
| `User` / `User[]` 对象 | `getOne` / `getMany`（SELECT 实体列） |
| 个数、总和、分组报表 | `COUNT`/`SUM`/… + `getRawOne` / `getRawMany` |
| 条件组合 | `AND`/`OR`/`IN`/`LIKE`/`IS NULL`… 写在 `where` |

### 记忆口诀（SQL 场景）

- **筛行：** `AND`/`OR`、比较符、`BETWEEN`、`IN`、`LIKE`、`IS NULL`  
- **算数：** `COUNT`/`SUM`/`AVG`/`MAX`/`MIN` → 配合 `getRaw*`  
- **分组：** `GROUP BY` 切片；组后过滤用 `HAVING`  
- **列表：** `ORDER BY` + `skip`/`take`  
- **判空用 `IS NULL`，别写 `= NULL`**  
- **参数用 `:name` / `:...ids`，别拼接用户输入**  

