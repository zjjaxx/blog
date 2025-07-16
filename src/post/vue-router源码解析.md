## 项目实践

### 封装router back方法

::: tip

用于直接用URL打开某个页面链接的场景

:::

先获取当前应用中是否有之前的路由记录，如果有则返回上一个路由记录，没有则返回首页

```typescript
import { useRouter } from 'vue-router'
import { LANDING_URL } from '@/routers/config'
export const useBack = () => {
    const router = useRouter()
    const back = () => {
        if(window.history.state?.back){
            router.back()
        }
        else {
            router.replace(LANDING_URL)
        }
    }
    return {
        back,
    }
}
```
