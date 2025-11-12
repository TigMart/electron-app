import type { BreadcrumbItem } from '../../types/fileManager'
import { IconHome, IconChevronRight } from '@tabler/icons-react'
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemComponent,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '../ui/breadcrumb'

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  onNavigate: (path: string) => void
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItemComponent key={item.path}>
            {index < items.length - 1 ? (
              <>
                <BreadcrumbLink
                  onClick={() => onNavigate(item.path)}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  {index === 0 && <IconHome size={16} />}
                  {item.name}
                </BreadcrumbLink>
                <BreadcrumbSeparator>
                  <IconChevronRight size={16} />
                </BreadcrumbSeparator>
              </>
            ) : (
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            )}
          </BreadcrumbItemComponent>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
