import { useState } from 'react'
import EditableTable from './EditableTable'
import './App.css'

function App() {
  const [title, setTitle] = useState('Editable Table')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
  }

  const startEditingTitle = () => {
    setIsEditingTitle(true)
  }

  const stopEditingTitle = () => {
    setIsEditingTitle(false)
  }

  return (
    <div className="App">
      {isEditingTitle ? (
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={stopEditingTitle}
          onKeyDown={(e) => e.key === 'Enter' && stopEditingTitle()}
          className="title-input"
          autoFocus
        />
      ) : (
        <h1 onClick={startEditingTitle}>{title}</h1>
      )}
      <EditableTable />
    </div>
  )
}

export default App
