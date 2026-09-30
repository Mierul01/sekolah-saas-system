import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { isBreakSlot, abbrSubject, subjectLabel } from './constants'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value) {
  const s = String(value ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// CSV opens natively in Excel/Google Sheets — no extra dependency needed for
// a real spreadsheet library, and the UTF-8 BOM keeps accented text intact.
export function exportToExcel(filename, headers, rows) {
  const lines = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))]
  const csv = '﻿' + lines.join('\r\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`)
}

function sameSingleEntry(cell, entry) {
  return Boolean(cell) && cell.length === 1 && cell[0].subject === entry.subject && cell[0].secondary === entry.secondary
}

// No dedicated "form teacher" assignment exists yet, so the teacher who
// appears most often across a class's own slots stands in for it on print.
// (Only meaningful for the student/class grid — a teacher's own grid already
// names them in the page title.)
function mostFrequentSecondary(group) {
  const counts = new Map()
  Object.values(group.cells).forEach((entries) =>
    entries.forEach((c) => counts.set(c.secondary, (counts.get(c.secondary) || 0) + 1))
  )
  let best = null
  let bestCount = 0
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }
  return best
}

// Builds one day's row of cells, merging consecutive periods that hold the
// exact same subject+secondary (teacher, for a class grid; class, for a
// teacher grid) into one wide cell (colSpan) and marking the recess period
// as its own shaded "REHAT" column, so the grid reads at a glance instead of
// repeating the same lesson across several columns.
function buildGridRow(day, group) {
  const row = [day]
  let i = 0
  while (i < group.timeSlots.length) {
    const slot = group.timeSlots[i]
    if (isBreakSlot(slot)) {
      row.push({ content: 'REHAT', styles: { fillColor: [235, 236, 240], textColor: 110, fontStyle: 'bold' } })
      i++
      continue
    }
    const cell = group.cells[`${day}|${slot}`]
    const label = !cell || cell.length === 0 ? '' : cell.map((c) => `${abbrSubject(c.subject)}\n${c.secondary}`).join('\n\n')

    let span = 1
    if (cell && cell.length === 1) {
      while (
        i + span < group.timeSlots.length &&
        !isBreakSlot(group.timeSlots[i + span]) &&
        sameSingleEntry(group.cells[`${day}|${group.timeSlots[i + span]}`], cell[0])
      ) {
        span++
      }
    }
    row.push(span > 1 ? { content: label, colSpan: span } : label)
    i += span
  }
  return row
}

// Renders a proper class timetable grid (days as rows, time slots as
// columns) — one page per class — so it can be printed/shared with students
// or parents, instead of a flat record list.
export function exportTimetableGridPdf(filename, schoolName, groups, language = 'ms', mode = 'kelas') {
  const pdf = new jsPDF({ orientation: 'landscape' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 8
  const dayColWidth = 18

  const heading = language === 'en' ? `TIMETABLE - ${schoolName.toUpperCase()}` : `JADUAL WAKTU ${schoolName.toUpperCase()}`
  const classTeacherLabel = language === 'en' ? 'Class Teacher' : 'Guru Kelas'

  groups.forEach((group, idx) => {
    if (idx > 0) pdf.addPage()
    pdf.setFontSize(13)
    pdf.setFont(undefined, 'bold')
    pdf.text(heading, pageWidth / 2, 12, { align: 'center' })
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(11)
    pdf.text(group.title, pageWidth / 2, 19, { align: 'center' })
    if (group.subtitle) {
      pdf.setFontSize(9)
      pdf.setTextColor(100)
      pdf.text(group.subtitle, pageWidth / 2, 25, { align: 'center' })
      pdf.setTextColor(0)
    }
    if (mode === 'kelas') {
      const classTeacher = mostFrequentSecondary(group)
      if (classTeacher) {
        pdf.setFontSize(9)
        pdf.text(`${classTeacherLabel}: ${classTeacher}`, pageWidth - margin, 19, { align: 'right' })
      }
    }

    // Fixed, equal-width time columns — letting autoTable size columns by
    // content squeezes short headers (e.g. "8.30 - 9.00") next to a column
    // holding a long subject name, wrapping the time label into three lines.
    const timeColWidth = (pageWidth - margin * 2 - dayColWidth) / group.timeSlots.length
    const columnStyles = { 0: { fontStyle: 'bold', fillColor: [240, 242, 247], fontSize: 8.5, cellWidth: dayColWidth } }
    group.timeSlots.forEach((_, i) => {
      columnStyles[i + 1] = { cellWidth: timeColWidth }
    })

    const gridStartY = group.subtitle ? 30 : 24
    autoTable(pdf, {
      head: [['', ...group.timeSlots]],
      body: group.days.map((day) => buildGridRow(day, group)),
      startY: gridStartY,
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
        minCellHeight: 14,
        overflow: 'linebreak',
        lineWidth: 0.3,
        lineColor: [40, 40, 40],
      },
      headStyles: { fillColor: [11, 31, 63], textColor: 255, fontSize: 7, lineWidth: 0.3, lineColor: [40, 40, 40] },
      columnStyles,
    })

    // Key/legend for the subject codes used in this class's grid, printed
    // underneath as a two-per-row grid — codes drawn bold so they stand out
    // from the spelled-out name next to them — instead of a single wrapped
    // paragraph.
    const usedSubjects = new Set()
    Object.values(group.cells).forEach((entries) => entries.forEach((c) => usedSubjects.add(c.subject)))
    if (usedSubjects.size > 0) {
      const pairs = [...usedSubjects]
        .map((s) => ({ code: abbrSubject(s), name: subjectLabel(s, language) }))
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((p) => ({ ...p, content: `${p.code}: ${p.name}` }))
      const legendRows = []
      for (let i = 0; i < pairs.length; i += 2) {
        legendRows.push([pairs[i], pairs[i + 1] ?? ''])
      }
      autoTable(pdf, {
        body: legendRows,
        startY: pdf.lastAutoTable.finalY + 4,
        margin: { left: margin, right: margin },
        theme: 'plain',
        styles: { fontSize: 7.5, textColor: 90, cellPadding: 1.5 },
        columnStyles: { 0: { cellWidth: (pageWidth - margin * 2) / 2 }, 1: { cellWidth: (pageWidth - margin * 2) / 2 } },
        didParseCell: (data) => {
          // Keep a single blank line (not zero) so the row height calc still
          // reserves normal single-line space — an empty array collapses the
          // row height, which made adjacent legend rows overlap.
          if (data.cell.raw && typeof data.cell.raw === 'object') data.cell.text = ['']
        },
        didDrawCell: (data) => {
          const pair = data.cell.raw
          if (!pair || typeof pair !== 'object') return
          const x = data.cell.x + data.cell.padding('left')
          const y = data.cell.y + data.cell.height / 2 + 1
          pdf.setFontSize(7.5)
          pdf.setTextColor(90)
          pdf.setFont(undefined, 'bold')
          pdf.text(`${pair.code}:`, x, y)
          const codeWidth = pdf.getTextWidth(`${pair.code}: `)
          pdf.setFont(undefined, 'normal')
          pdf.text(pair.name, x + codeWidth, y)
        },
      })
    }
  })

  pdf.save(`${filename}.pdf`)
}

export function exportToPdf(filename, title, headers, rows) {
  const pdf = new jsPDF()
  pdf.setFontSize(13)
  pdf.text(title, 14, 15)
  autoTable(pdf, {
    head: [headers],
    body: rows,
    startY: 20,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [11, 31, 63], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 248, 252] },
  })
  pdf.save(`${filename}.pdf`)
}
