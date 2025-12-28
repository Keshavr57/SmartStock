import { Hero } from "@/components/Hero"
import { StatsCards } from "@/components/StatsCards"
import { MarketTable } from "@/components/MarketTable"

export default function Home() {
    return (
        <div className="flex-1 overflow-y-auto">
            <Hero />
            <StatsCards />
            <MarketTable />
        </div>
    )
}
