import { useEffect, useState, useCallback } from 'react'
import { Search, X, Download } from 'lucide-react'
import {
  getAllEntries,
  searchEntries,
  exportAllEntries,
  deleteEntry,
  type DailyEntry,
} from '../utils/storage'
import { APP_EXPORT_PREFIX } from '../utils/constants'
import EntryCard from '../components/EntryCard'
import EntryDetailModal from '../components/EntryDetailModal'
import { HistoryEmptyState } from '../components/EmptyStates'
import './History.css'

export default function HistoryPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [query, setQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async (searchQuery: string) => {
    const results = searchQuery
      ? await searchEntries(searchQuery)
      : await getAllEntries()
    setEntries(results)
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadEntries('')
      setLoading(false)
    }
    init()
  }, [loadEntries])

  const handleSearch = async (text: string) => {
    setQuery(text)
    await loadEntries(text)
  }

  const handleExport = async () => {
    const data = await exportAllEntries()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${APP_EXPORT_PREFIX}-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-content">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content">
        {/* Search Bar */}
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input
            className="search-input"
            placeholder="Search entries..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {query.length > 0 && (
            <button className="search-clear" onClick={() => handleSearch('')}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Export button */}
        {entries.length > 0 && (
          <button className="export-btn" onClick={handleExport}>
            <Download size={16} />
            Export Journal
          </button>
        )}

        {/* Entry List */}
        {entries.map((entry) => (
          <EntryCard
            key={entry.date}
            entry={entry}
            onPress={() => setSelectedEntry(entry)}
          />
        ))}

        {entries.length === 0 && (
          <div className="empty-state">
            <HistoryEmptyState />
            <p className="empty-text">
              {query ? 'No matching entries' : 'No entries yet'}
            </p>
            {!query && <p className="empty-subtext">Your reflections will appear here</p>}
          </div>
        )}
      </div>

      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDelete={async (date) => {
            await deleteEntry(date)
            setSelectedEntry(null)
            await loadEntries(query)
          }}
        />
      )}
    </div>
  )
}
