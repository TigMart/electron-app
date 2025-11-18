import { type Icon } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { useTranslation } from 'react-i18next'

export function NavMain({
  items
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (url: string) => {
    if (url === '/') {
      return location.pathname === url
    }
    return location.pathname.startsWith(url)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={uuid()}>
              <SidebarMenuButton tooltip={item.title} isActive={isActive(item.url)} asChild>
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{t(item.title)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
