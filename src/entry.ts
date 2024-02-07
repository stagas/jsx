export type Off = () => void
export type Start = () => Off
export type Factory = (target: HTMLElement) => Off
export function mount(sel: string, fn: Factory): Start
export function mount(el: HTMLElement, fn: Factory): Start
export function mount(sel: string | HTMLElement, fn: Factory): Start {
  return function start() {
    const target = sel instanceof HTMLElement
      ? sel
      : document.querySelector<HTMLElement>(sel)!
    return fn(target)
  }
}

export function hmr(start: Start, state: Record<string, any>, replaceState: (x: Record<string, any>) => void) {
  if (!import.meta.hot) return () => { }

  let dispose: Off | null
  try {
    const json = JSON.stringify({ ...state })
    const first = import.meta.hot.data.first
    out: {
      if (first) {
        if (json === first) {
          const current = import.meta.hot.data.state
          if (current) {
            if (Object.keys(state).join() === Object.keys(current).join()) {
              replaceState(current)
              break out
            }
          }
        }
      }
      import.meta.hot.data.first = json
    }
    dispose = start()
    import.meta.hot.data.top = true
    import.meta.hot.data.state = state
    import.meta.hot.on('vite:beforeUpdate', () => {
      dispose?.()
      dispose = null
    })
  }
  catch (error) {
    // TODO: let it crash so vite catches it?
    console.warn('HMR has been destroyed due to unexpected error.', error)
    // location.href = location.href
  }
  return (x: any) => {
    dispose?.()
    dispose = null
    if (import.meta.hot!.data.top) return
    dispose = x.start()
    import.meta.hot!.data.top = false
  }
}
