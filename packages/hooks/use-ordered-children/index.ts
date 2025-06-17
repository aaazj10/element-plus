import { isVNode, shallowRef, h } from 'vue'
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
  const children = shallowRef<T[]>([])
  const orderedChildren = shallowRef<T[]>([])

  const addChild = (child: T) => {
    children.value.push(child)
  }

  const removeChild = (uid: number) => {
    const index = children.value.findIndex((child) => child.uid === uid)
    children.value.splice(index, 1)
  }

  const sortChildren = () => {
    orderedChildren.value = getOrderedChildren(
      vm,
      childComponentName,
      Object.fromEntries(children.value.map((child) => [child.uid, child]))
    )
  }

  const TestWrapper = (
    _: {},
    { slots }: { slots: { default?: () => VNode } }
  ) => {
    return slots.default ? slots.default() : null
  }

  const ChildrenSorter = (
    _: {},
    { slots }: { slots: { default?: () => VNode } }
  ) => {
    sortChildren()

    return h(TestWrapper, null, {
      default: () => {
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
