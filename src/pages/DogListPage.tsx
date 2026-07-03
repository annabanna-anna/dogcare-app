import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import DogCard from '../components/DogCard'
import BottomNav from '../components/BottomNav'
import { mockDogs } from '../data/mockDogs'
import { mockStays } from '../data/mockStays'

export default function DogListPage() {
  const navigate = useNavigate()
  const now = new Date()

  function getNextStay(dogId: string) {
    return mockStays
      .filter((s) => s.dogId === dogId && new Date(s.endDate) >= now)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader
        title="Dogs"
        right={
          <button
            onClick={() => navigate('/dogs/new')}
            className="size-10 rounded-full bg-coral flex items-center justify-center text-white active:bg-[#e04428] shadow-sm"
          >
            <Plus size={22} />
          </button>
        }
      />

      <div className="px-6 mt-4 flex flex-col gap-3">
        {mockDogs.map((dog) => (
          <DogCard key={dog.id} dog={dog} nextStay={getNextStay(dog.id)} />
        ))}
      </div>

      {mockDogs.length === 0 && (
        <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">🐕</span>
          <p className="font-gabarito font-bold text-[17px] text-text-primary">No dogs yet</p>
          <p className="font-gabarito text-[14px] text-text-secondary">
            Tap + to add your first dog.
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
