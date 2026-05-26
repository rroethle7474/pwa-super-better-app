import { useEffect, useState, useCallback } from 'react'
import { Search, X, Download, Clock } from 'lucide-react'
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
      <div className="page center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-shell">
        <p className="sl-eyebrow">Archive</p>
        <h1 className="sl-page-title">History.</h1>

        <div className="history-toolbar">
          <div className="history-search">
            <Search size={16} className="history-search-icon" />
            <input
              className="history-search-input"
              placeholder="Search entries…"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {query.length > 0 && (
              <button
                type="button"
                className="history-search-clear"
                onClick={() => handleSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {entries.length > 0 && (
            <button
              type="button"
              className="sl-button ghost small"
              onClick={handleExport}
            >
              <Download size={14} />
              <span className="history-export-label">Export</span>
            </button>
          )}
        </div>

        {entries.length > 0 && (
          <div className="sl-section-header">
            <h2 className="sl-section-title">
              {query ? `${entries.length} ${entries.length === 1 ? 'match' : 'matches'}` : 'All entries'}
            </h2>
          </div>
        )}

        {entries.map((entry) => (
          <EntryCard
            key={entry.date}
            entry={entry}
            onPress={() => setSelectedEntry(entry)}
          />
        ))}

        {entries.length === 0 && (
          <div className="sl-empty">
            <div className="sl-empty-icon">
              <Clock size={22} />
            </div>
            <p className="sl-empty-title">
              {query ? 'Nothing matches that.' : 'No reflections yet.'}
            </p>
            <p className="sl-empty-text">
              {query
                ? 'Try a different word or clear the search.'
                : 'Once you start journaling, your entries will collect here.'}
            </p>
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
