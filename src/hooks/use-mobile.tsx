import * as React from "react"
import { capacitorService } from "@/services/capacitorService"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsNativeMobile() {
  const [isNative, setIsNative] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    setIsNative(capacitorService.isNative())
  }, [])
  
  return isNative
}

export function usePlatform() {
  const [platform, setPlatform] = React.useState<string>('web')
  
  React.useEffect(() => {
    setPlatform(capacitorService.getPlatform())
  }, [])
  
  return platform
}