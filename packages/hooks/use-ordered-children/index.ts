import { isVNode, shallowRef } from 'vue'
import { flattedChildren } from '@element-plus/utils'

import type { ComponentInternalInstance, Slots, VNode } from 'vue'

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
  let shouldSortChildren = false
  const children: Record<number, T> = {}
  const orderedChildren = shallowRef<T[]>([])

  const addChild = (child: T) => {
    children[child.uid] = child
    orderedChildren.value = [...orderedChildren.value, child]
    if (vm.isMounted) shouldSortChildren = true
  }
  const removeChild = (uid: number) => {
    delete children[uid]
    orderedChildren.value = orderedChildren.value.filter(
      (children) => children.uid !== uid
    )
  }
  const sortChildren = () => {
    if (!shouldSortChildren) return

    orderedChildren.value = getOrderedChildren(vm, childComponentName, children)
    shouldSortChildren = false
  }

  return {
    children: orderedChildren,
    addChild,
    removeChild,
    sortChildren,
    ChildrenSorter: (
      props: { sort: typeof sortChildren },
      { slots }: { slots: Slots }
    ) => {
      props.sort()

      return slots.default?.()
    },
  }
}
