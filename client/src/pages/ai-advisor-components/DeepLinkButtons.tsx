interface DeepLink {
  label: string
  href: string
}

interface DeepLinkButtonsProps {
  content: string
}

export function getDeepLinks(content: string): DeepLink[] {
  const links: DeepLink[] = []
  const lowerContent = content.toLowerCase()

  if (lowerContent.includes('compare') || lowerContent.includes('vs') || lowerContent.includes('versus')) {
    links.push({ label: 'Open Compare →', href: '/compare' })
  }
  if (lowerContent.includes('ipo')) {
    links.push({ label: 'View IPOs →', href: '/ipos' })
  }
  if (lowerContent.includes('news') || lowerContent.includes('market update')) {
    links.push({ label: 'Read News →', href: '/news' })
  }
  if (lowerContent.includes('portfolio') || lowerContent.includes('virtual') || lowerContent.includes('paper trading')) {
    links.push({ label: 'Virtual Trading →', href: '/virtual-trading' })
  }
  if (lowerContent.includes('learn') || lowerContent.includes('tutorial') || lowerContent.includes('basics')) {
    links.push({ label: 'Learn More →', href: '/learn' })
  }

  return links
}

export function DeepLinkButtons({ content }: DeepLinkButtonsProps) {
  const links = getDeepLinks(content)

  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {links.map((link, idx) => (
        <a
          key={idx}
          href={link.href}
          className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full text-xs font-medium transition-colors border border-purple-100"
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}
