import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import DogCard from '../components/DogCard'
import BottomNav from '../components/BottomNav'
import WaggingDog from '../components/WaggingDog'
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
            className="size-11 rounded-full bg-coral flex items-center justify-center text-white active:bg-coral-deep shadow-sm"
          >
            <Plus size={22} />
          </button>
        }
      />

      <div className="px-6 mt-4 flex flex-col gap-3">
        {mockDogs.map((dog, i) => (
          <DogCard key={dog.id} dog={dog} nextStay={getNextStay(dog.id)} index={i} />
        ))}
      </div>

      {mockDogs.length === 0 && (
        <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
          <WaggingDog size={120} className="animate-pop-in" />
          <p className="font-gabarito font-extrabold text-[22px] text-text-primary">No dogs yet</p>
          <p className="font-gabarito text-[14px] text-text-secondary">
            Tap + to add your first dog.
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
