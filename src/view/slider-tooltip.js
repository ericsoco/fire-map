import React from 'react';
import PropTypes from 'prop-types';
import { useValueFormatter } from '@nivo/core';

/**
 * Generator for a tooltip displaying a single { key: value } pair.
 * Used by e.g. Bar, Radial, Scatterplot.
 */
export function getPointTooltipProps() {
  function PointTooltip(point) {
    // Loosely follows logic in Nivo's BasicTooltip
    const { id, value, color, format } = point;
    const formatter = useValueFormatter(format);
    const formattedValue = formatter ? formatter(value) : value;
    return (
      <Tooltip
        rows={[
          {
            datum: {
              key: id,
              value: formattedValue,
            },
            legend: {
              color: color,
              // TODO: Nivo doesn't appear to support / expose these values
              style: 'solid',
              width: '1px',
            },
          },
        ]}
      />
    );
  }

  return {
    tooltip: PointTooltip,
    theme: {
      tooltip: {
        container: {
          background: 'rgba(0,0,0,0)',
          borderRadius: 0,
          boxShadow: 'none',
          padding: 0,
        },
      },
    },
  };
}

const ROW_HEIGHT = '0.75rem';

export default function Tooltip({ titleRow, rows }) {
  const isSingleRow = !titleRow && rows.length === 1;
  return (
    // TODO: How to address styling in this library?
    // Would be nice to avoid a whole styling library
    // for such minimal needs, and accept styling via theme...
    <div
      style={{
        minWidth: '8rem',
        padding: isSingleRow
          ? `0.5rem ${ROW_HEIGHT}`
          : `0.5rem ${ROW_HEIGHT} ${ROW_HEIGHT} ${ROW_HEIGHT}`,
        background: '#ffffff',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 1px 2px',
      }}
    >
      {titleRow && renderTitleRow(titleRow)}
      <ul
        style={{
          margin: isSingleRow ? 0 : `${ROW_HEIGHT} 0 0 0`,
          paddingLeft: 0,
          listStyle: 'none',
        }}
      >
        {rows.map((row, i) => (
          <li key={`${row.datum.key}-${String(i)}`}>{renderRow(row)}</li>
        ))}
      </ul>
    </div>
  );
}

const row = PropTypes.shape({ key: PropTypes.string, value: PropTypes.any });
Tooltip.propTypes = {
  titleRow: row,
  rows: PropTypes.arrayOf(row),
};

function renderTitleRow({ datum }) {
  return (
    <div
      style={{
        width: '100%',
        height: '1.75rem',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        padding: '3px 0',
        borderBottom: '1px solid rgba(0,0,0,0.25)',
      }}
    >
      {datum.value}
    </div>
  );
}
renderTitleRow.propTypes = { datum: row };

function renderRow({ datum }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 0',
      }}
    >
      <div>
        <span>{datum.key}</span>
      </div>
      <div style={{ marginLeft: '2rem' }}>
        <strong>{datum.value}</strong>
      </div>
    </div>
  );
}
renderRow.propTypes = { datum: row };
