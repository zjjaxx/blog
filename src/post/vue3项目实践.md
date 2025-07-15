## 如何设计和规划组件
- 单一功能原理，也就是说，一个组件理想情况下应仅做一件事情
- 在大型项目中，自下而上构建更简单。
- 单向数据流
- 对一个复杂的页面，可以拆分成多个组件，这不仅可以避免页面中逻辑过于复杂而造成难以维护，而且有利于状态更新，因为vue是以组件为单位进行diff比较，组件内的状态更新不会影响组件外，同时为了遵循单向数据流，只把公共的数据提到父组件中

## 组件中的数据如何优雅地透传

1. `$attrs`属性 除了props中声明的属性外的其余属性

2. `v-bind="$attrs"`

3. 插槽透传，遍历 `$slots`

   ```vue
   <template v-for="(_,name) in $slots" #[name]="scopedData">
   	<slot :name='name' v-bind="scopedData"></slot>
   </template>
   ```

4. ref透传（曲线救国）

   ```js
   for(const key in this.$refs.elInp){
   		this[key]=this.$refs.elInp[key]
   }
   ```

5. 使用computed拦截v-model,场景为父组件使用v-model将modelValue传递给子组件，但是子组件将modelValue传给了组件库中某个组件的v-model，导致组件库直接修改了父组件的modelValue，打破了单向数据流。 在vueuse中有[useVModels](https://vueuse.org/core/useVModels/#usevmodels)hook函数可以做到，原理还是使用computed拦截v-model

   