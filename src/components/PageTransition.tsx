import { useRef, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const tabOrder = ['/', '/journal', '/history', '/goals', '/settings']

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [animClass, setAnimClass] = useState('page-enter')
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname === prevPath.current) {
      setDisplayChildren(children)
      return
    }

    const prevIndex = tabOrder.indexOf(prevPath.current)
    const nextIndex = tabOrder.indexOf(location.pathname)
    const goingRight = nextIndex > prevIndex

    // Exit current page
    setAnimClass(goingRight ? 'page-exit-left' : 'page-exit-right')

    const timeout = setTimeout(() => {
      prevPath.current = location.pathname
      setDisplayChildren(children)
      setAnimClass(goingRight ? 'page-enter-right' : 'page-enter-left')
    }, 150)

    return () => clearTimeout(timeout)
  }, [location.pathname, children])

  return (
    <div className={`page-transition ${animClass}`}>
      {displayChildren}
    </div>
  )
}
