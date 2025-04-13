import React, { useState, useRef } from 'react';
import './EditableTable.css';

const EditableTable = () => {
  const [headers, setHeaders] = useState(['Column 1']);
  const [rows, setRows] = useState([['']]);
  const [editingCell, setEditingCell] = useState(null);
  const [columnWidths, setColumnWidths] = useState({});
  const fileInputRef = useRef(null);
  const resizingColumn = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
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

  const addHeader = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setRows(rows.map(row => [...row, '']));
  };

  const addRow = () => {
    setRows([...rows, Array(headers.length).fill('')]);
  };

  const deleteColumn = (index) => {
    if (headers.length <= 1) return; // Don't delete the last column
    const newHeaders = headers.filter((_, i) => i !== index);
    const newRows = rows.map(row => row.filter((_, i) => i !== index));
    setHeaders(newHeaders);
    setRows(newRows);
  };

  const deleteRow = (index) => {
    if (rows.length <= 1) return; // Don't delete the last row
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleHeaderChange = (index, value) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
  };

  const startEditing = (rowIndex, colIndex) => {
    setEditingCell({ rowIndex, colIndex });
  };

  const stopEditing = () => {
    setEditingCell(null);
  };

  const startResizing = (index, e) => {
    resizingColumn.current = index;
    startX.current = e.clientX;
    const th = e.target.parentElement;
    startWidth.current = th.offsetWidth;
    document.addEventListener('mousemove', handleResizing);
    document.addEventListener('mouseup', stopResizing);
  };

  const handleResizing = (e) => {
    if (resizingColumn.current === null) return;
    
    const width = startWidth.current + (e.clientX - startX.current);
    if (width < 50) return; // Minimum width of 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn.current]: width
    }));
  };

  const stopResizing = () => {
    resizingColumn.current = null;
    document.removeEventListener('mousemove', handleResizing);
    document.removeEventListener('mouseup', stopResizing);
  };

  const downloadCSV = () => {
    // Get the h1 tag's content for the filename
    const h1Element = document.querySelector('h1');
    const fileName = h1Element ? h1Element.textContent : 'table_data';

    // Escape special characters in headers and cells
    const escapeCSV = (str) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Create CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setTitle(file.name.replace(/\.csv$/, ''));
    console.log(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      
      if (lines.length < 1) return;

      // Parse CSV content
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      };

      // Parse headers and rows
      const newHeaders = parseCSVLine(lines[0]);
      const newRows = lines.slice(1)
        .filter(line => line.trim())
        .map(line => parseCSVLine(line));

      // Update table state
      setHeaders(newHeaders);
      setRows(newRows);
    };

    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="table-container">

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

      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th 
                key={index}
                style={{ width: columnWidths[index] ? `${columnWidths[index]}px` : 'auto' }}
              >
                <div className="header-cell">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className="header-input"
                  />
                  <button 
                    className="delete-column-btn"
                    onClick={() => deleteColumn(index)}
                    title="Delete column"
                  >
                    ×
                  </button>
                </div>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => startResizing(index, e)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex}>
                  {editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex ? (
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      onBlur={stopEditing}
                      autoFocus
                    />
                  ) : (
                    <div onClick={() => startEditing(rowIndex, colIndex)}>
                      {cell || 'Click to edit'}
                    </div>
                  )}
                </td>
              ))}
              <td className="delete-row-cell">
                <button 
                  className="delete-row-btn"
                  onClick={() => deleteRow(rowIndex)}
                  title="Delete row"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="controls">
        <button onClick={addHeader}>Add Column</button>
        <button onClick={addRow}>Add Row</button>
        <button onClick={downloadCSV}>Download CSV</button>
        <button onClick={triggerFileInput}>Upload CSV</button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default EditableTable; 
