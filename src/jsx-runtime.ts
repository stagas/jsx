type DOMElement = Element

declare global {
  namespace JSX {
    type Element = DOMElement
    interface IntrinsicElements {
      [k: string]: unknown
    }
  }
}

export const refs: Record<string, Element> = {}

export const fns = {
  mapItemFn: (item: any): any => item,
  addEventListenerFn: (el: Element, name: string, item: any): void => {
    el.addEventListener(name, item, false)
  },
  computedAttributeFn: (el: Element, attrib: string, fn: any): void => {
    el.setAttribute(attrib, fn())
  }
}

const flatAndFilter = (children: any[]) =>
  children
    .flat(Infinity)
    .map(fns.mapItemFn)
    .filter(el =>
      el instanceof Node
      || typeof el === 'string'
      || typeof el === 'number'
      || el instanceof String
      || el instanceof Number
    )

type HTMLElWithRef = Element & { ref?: string }

export function getRefs(
  el: HTMLElWithRef | HTMLElWithRef[],
  refs: any = {}
): { [key: string]: Element } {
  if (Array.isArray(el)) {
    el.forEach((_e) => getRefs(_e, refs))
    return refs
  }
  const refKey = el.getAttribute && el.getAttribute('ref')
  if (refKey) refs[refKey] = refs[refKey] ? [refs[refKey], el].flat(Infinity) : el

  if (el.children) {
    Array.from(el.children).forEach((c) => {
      getRefs(c as HTMLElWithRef, refs)
    })
  }
  return refs
}

export const Fragment = ({ children }: any) => flatAndFilter(children)

let isSvg = false

export function svg(fn: () => JSX.Element): JSX.Element {
  isSvg = true
  const result = fn()
  isSvg = false
  return result
}

const SvgTags = new Set(`svg path circle rect`.split(' '))

export function _h(tagName: string | Function | Element, attrs: { [key: string]: any} , key: string) {
  attrs.children = Array.isArray(attrs.children)
    ? attrs.children
    : attrs.children == null
      ? []
      : [attrs.children]

  if (typeof tagName === 'function') return tagName(attrs)
  if (tagName instanceof Element) return tagName

  const el: any = isSvg || SvgTags.has(tagName)
    ? document.createElementNS('http://www.w3.org/2000/svg', tagName)
    : document.createElement(tagName)

  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'children') continue
      // const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), key)
      // const isReadOnly = !!(descriptor?.get && !descriptor.set)
      // if (!isReadOnly) {
      //   el[key] = val
      // }
      if (val == null)
        continue

      if (key === 'style' && typeof attrs.style !== 'string') {
        Object.assign(el.style, attrs.style)
      }
      else if (key.startsWith('on')) {
        const name = key.substring(2).toLowerCase()
        fns.addEventListenerFn(el, name, val)
      }
      else if (typeof val === 'function') {
        fns.computedAttributeFn(el, key, val)
      }
      else if (val !== false) {
        el.setAttribute(key, val)
      }
      else {
        el[key] = val
      }
    }
  }

  el.append(...(flatAndFilter(attrs.children)) as (Node | string)[])

  Object.assign(refs, getRefs(el))

  return el
}

export const jsx = _h
export const jsxs = _h
export const jsxDEV = _h
export const jsxSvg = _h
