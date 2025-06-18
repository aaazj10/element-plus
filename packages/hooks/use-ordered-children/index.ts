import { isVNode, shallowRef, h, triggerRef } from 'vue'
import { flattedChildren } from '@element-plus/utils'

import type { ComponentInternalInstance, VNode } from 'vue'

const getOrderedChildren = <T>(
  vm: ComponentInternalInstance,
  childComponentName: string,
  children: Record<number, T>
): T[] => {
  const nodes = flattedChildren(vm.subTree).filter(
    (n): n is VNode =>
      isVNode(n) &&
      (n.type as any)?.name === childComponentName &&
      !!n.component
  )
  const uids = nodes.map((n) => n.component!.uid)
  return uids.map((uid) => children[uid]).filter((p) => !!p)
}

export const useOrderedChildren = <T extends { uid: number }>(
  vm: ComponentInternalInstance,
  childComponentName: string
) => {
  const children = shallowRef<Record<number, T>>({})
  const orderedChildren = shallowRef<T[]>([])

  const onMoved = () => {
    triggerRef(children)
  }

  const addChild = (child: T) => {
    children.value[child.uid] = child
    triggerRef(children)
  }

  const removeChild = (uid: number) => {
    delete children.value[uid]
    triggerRef(children)
  }

  const sortChildren = () => {
    orderedChildren.value = getOrderedChildren(
      vm,
      childComponentName,
      children.value
    )
  }

  const EffectIsolation = (props: { render: any }) => {
    return props.render()
  }
  const ChildrenSorter = (
    _: {},
    { slots }: { slots: { default?: () => VNode } }
  ) => {
    sortChildren()

    return h(EffectIsolation, {
      render: () => {
        return slots.default ? slots.default() : null
      },
    })
  }

  return {
    children: orderedChildren,
    addChild,
    removeChild,
    ChildrenSorter,
  }
}
