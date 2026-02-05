import React, { useState, useMemo } from 'react';
import styles from './SortableTable.module.css';

/**
 * Reusable sortable + paginated table component.
 *
 * Props:
 *  - columns: [{ key, label, sortable?, render?, align?, width? }]
 *  - data: array of row objects
 *  - defaultSort: { key, direction: 'asc'|'desc' }
 *  - pageSize: number (0 = no pagination)
 *  - onRowClick: (row) => void
 *  - colors: theme color object from getThemeColors()
 *  - rowKey: string field name or (row,index)=>key
 *  - emptyMessage: string
 */
export default function SortableTable({
  columns = [],
  data = [],
  defaultSort = null,
  pageSize = 25,
  onRowClick,
  colors,
  rowKey = 'id',
  emptyMessage = 'No data',
}) {
  const [sort, setSort] = useState(defaultSort || { key: null, direction: 'asc' });
  const [page, setPage] = useState(0);

  const sortedData = useMemo(() => {
    if (!sort.key) return data;
    const col = columns.find(c => c.key === sort.key);
    return [...data].sort((a, b) => {
      let va = a[sort.key];
      let vb = b[sort.key];
      // Handle custom sort value
      if (col?.sortValue) {
        va = col.sortValue(a);
        vb = col.sortValue(b);
      }
      // Numeric comparison
      if (typeof va === 'number' && typeof vb === 'number') {
        return sort.direction === 'asc' ? va - vb : vb - va;
      }
      // Try numeric parse
      const na = Number(va);
      const nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb)) {
        return sort.direction === 'asc' ? na - nb : nb - na;
      }
      // String comparison
      const sa = String(va || '').toLowerCase();
      const sb = String(vb || '').toLowerCase();
      if (sa < sb) return sort.direction === 'asc' ? -1 : 1;
      if (sa > sb) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sort, columns]);

  const totalPages = pageSize > 0 ? Math.ceil(sortedData.length / pageSize) : 1;
  const paginatedData = pageSize > 0 ? sortedData.slice(page * pageSize, (page + 1) * pageSize) : sortedData;

  const handleSort = (key) => {
    const col = columns.find(c => c.key === key);
    if (!col?.sortable) return;
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(0);
  };

  const getKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    return row[rowKey] ?? index;
  };

  if (data.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: colors?.textSecondary, fontSize: 13 }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableScroll}>
        <table className={styles.table} style={{ borderColor: colors?.border }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`${styles.th} ${col.sortable ? styles.sortable : ''}`}
                  style={{
                    backgroundColor: colors?.cardBg,
                    color: colors?.textSecondary,
                    borderColor: colors?.border,
                    textAlign: col.align || 'left',
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                  }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && sort.key === col.key && (
                    <span className={styles.sortArrow}>
                      {sort.direction === 'asc' ? ' \u25B2' : ' \u25BC'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr
                key={getKey(row, page * pageSize + i)}
                className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                style={{
                  backgroundColor: i % 2 === 0 ? colors?.rowBgAlt : colors?.rowBg,
                  borderColor: colors?.border,
                }}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={styles.td}
                    style={{
                      color: colors?.textPrimary,
                      borderColor: colors?.border,
                      textAlign: col.align || 'left',
                    }}
                  >
                    {col.render ? col.render(row, colors) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && totalPages > 1 && (
        <div className={styles.pagination} style={{ borderColor: colors?.border }}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            style={{ color: colors?.accentBlue, borderColor: colors?.border }}
          >
            Prev
          </button>
          <span style={{ color: colors?.textSecondary, fontSize: 13 }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            style={{ color: colors?.accentBlue, borderColor: colors?.border }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
